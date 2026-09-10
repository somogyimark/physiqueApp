import type { SQLiteDatabase } from 'expo-sqlite';

import type { ProgressPointRow, SetRow } from '@/db/rows';
import type { ProgressPoint, ProgressRange, WorkoutSet } from '@/domain/models';
import { toSetType } from '@/domain/models';
import {
  annotateSetsWithPrs,
  countNewPrs,
  EMPTY_PR_CONTEXT,
  extendPrContext,
  type PrContext,
} from '@/domain/pr';
import { dayKeyDaysAgo } from '@/lib/date';

import { getWorkoutDetail, mapSet } from './workouts';

/**
 * A max. súlyt / becsült 1RM-et adó típusok SQL-listája. A drop-set lépcsők és
 * a bemelegítők kimaradnak — ők csak a volumenbe számítanak.
 */
const STRENGTH_TYPES_SQL = `('normal', 'one_rep_max', 'to_failure')`;

/**
 * Egy gyakorlat edzésenkénti mutatói időrendben — ez táplálja a progressz-grafikont.
 * A bemelegítő szettek és a folyamatban lévő edzés kimaradnak; a drop-set lépcsők
 * a volumenbe beszámítanak, de a max. súlyba / 1RM-be nem.
 */
export async function getProgressSeries(
  db: SQLiteDatabase,
  exerciseId: number,
  range: ProgressRange = null
): Promise<ProgressPoint[]> {
  const params: (number | string)[] = [exerciseId];
  let rangeCondition = '';

  if (range !== null) {
    rangeCondition = 'AND w.day >= ?';
    params.push(dayKeyDaysAgo(range));
  }

  const rows = await db.getAllAsync<ProgressPointRow>(
    `SELECT w.id AS workout_id,
            w.performed_at,
            w.day,
            MAX(CASE WHEN s.type IN ${STRENGTH_TYPES_SQL} THEN s.weight_kg END) AS max_weight,
            SUM(CASE WHEN s.type != 'warmup' THEN s.reps * s.weight_kg END)     AS volume,
            MAX(CASE WHEN s.type IN ${STRENGTH_TYPES_SQL}
                     THEN s.weight_kg * (1 + s.reps / 30.0) END)               AS est_1rm,
            COUNT(CASE WHEN s.type != 'warmup' THEN 1 END)                      AS set_count
       FROM workouts w
       JOIN workout_exercises we ON we.workout_id = w.id
       JOIN sets s               ON s.workout_exercise_id = we.id
      WHERE we.exercise_id = ?
        AND w.status = 'completed'
        ${rangeCondition}
      GROUP BY w.id
      HAVING set_count > 0
      ORDER BY w.performed_at ASC`,
    params
  );

  return rows.map((row) => ({
    workoutId: row.workout_id,
    performedAt: row.performed_at,
    day: row.day,
    maxWeight: row.max_weight ?? 0,
    volume: row.volume ?? 0,
    est1rm: row.est_1rm ?? 0,
    setCount: row.set_count,
  }));
}

/**
 * A rekordok állapota egy adott edzés ELŐTT. Csak korábbi edzések szettjei
 * számítanak, így egy visszamenőleg rögzített edzés nem kap PR-t a nála
 * későbbi teljesítmények miatt.
 */
export async function getPrContext(
  db: SQLiteDatabase,
  exerciseId: number,
  options: { beforePerformedAt: string; excludeWorkoutId?: number }
): Promise<PrContext> {
  const rows = await db.getAllAsync<{ reps: number; weight_kg: number; type: string }>(
    `SELECT s.reps, s.weight_kg, s.type
       FROM sets s
       JOIN workout_exercises we ON we.id = s.workout_exercise_id
       JOIN workouts w           ON w.id = we.workout_id
      WHERE we.exercise_id = ?
        AND s.type IN ${STRENGTH_TYPES_SQL}
        AND w.performed_at < ?
        AND w.id IS NOT ?
      ORDER BY w.performed_at ASC, s.set_index ASC`,
    exerciseId,
    options.beforePerformedAt,
    options.excludeWorkoutId ?? null
  );

  return rows.reduce(
    (context, row) =>
      extendPrContext(context, {
        reps: row.reps,
        weightKg: row.weight_kg,
        type: toSetType(row.type),
      }),
    EMPTY_PR_CONTEXT
  );
}

export type PreviousSession = {
  workoutId: number;
  performedAt: string;
  sets: WorkoutSet[];
};

/**
 * A gyakorlat legutóbbi korábbi edzése — a szettmező előtöltéséhez és a
 * „legutóbb ennyit nyomtál" tájékoztatáshoz.
 */
export async function getPreviousSession(
  db: SQLiteDatabase,
  exerciseId: number,
  options: { beforePerformedAt: string; excludeWorkoutId?: number }
): Promise<PreviousSession | null> {
  const workout = await db.getFirstAsync<{ id: number; performed_at: string }>(
    `SELECT w.id, w.performed_at
       FROM workouts w
       JOIN workout_exercises we ON we.workout_id = w.id
       JOIN sets s               ON s.workout_exercise_id = we.id
      WHERE we.exercise_id = ?
        AND w.performed_at < ?
        AND w.id IS NOT ?
      ORDER BY w.performed_at DESC
      LIMIT 1`,
    exerciseId,
    options.beforePerformedAt,
    options.excludeWorkoutId ?? null
  );

  if (!workout) return null;

  const rows = await db.getAllAsync<SetRow>(
    `SELECT s.* FROM sets s
       JOIN workout_exercises we ON we.id = s.workout_exercise_id
      WHERE we.workout_id = ? AND we.exercise_id = ?
      ORDER BY s.set_index ASC`,
    workout.id,
    exerciseId
  );

  return {
    workoutId: workout.id,
    performedAt: workout.performed_at,
    sets: rows.map(mapSet),
  };
}

export type ExerciseBests = {
  sessionCount: number;
  bestWeight: number | null;
  bestE1rm: number | null;
  bestVolume: number | null;
  lastPerformedAt: string | null;
};

/** A gyakorlat csúcsai a progressz-képernyő összegző kártyájához. */
export async function getExerciseBests(
  db: SQLiteDatabase,
  exerciseId: number
): Promise<ExerciseBests> {
  const series = await getProgressSeries(db, exerciseId, null);

  if (series.length === 0) {
    return {
      sessionCount: 0,
      bestWeight: null,
      bestE1rm: null,
      bestVolume: null,
      lastPerformedAt: null,
    };
  }

  const maxOrNull = (values: number[]): number | null => {
    const positive = values.filter((value) => value > 0);
    return positive.length > 0 ? Math.max(...positive) : null;
  };

  return {
    sessionCount: series.length,
    bestWeight: maxOrNull(series.map((point) => point.maxWeight)),
    bestE1rm: maxOrNull(series.map((point) => point.est1rm)),
    bestVolume: maxOrNull(series.map((point) => point.volume)),
    lastPerformedAt: series[series.length - 1].performedAt,
  };
}

/** Azok a gyakorlatok, amelyekhez van már lezárt edzésadat — a progressz-választóhoz. */
export async function listExercisesWithData(
  db: SQLiteDatabase
): Promise<{ id: number; name: string; sessionCount: number }[]> {
  return db.getAllAsync<{ id: number; name: string; sessionCount: number }>(
    `SELECT e.id, e.name, COUNT(DISTINCT w.id) AS sessionCount
       FROM exercises e
       JOIN workout_exercises we ON we.exercise_id = e.id
       JOIN workouts w           ON w.id = we.workout_id
       JOIN sets s               ON s.workout_exercise_id = we.id
      WHERE w.status = 'completed' AND s.type != 'warmup'
      GROUP BY e.id
      ORDER BY e.name COLLATE NOCASE ASC`
  );
}

export type DatabaseStats = {
  exercises: number;
  workouts: number;
  sets: number;
  schemaVersion: number;
};

export async function getDatabaseStats(db: SQLiteDatabase): Promise<DatabaseStats> {
  const row = await db.getFirstAsync<{
    exercises: number;
    workouts: number;
    sets: number;
  }>(
    `SELECT (SELECT COUNT(*) FROM exercises) AS exercises,
            (SELECT COUNT(*) FROM workouts)  AS workouts,
            (SELECT COUNT(*) FROM sets)      AS sets`
  );

  const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');

  return {
    exercises: row?.exercises ?? 0,
    workouts: row?.workouts ?? 0,
    sets: row?.sets ?? 0,
    schemaVersion: version?.user_version ?? 0,
  };
}

/**
 * Hány szett döntött rekordot ebben az edzésben — a befejezéskori összegzőhöz.
 * Edzésenként néhány lekérdezés, csak a "Befejezés" gombra fut le.
 */
export async function getWorkoutPrCount(
  db: SQLiteDatabase,
  workoutId: number
): Promise<number> {
  const detail = await getWorkoutDetail(db, workoutId);
  if (!detail) return 0;

  let count = 0;
  for (const block of detail.exercises) {
    const context = await getPrContext(db, block.exerciseId, {
      beforePerformedAt: detail.performedAt,
      excludeWorkoutId: detail.id,
    });
    count += countNewPrs(annotateSetsWithPrs(block.sets, context));
  }

  return count;
}

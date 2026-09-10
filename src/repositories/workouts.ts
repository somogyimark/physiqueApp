import type { SQLiteDatabase } from 'expo-sqlite';

import type { SetRow, WorkoutExerciseRow, WorkoutRow, WorkoutSummaryRow } from '@/db/rows';
import {
  toMuscleGroup,
  toSetType,
  toWorkoutStatus,
  type Workout,
  type WorkoutDetail,
  type WorkoutExercise,
  type WorkoutSet,
  type WorkoutStatus,
  type WorkoutSummary,
} from '@/domain/models';
import { dayKeyFromIso, nowIso } from '@/lib/date';

function mapWorkout(row: WorkoutRow): Workout {
  return {
    id: row.id,
    performedAt: row.performed_at,
    day: row.day,
    title: row.title,
    notes: row.notes,
    status: toWorkoutStatus(row.status),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    templateId: row.template_id,
  };
}

export function mapSet(row: SetRow): WorkoutSet {
  return {
    id: row.id,
    workoutExerciseId: row.workout_exercise_id,
    setIndex: row.set_index,
    reps: row.reps,
    weightKg: row.weight_kg,
    rpe: row.rpe,
    type: toSetType(row.type),
    groupId: row.group_id,
    groupIndex: row.group_index,
  };
}

/** A folyamatban lévő edzés (legfeljebb egy lehet). */
export async function getActiveWorkout(db: SQLiteDatabase): Promise<Workout | null> {
  const row = await db.getFirstAsync<WorkoutRow>(
    `SELECT * FROM workouts WHERE status = 'in_progress' ORDER BY performed_at DESC LIMIT 1`
  );
  return row ? mapWorkout(row) : null;
}

export async function createWorkout(
  db: SQLiteDatabase,
  options: { performedAt?: string; title?: string | null; templateId?: number | null } = {}
): Promise<number> {
  const performedAt = options.performedAt ?? nowIso();
  const timestamp = nowIso();

  const result = await db.runAsync(
    `INSERT INTO workouts (performed_at, day, title, status, created_at, updated_at, template_id)
     VALUES (?, ?, ?, 'in_progress', ?, ?, ?)`,
    performedAt,
    dayKeyFromIso(performedAt),
    options.title ?? null,
    timestamp,
    timestamp,
    options.templateId ?? null
  );
  return result.lastInsertRowId;
}

/** Egy edzés minden adata: blokkok pozíció szerint, azon belül szettek sorrendben. */
export async function getWorkoutDetail(
  db: SQLiteDatabase,
  id: number
): Promise<WorkoutDetail | null> {
  const workoutRow = await db.getFirstAsync<WorkoutRow>(
    'SELECT * FROM workouts WHERE id = ?',
    id
  );
  if (!workoutRow) return null;

  const blockRows = await db.getAllAsync<
    WorkoutExerciseRow & { exercise_name: string; muscle_group: string }
  >(
    `SELECT we.*, e.name AS exercise_name, e.muscle_group
       FROM workout_exercises we
       JOIN exercises e ON e.id = we.exercise_id
      WHERE we.workout_id = ?
      ORDER BY we.position ASC`,
    id
  );

  const setRows = await db.getAllAsync<SetRow>(
    `SELECT s.* FROM sets s
       JOIN workout_exercises we ON we.id = s.workout_exercise_id
      WHERE we.workout_id = ?
      ORDER BY s.set_index ASC, s.id ASC`,
    id
  );

  const setsByBlock = new Map<number, WorkoutSet[]>();
  for (const row of setRows) {
    const list = setsByBlock.get(row.workout_exercise_id) ?? [];
    list.push(mapSet(row));
    setsByBlock.set(row.workout_exercise_id, list);
  }

  const exercises: WorkoutExercise[] = blockRows.map((row) => ({
    id: row.id,
    workoutId: row.workout_id,
    exerciseId: row.exercise_id,
    exerciseName: row.exercise_name,
    muscleGroup: toMuscleGroup(row.muscle_group),
    position: row.position,
    notes: row.notes,
    sets: setsByBlock.get(row.id) ?? [],
  }));

  return { ...mapWorkout(workoutRow), exercises };
}

/**
 * Edzések listája összegzett mutatókkal. Az aggregálás korrelált allekérdezésekkel
 * történik, hogy egy körben meglegyen minden, amit a listakártya kirajzol.
 */
export async function listWorkoutSummaries(
  db: SQLiteDatabase,
  options: { limit?: number; offset?: number; status?: WorkoutStatus } = {}
): Promise<WorkoutSummary[]> {
  const { limit = 200, offset = 0, status } = options;
  const where = status ? 'WHERE w.status = ?' : '';
  const params: (string | number)[] = status ? [status, limit, offset] : [limit, offset];

  const rows = await db.getAllAsync<WorkoutSummaryRow>(
    `SELECT w.*,
       (SELECT COUNT(*) FROM workout_exercises we WHERE we.workout_id = w.id) AS exercise_count,
       (SELECT COUNT(*) FROM sets s
           JOIN workout_exercises we ON we.id = s.workout_exercise_id
          WHERE we.workout_id = w.id) AS set_count,
       (SELECT SUM(s.reps * s.weight_kg) FROM sets s
           JOIN workout_exercises we ON we.id = s.workout_exercise_id
          WHERE we.workout_id = w.id AND s.type != 'warmup') AS total_volume
       FROM workouts w
       ${where}
      ORDER BY w.performed_at DESC
      LIMIT ? OFFSET ?`,
    params
  );

  const namesByWorkout = await listExerciseNames(
    db,
    rows.map((row) => row.id)
  );

  return rows.map((row) => ({
    ...mapWorkout(row),
    exerciseCount: row.exercise_count,
    setCount: row.set_count,
    totalVolume: row.total_volume ?? 0,
    exerciseNames: namesByWorkout.get(row.id) ?? [],
  }));
}

/**
 * A listakartyakon megjelenő gyakorlatnevek — egyetlen lekerdezessel az osszes
 * edzeshez, hogy ne legyen N+1 problema.
 */
async function listExerciseNames(
  db: SQLiteDatabase,
  workoutIds: readonly number[]
): Promise<Map<number, string[]>> {
  const result = new Map<number, string[]>();
  if (workoutIds.length === 0) return result;

  const placeholders = workoutIds.map(() => '?').join(', ');
  const rows = await db.getAllAsync<{ workout_id: number; name: string }>(
    `SELECT we.workout_id, e.name
       FROM workout_exercises we
       JOIN exercises e ON e.id = we.exercise_id
      WHERE we.workout_id IN (${placeholders})
      ORDER BY we.workout_id ASC, we.position ASC`,
    [...workoutIds]
  );

  for (const row of rows) {
    const list = result.get(row.workout_id) ?? [];
    list.push(row.name);
    result.set(row.workout_id, list);
  }

  return result;
}

export async function updateWorkout(
  db: SQLiteDatabase,
  id: number,
  patch: { title?: string | null; notes?: string | null; performedAt?: string }
): Promise<void> {
  const assignments: string[] = [];
  const params: (string | number | null)[] = [];

  if (patch.title !== undefined) {
    assignments.push('title = ?');
    params.push(patch.title);
  }
  if (patch.notes !== undefined) {
    assignments.push('notes = ?');
    params.push(patch.notes);
  }
  if (patch.performedAt !== undefined) {
    assignments.push('performed_at = ?', 'day = ?');
    params.push(patch.performedAt, dayKeyFromIso(patch.performedAt));
  }
  if (assignments.length === 0) return;

  assignments.push('updated_at = ?');
  params.push(nowIso(), id);

  await db.runAsync(`UPDATE workouts SET ${assignments.join(', ')} WHERE id = ?`, params);
}

export async function finishWorkout(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync(
    `UPDATE workouts SET status = 'completed', updated_at = ? WHERE id = ?`,
    nowIso(),
    id
  );
}

export async function reopenWorkout(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync(
    `UPDATE workouts SET status = 'in_progress', updated_at = ? WHERE id = ?`,
    nowIso(),
    id
  );
}

/** A blokkok és szettek ON DELETE CASCADE miatt automatikusan törlődnek. */
export async function deleteWorkout(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM workouts WHERE id = ?', id);
}

/** Gyakorlat hozzáadása az edzéshez; a lista végére kerül. */
export async function addExerciseToWorkout(
  db: SQLiteDatabase,
  workoutId: number,
  exerciseId: number
): Promise<number> {
  const row = await db.getFirstAsync<{ next: number }>(
    `SELECT COALESCE(MAX(position), 0) + 1 AS next FROM workout_exercises WHERE workout_id = ?`,
    workoutId
  );

  const result = await db.runAsync(
    `INSERT INTO workout_exercises (workout_id, exercise_id, position) VALUES (?, ?, ?)`,
    workoutId,
    exerciseId,
    row?.next ?? 1
  );

  await touchWorkout(db, workoutId);
  return result.lastInsertRowId;
}

export async function removeWorkoutExercise(
  db: SQLiteDatabase,
  workoutExerciseId: number
): Promise<void> {
  const row = await db.getFirstAsync<{ workout_id: number }>(
    'SELECT workout_id FROM workout_exercises WHERE id = ?',
    workoutExerciseId
  );
  if (!row) return;

  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM workout_exercises WHERE id = ?', workoutExerciseId);
    await resequencePositions(db, row.workout_id);
  });

  await touchWorkout(db, row.workout_id);
}

/** A pozíciók 1..n folytonosak maradnak törlés után is. */
async function resequencePositions(db: SQLiteDatabase, workoutId: number): Promise<void> {
  const rows = await db.getAllAsync<{ id: number }>(
    'SELECT id FROM workout_exercises WHERE workout_id = ? ORDER BY position ASC, id ASC',
    workoutId
  );

  for (const [index, row] of rows.entries()) {
    await db.runAsync('UPDATE workout_exercises SET position = ? WHERE id = ?', index + 1, row.id);
  }
}

export async function touchWorkout(db: SQLiteDatabase, workoutId: number): Promise<void> {
  await db.runAsync('UPDATE workouts SET updated_at = ? WHERE id = ?', nowIso(), workoutId);
}

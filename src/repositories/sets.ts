import type { SQLiteDatabase } from 'expo-sqlite';

import type { SetRow } from '@/db/rows';
import type { SetType, WorkoutSet } from '@/domain/models';
import type { DropStage } from '@/domain/drop-set';
import { shortId } from '@/lib/id';

import { mapSet, touchWorkout } from './workouts';

export type SetInput = {
  reps: number;
  weightKg: number;
  rpe?: number | null;
  type?: SetType;
};

async function workoutIdOfBlock(
  db: SQLiteDatabase,
  workoutExerciseId: number
): Promise<number | null> {
  const row = await db.getFirstAsync<{ workout_id: number }>(
    'SELECT workout_id FROM workout_exercises WHERE id = ?',
    workoutExerciseId
  );
  return row?.workout_id ?? null;
}

async function touchOwningWorkout(
  db: SQLiteDatabase,
  workoutExerciseId: number
): Promise<void> {
  const workoutId = await workoutIdOfBlock(db, workoutExerciseId);
  if (workoutId !== null) await touchWorkout(db, workoutId);
}

async function nextSetIndex(db: SQLiteDatabase, workoutExerciseId: number): Promise<number> {
  const row = await db.getFirstAsync<{ next: number }>(
    'SELECT COALESCE(MAX(set_index), 0) + 1 AS next FROM sets WHERE workout_exercise_id = ?',
    workoutExerciseId
  );
  return row?.next ?? 1;
}

export async function listSetsForBlock(
  db: SQLiteDatabase,
  workoutExerciseId: number
): Promise<WorkoutSet[]> {
  const rows = await db.getAllAsync<SetRow>(
    'SELECT * FROM sets WHERE workout_exercise_id = ? ORDER BY set_index ASC, id ASC',
    workoutExerciseId
  );
  return rows.map(mapSet);
}

/** Új szett a blokk végére; a sorszámot magunk számoljuk. */
export async function addSet(
  db: SQLiteDatabase,
  workoutExerciseId: number,
  input: SetInput
): Promise<number> {
  const setIndex = await nextSetIndex(db, workoutExerciseId);

  const result = await db.runAsync(
    `INSERT INTO sets (workout_exercise_id, set_index, reps, weight_kg, rpe, type)
     VALUES (?, ?, ?, ?, ?, ?)`,
    workoutExerciseId,
    setIndex,
    input.reps,
    input.weightKg,
    input.rpe ?? null,
    input.type ?? 'normal'
  );

  await touchOwningWorkout(db, workoutExerciseId);
  return result.lastInsertRowId;
}

/**
 * Drop set hozzáadása: minden lépcső külön `sets` sor `type = 'drop'` típussal,
 * egy közös `group_id`-vel összefűzve. A lépcsők egymást követő `set_index`
 * értékeket kapnak, így a meglévő sorrendezés és újraszámozás változatlanul jó.
 */
export async function addDropSet(
  db: SQLiteDatabase,
  workoutExerciseId: number,
  stages: readonly DropStage[]
): Promise<string | null> {
  if (stages.length === 0) return null;

  const groupId = shortId();
  const firstIndex = await nextSetIndex(db, workoutExerciseId);

  await db.withTransactionAsync(async () => {
    for (const [offset, stage] of stages.entries()) {
      await db.runAsync(
        `INSERT INTO sets
           (workout_exercise_id, set_index, reps, weight_kg, type, group_id, group_index)
         VALUES (?, ?, ?, ?, 'drop', ?, ?)`,
        workoutExerciseId,
        firstIndex + offset,
        stage.reps,
        stage.weightKg,
        groupId,
        offset
      );
    }
  });

  await touchOwningWorkout(db, workoutExerciseId);
  return groupId;
}

export async function updateSet(
  db: SQLiteDatabase,
  setId: number,
  patch: Partial<SetInput>
): Promise<void> {
  const assignments: string[] = [];
  const params: (number | string | null)[] = [];

  if (patch.reps !== undefined) {
    assignments.push('reps = ?');
    params.push(patch.reps);
  }
  if (patch.weightKg !== undefined) {
    assignments.push('weight_kg = ?');
    params.push(patch.weightKg);
  }
  if (patch.rpe !== undefined) {
    assignments.push('rpe = ?');
    params.push(patch.rpe);
  }
  if (patch.type !== undefined) {
    assignments.push('type = ?');
    params.push(patch.type);
  }
  if (assignments.length === 0) return;

  params.push(setId);
  await db.runAsync(`UPDATE sets SET ${assignments.join(', ')} WHERE id = ?`, params);

  const row = await db.getFirstAsync<{ workout_exercise_id: number }>(
    'SELECT workout_exercise_id FROM sets WHERE id = ?',
    setId
  );
  if (row) await touchOwningWorkout(db, row.workout_exercise_id);
}

/**
 * Szett törlése. Ha drop set lépcsőjét törlöd, az egész csoport törlődik
 * (egy drop set egyben egy szett). Törlés után a blokk szettjeit 1..n
 * folytonosra számozzuk.
 */
export async function deleteSet(db: SQLiteDatabase, setId: number): Promise<void> {
  const row = await db.getFirstAsync<{ workout_exercise_id: number; group_id: string | null }>(
    'SELECT workout_exercise_id, group_id FROM sets WHERE id = ?',
    setId
  );
  if (!row) return;

  await db.withTransactionAsync(async () => {
    if (row.group_id) {
      await db.runAsync('DELETE FROM sets WHERE group_id = ?', row.group_id);
    } else {
      await db.runAsync('DELETE FROM sets WHERE id = ?', setId);
    }
    await resequenceSets(db, row.workout_exercise_id);
  });

  await touchOwningWorkout(db, row.workout_exercise_id);
}

async function resequenceSets(db: SQLiteDatabase, workoutExerciseId: number): Promise<void> {
  const rows = await db.getAllAsync<{ id: number }>(
    'SELECT id FROM sets WHERE workout_exercise_id = ? ORDER BY set_index ASC, id ASC',
    workoutExerciseId
  );

  for (const [index, row] of rows.entries()) {
    await db.runAsync('UPDATE sets SET set_index = ? WHERE id = ?', index + 1, row.id);
  }
}

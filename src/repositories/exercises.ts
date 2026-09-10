import type { SQLiteDatabase } from 'expo-sqlite';

import type { ExerciseRow } from '@/db/rows';
import {
  toEquipment,
  toMuscleGroup,
  type Equipment,
  type Exercise,
  type MuscleGroup,
} from '@/domain/models';
import { nowIso } from '@/lib/date';
import { matchesSearch } from '@/lib/search';

import { DuplicateExerciseNameError, isUniqueConstraintError } from './errors';

function mapExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: toMuscleGroup(row.muscle_group),
    equipment: toEquipment(row.equipment),
    notes: row.notes,
    isArchived: row.is_archived === 1,
    createdAt: row.created_at,
  };
}

export type ExerciseFilter = {
  search?: string;
  muscleGroup?: MuscleGroup | null;
  includeArchived?: boolean;
};

export type ExerciseInput = {
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment | null;
  notes: string | null;
};

/**
 * Gyakorlatok listája. Az izomcsoport- és archiválás-szűrés SQL-ben történik,
 * a szöveges keresés viszont JS-ben, mert ékezet-független kell legyen — a tábla
 * néhány száz sornál sosem lesz nagyobb.
 */
export async function listExercises(
  db: SQLiteDatabase,
  filter: ExerciseFilter = {}
): Promise<Exercise[]> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (!filter.includeArchived) {
    conditions.push('is_archived = 0');
  }
  if (filter.muscleGroup) {
    conditions.push('muscle_group = ?');
    params.push(filter.muscleGroup);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = await db.getAllAsync<ExerciseRow>(
    `SELECT * FROM exercises ${where} ORDER BY is_archived ASC, name COLLATE NOCASE ASC`,
    params
  );

  const exercises = rows.map(mapExercise);
  const search = filter.search?.trim();
  if (!search) return exercises;

  return exercises.filter((exercise) => matchesSearch(exercise.name, search));
}

export async function getExercise(db: SQLiteDatabase, id: number): Promise<Exercise | null> {
  const row = await db.getFirstAsync<ExerciseRow>('SELECT * FROM exercises WHERE id = ?', id);
  return row ? mapExercise(row) : null;
}

export async function createExercise(
  db: SQLiteDatabase,
  input: ExerciseInput
): Promise<number> {
  try {
    const result = await db.runAsync(
      `INSERT INTO exercises (name, muscle_group, equipment, notes, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      input.name.trim(),
      input.muscleGroup,
      input.equipment,
      input.notes,
      nowIso()
    );
    return result.lastInsertRowId;
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new DuplicateExerciseNameError();
    throw error;
  }
}

export async function updateExercise(
  db: SQLiteDatabase,
  id: number,
  input: ExerciseInput
): Promise<void> {
  try {
    await db.runAsync(
      `UPDATE exercises SET name = ?, muscle_group = ?, equipment = ?, notes = ? WHERE id = ?`,
      input.name.trim(),
      input.muscleGroup,
      input.equipment,
      input.notes,
      id
    );
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new DuplicateExerciseNameError();
    throw error;
  }
}

/**
 * Archiválás törlés helyett: a gyakorlat eltűnik a választóból, de a régi
 * edzésekben szereplő szettek érintetlenül maradnak.
 */
export async function setExerciseArchived(
  db: SQLiteDatabase,
  id: number,
  archived: boolean
): Promise<void> {
  await db.runAsync('UPDATE exercises SET is_archived = ? WHERE id = ?', archived ? 1 : 0, id);
}

/** Hány edzésben szerepel a gyakorlat (a törlés/archiválás előtti figyelmeztetéshez). */
export async function countWorkoutsForExercise(
  db: SQLiteDatabase,
  id: number
): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(DISTINCT workout_id) AS count FROM workout_exercises WHERE exercise_id = ?`,
    id
  );
  return row?.count ?? 0;
}

/**
 * Végleges törlés — csak akkor engedjük, ha a gyakorlat még sosem szerepelt
 * edzésben és egyetlen sablonban sincs benne.
 */
export async function deleteExerciseIfUnused(
  db: SQLiteDatabase,
  id: number
): Promise<boolean> {
  const usage = await countWorkoutsForExercise(db, id);
  if (usage > 0) return false;

  const templateUsage = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM template_exercises WHERE exercise_id = ?',
    id
  );
  if ((templateUsage?.count ?? 0) > 0) return false;

  await db.runAsync('DELETE FROM exercises WHERE id = ?', id);
  return true;
}

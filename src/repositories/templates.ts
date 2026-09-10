import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  TemplateExerciseRow,
  TemplateRow,
  TemplateSetRow,
  TemplateSummaryRow,
} from '@/db/rows';
import {
  toMuscleGroup,
  toSetType,
  type Template,
  type TemplateDetail,
  type TemplateExercise,
  type TemplateSet,
  type TemplateSummary,
} from '@/domain/models';
import { dayKeyFromIso, nowIso } from '@/lib/date';
import { shortId } from '@/lib/id';

import { getWorkoutDetail } from './workouts';

function mapTemplate(row: TemplateRow): Template {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastUsedAt: row.last_used_at,
  };
}

function mapTemplateSet(row: TemplateSetRow): TemplateSet {
  return {
    id: row.id,
    templateExerciseId: row.template_exercise_id,
    setIndex: row.set_index,
    type: toSetType(row.type),
    targetReps: row.target_reps,
    targetWeightKg: row.target_weight_kg,
    groupId: row.group_id,
    groupIndex: row.group_index,
  };
}

export async function listTemplates(db: SQLiteDatabase): Promise<TemplateSummary[]> {
  const rows = await db.getAllAsync<TemplateSummaryRow>(
    `SELECT t.*,
       (SELECT COUNT(*) FROM template_exercises te WHERE te.template_id = t.id) AS exercise_count,
       (SELECT COUNT(*) FROM template_sets ts
           JOIN template_exercises te ON te.id = ts.template_exercise_id
          WHERE te.template_id = t.id) AS set_count
       FROM templates t
      ORDER BY (t.last_used_at IS NULL) ASC, t.last_used_at DESC, t.name COLLATE NOCASE ASC`
  );

  const namesByTemplate = await listTemplateExerciseNames(
    db,
    rows.map((row) => row.id)
  );

  return rows.map((row) => ({
    ...mapTemplate(row),
    exerciseCount: row.exercise_count,
    setCount: row.set_count,
    exerciseNames: namesByTemplate.get(row.id) ?? [],
  }));
}

async function listTemplateExerciseNames(
  db: SQLiteDatabase,
  templateIds: readonly number[]
): Promise<Map<number, string[]>> {
  const result = new Map<number, string[]>();
  if (templateIds.length === 0) return result;

  const placeholders = templateIds.map(() => '?').join(', ');
  const rows = await db.getAllAsync<{ template_id: number; name: string }>(
    `SELECT te.template_id, e.name
       FROM template_exercises te
       JOIN exercises e ON e.id = te.exercise_id
      WHERE te.template_id IN (${placeholders})
      ORDER BY te.template_id ASC, te.position ASC`,
    [...templateIds]
  );

  for (const row of rows) {
    const list = result.get(row.template_id) ?? [];
    list.push(row.name);
    result.set(row.template_id, list);
  }

  return result;
}

export async function getTemplateDetail(
  db: SQLiteDatabase,
  id: number
): Promise<TemplateDetail | null> {
  const templateRow = await db.getFirstAsync<TemplateRow>(
    'SELECT * FROM templates WHERE id = ?',
    id
  );
  if (!templateRow) return null;

  const blockRows = await db.getAllAsync<
    TemplateExerciseRow & { exercise_name: string; muscle_group: string }
  >(
    `SELECT te.*, e.name AS exercise_name, e.muscle_group
       FROM template_exercises te
       JOIN exercises e ON e.id = te.exercise_id
      WHERE te.template_id = ?
      ORDER BY te.position ASC`,
    id
  );

  const setRows = await db.getAllAsync<TemplateSetRow>(
    `SELECT ts.* FROM template_sets ts
       JOIN template_exercises te ON te.id = ts.template_exercise_id
      WHERE te.template_id = ?
      ORDER BY ts.set_index ASC, ts.id ASC`,
    id
  );

  const setsByBlock = new Map<number, TemplateSet[]>();
  for (const row of setRows) {
    const list = setsByBlock.get(row.template_exercise_id) ?? [];
    list.push(mapTemplateSet(row));
    setsByBlock.set(row.template_exercise_id, list);
  }

  const exercises: TemplateExercise[] = blockRows.map((row) => ({
    id: row.id,
    templateId: row.template_id,
    exerciseId: row.exercise_id,
    exerciseName: row.exercise_name,
    muscleGroup: toMuscleGroup(row.muscle_group),
    position: row.position,
    notes: row.notes,
    sets: setsByBlock.get(row.id) ?? [],
  }));

  return { ...mapTemplate(templateRow), exercises };
}

/**
 * A megadott edzés jelenlegi szerkezetét másolja a sablon gyakorlat- és
 * szett-tábláiba. A drop-set csoportazonosítókat újragenerálja, hogy a sablon
 * teljesen független legyen az edzéstől.
 */
async function copyWorkoutIntoTemplate(
  db: SQLiteDatabase,
  templateId: number,
  workoutId: number
): Promise<void> {
  const workout = await getWorkoutDetail(db, workoutId);
  if (!workout) return;

  for (const block of workout.exercises) {
    const blockResult = await db.runAsync(
      `INSERT INTO template_exercises (template_id, exercise_id, position, notes)
       VALUES (?, ?, ?, ?)`,
      templateId,
      block.exerciseId,
      block.position,
      block.notes
    );
    const templateExerciseId = blockResult.lastInsertRowId;

    const groupIdMap = new Map<string, string>();

    for (const set of block.sets) {
      let groupId: string | null = null;
      if (set.groupId) {
        groupId = groupIdMap.get(set.groupId) ?? shortId();
        groupIdMap.set(set.groupId, groupId);
      }

      await db.runAsync(
        `INSERT INTO template_sets
           (template_exercise_id, set_index, type, target_reps, target_weight_kg, group_id, group_index)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        templateExerciseId,
        set.setIndex,
        set.type,
        set.reps > 0 ? set.reps : null,
        set.weightKg > 0 ? set.weightKg : null,
        groupId,
        set.groupIndex
      );
    }
  }
}

export async function createTemplateFromWorkout(
  db: SQLiteDatabase,
  workoutId: number,
  name: string
): Promise<number> {
  const timestamp = nowIso();
  let templateId = 0;

  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      `INSERT INTO templates (name, created_at, updated_at) VALUES (?, ?, ?)`,
      name.trim(),
      timestamp,
      timestamp
    );
    templateId = result.lastInsertRowId;
    await copyWorkoutIntoTemplate(db, templateId, workoutId);
  });

  return templateId;
}

/** A sablon tartalmát lecseréli a megadott edzés jelenlegi szerkezetére. */
export async function updateTemplateFromWorkout(
  db: SQLiteDatabase,
  templateId: number,
  workoutId: number
): Promise<void> {
  await db.withTransactionAsync(async () => {
    // A template_sets a CASCADE miatt a blokkokkal együtt törlődik.
    await db.runAsync('DELETE FROM template_exercises WHERE template_id = ?', templateId);
    await copyWorkoutIntoTemplate(db, templateId, workoutId);
    await db.runAsync('UPDATE templates SET updated_at = ? WHERE id = ?', nowIso(), templateId);
  });
}

export async function renameTemplate(
  db: SQLiteDatabase,
  id: number,
  name: string
): Promise<void> {
  await db.runAsync(
    'UPDATE templates SET name = ?, updated_at = ? WHERE id = ?',
    name.trim(),
    nowIso(),
    id
  );
}

export async function deleteTemplate(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM templates WHERE id = ?', id);
}

/**
 * Új, folyamatban lévő edzést hoz létre a sablonból: átmásolja a gyakorlatokat
 * és a szetteket a cél-ismétléssel/súllyal. A `template_id` beállításával az
 * edzés képernyőn megjelenik a „Sablon frissítése" lehetőség.
 */
export async function startWorkoutFromTemplate(
  db: SQLiteDatabase,
  templateId: number
): Promise<number> {
  const timestamp = nowIso();
  let workoutId = 0;

  await db.withTransactionAsync(async () => {
    const template = await db.getFirstAsync<TemplateRow>(
      'SELECT * FROM templates WHERE id = ?',
      templateId
    );
    if (!template) throw new Error('A sablon nem található.');

    const workoutResult = await db.runAsync(
      `INSERT INTO workouts (performed_at, day, title, status, created_at, updated_at, template_id)
       VALUES (?, ?, ?, 'in_progress', ?, ?, ?)`,
      timestamp,
      dayKeyFromIso(timestamp),
      template.name,
      timestamp,
      timestamp,
      templateId
    );
    workoutId = workoutResult.lastInsertRowId;

    const blocks = await db.getAllAsync<TemplateExerciseRow>(
      'SELECT * FROM template_exercises WHERE template_id = ? ORDER BY position ASC',
      templateId
    );

    for (const block of blocks) {
      const blockResult = await db.runAsync(
        `INSERT INTO workout_exercises (workout_id, exercise_id, position, notes)
         VALUES (?, ?, ?, ?)`,
        workoutId,
        block.exercise_id,
        block.position,
        block.notes
      );
      const workoutExerciseId = blockResult.lastInsertRowId;

      const sets = await db.getAllAsync<TemplateSetRow>(
        'SELECT * FROM template_sets WHERE template_exercise_id = ? ORDER BY set_index ASC, id ASC',
        block.id
      );

      const groupIdMap = new Map<string, string>();

      for (const set of sets) {
        let groupId: string | null = null;
        if (set.group_id) {
          groupId = groupIdMap.get(set.group_id) ?? shortId();
          groupIdMap.set(set.group_id, groupId);
        }

        await db.runAsync(
          `INSERT INTO sets
             (workout_exercise_id, set_index, reps, weight_kg, type, group_id, group_index)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          workoutExerciseId,
          set.set_index,
          set.target_reps ?? 0,
          set.target_weight_kg ?? 0,
          set.type,
          groupId,
          set.group_index
        );
      }
    }

    await db.runAsync(
      'UPDATE templates SET last_used_at = ? WHERE id = ?',
      timestamp,
      templateId
    );
  });

  return workoutId;
}

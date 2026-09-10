/**
 * Nyers SQLite sor-típusok. Pontosan a séma oszlopneveit tükrözik (snake_case).
 * Az alkalmazás-szintű (camelCase) modellek a `@/domain/models` fájlban vannak,
 * a leképezés kizárólag a repository rétegben történik.
 */

export type ExerciseRow = {
  id: number;
  name: string;
  muscle_group: string;
  equipment: string | null;
  notes: string | null;
  is_archived: number;
  created_at: string;
};

export type WorkoutRow = {
  id: number;
  performed_at: string;
  day: string;
  title: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  template_id: number | null;
};

export type WorkoutExerciseRow = {
  id: number;
  workout_id: number;
  exercise_id: number;
  position: number;
  notes: string | null;
};

export type SetRow = {
  id: number;
  workout_exercise_id: number;
  set_index: number;
  reps: number;
  weight_kg: number;
  rpe: number | null;
  type: string;
  group_id: string | null;
  group_index: number | null;
};

/** Egy edzés összegzett adatai a listanézethez. */
export type WorkoutSummaryRow = WorkoutRow & {
  exercise_count: number;
  set_count: number;
  total_volume: number | null;
};

/** Egy gyakorlat egy edzésre aggregált mutatói (grafikon + PR). */
export type ProgressPointRow = {
  workout_id: number;
  performed_at: string;
  day: string;
  max_weight: number | null;
  volume: number | null;
  est_1rm: number | null;
  set_count: number;
};

/* --- Sablonok ----------------------------------------------------------- */

export type TemplateRow = {
  id: number;
  name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
};

export type TemplateExerciseRow = {
  id: number;
  template_id: number;
  exercise_id: number;
  position: number;
  notes: string | null;
};

export type TemplateSetRow = {
  id: number;
  template_exercise_id: number;
  set_index: number;
  type: string;
  target_reps: number | null;
  target_weight_kg: number | null;
  group_id: string | null;
  group_index: number | null;
};

export type TemplateSummaryRow = TemplateRow & {
  exercise_count: number;
  set_count: number;
};

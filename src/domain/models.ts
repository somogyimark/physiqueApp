/** Alkalmazás-szintű modellek. A repository réteg képezi le rájuk a nyers sorokat. */

export const MUSCLE_GROUPS = ['mell', 'hat', 'lab', 'vall', 'kar', 'has', 'egyeb'] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const EQUIPMENTS = [
  'rud',
  'kezisulyzo',
  'gep',
  'kabel',
  'sajat_testsuly',
  'egyeb',
] as const;
export type Equipment = (typeof EQUIPMENTS)[number];

export type WorkoutStatus = 'in_progress' | 'completed';

/**
 * Szett-típusok:
 *  - `normal`      : sima munka-szett
 *  - `warmup`      : bemelegítő — a volumenbe és a rekordokba sem számít
 *  - `one_rep_max` : 1RM kísérlet (alapból 1 ismétlés), teljes értékű
 *  - `to_failure`  : bukásig / AMRAP, a ténylegesen elért ismétléssel, teljes értékű
 *  - `drop`        : egy drop set lépcsője — csak a volumenbe számít, rekordot nem ad
 */
export const SET_TYPES = ['normal', 'warmup', 'one_rep_max', 'to_failure', 'drop'] as const;
export type SetType = (typeof SET_TYPES)[number];

/** A volumenbe beleszámító típusok (minden, ami nem bemelegítő). */
export function countsForVolume(type: SetType): boolean {
  return type !== 'warmup';
}

/** A max. súly / becsült 1RM / PR-ek szempontjából beszámító típusok. */
export function countsForStrength(type: SetType): boolean {
  return type === 'normal' || type === 'one_rep_max' || type === 'to_failure';
}

export function toSetType(value: string): SetType {
  return (SET_TYPES as readonly string[]).includes(value) ? (value as SetType) : 'normal';
}

export type Exercise = {
  id: number;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment | null;
  notes: string | null;
  isArchived: boolean;
  createdAt: string;
};

export type WorkoutSet = {
  id: number;
  workoutExerciseId: number;
  setIndex: number;
  reps: number;
  weightKg: number;
  rpe: number | null;
  type: SetType;
  /** Drop set esetén a lépcsőket összefűző azonosító; egyébként `null`. */
  groupId: string | null;
  /** A lépcső sorszáma a drop seten belül (0 = a legnehezebb); egyébként `null`. */
  groupIndex: number | null;
};

/** Egy drop set egy blokkon belül: a `type === 'drop'` szettek egy `groupId`-vel. */
export type DropSetGroup = {
  groupId: string;
  stages: WorkoutSet[];
};

export type WorkoutExercise = {
  id: number;
  workoutId: number;
  exerciseId: number;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  position: number;
  notes: string | null;
  sets: WorkoutSet[];
};

export type Workout = {
  id: number;
  performedAt: string;
  day: string;
  title: string | null;
  notes: string | null;
  status: WorkoutStatus;
  createdAt: string;
  updatedAt: string;
  /** Ha sablonból indult, annak az azonosítója — a „Sablon frissítése" gombhoz. */
  templateId: number | null;
};

export type WorkoutDetail = Workout & {
  exercises: WorkoutExercise[];
};

export type WorkoutSummary = Workout & {
  exerciseCount: number;
  setCount: number;
  totalVolume: number;
  exerciseNames: string[];
};

/** A progressz-grafikonon ábrázolható mutatók. */
export const PROGRESS_METRICS = ['maxWeight', 'volume', 'est1rm'] as const;
export type ProgressMetric = (typeof PROGRESS_METRICS)[number];

/** Időtáv-szűrő a grafikonhoz; `null` = teljes előzmény. */
export const PROGRESS_RANGES = [90, 180, 365, null] as const;
export type ProgressRange = (typeof PROGRESS_RANGES)[number];

export type ProgressPoint = {
  workoutId: number;
  performedAt: string;
  day: string;
  maxWeight: number;
  volume: number;
  est1rm: number;
  setCount: number;
};

export function toMuscleGroup(value: string): MuscleGroup {
  return (MUSCLE_GROUPS as readonly string[]).includes(value)
    ? (value as MuscleGroup)
    : 'egyeb';
}

export function toEquipment(value: string | null): Equipment | null {
  if (value === null) return null;
  return (EQUIPMENTS as readonly string[]).includes(value) ? (value as Equipment) : 'egyeb';
}

export function toWorkoutStatus(value: string): WorkoutStatus {
  return value === 'completed' ? 'completed' : 'in_progress';
}

/* --- Sablonok (mentett edzések) ------------------------------------------- */

export type TemplateSet = {
  id: number;
  templateExerciseId: number;
  setIndex: number;
  type: SetType;
  /** Cél-ismétlés; `null`, ha nincs megadva. */
  targetReps: number | null;
  /** Cél-súly kg-ban; `null`, ha nincs megadva. */
  targetWeightKg: number | null;
  groupId: string | null;
  groupIndex: number | null;
};

export type TemplateExercise = {
  id: number;
  templateId: number;
  exerciseId: number;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  position: number;
  notes: string | null;
  sets: TemplateSet[];
};

export type Template = {
  id: number;
  name: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
};

export type TemplateDetail = Template & {
  exercises: TemplateExercise[];
};

export type TemplateSummary = Template & {
  exerciseCount: number;
  setCount: number;
  exerciseNames: string[];
};

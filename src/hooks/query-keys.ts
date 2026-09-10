import type { MuscleGroup, ProgressRange } from '@/domain/models';

/**
 * Egységes cache-kulcsok. Mentés után elég a gyökeret invalidálni
 * (pl. `queryKeys.workouts.all`), és minden érintett képernyő frissül.
 */
export const queryKeys = {
  exercises: {
    all: ['exercises'] as const,
    list: (filter: { search?: string; muscleGroup?: MuscleGroup | null; includeArchived?: boolean }) =>
      ['exercises', 'list', filter] as const,
    detail: (id: number) => ['exercises', 'detail', id] as const,
    usage: (id: number) => ['exercises', 'usage', id] as const,
  },
  workouts: {
    all: ['workouts'] as const,
    list: ['workouts', 'list'] as const,
    active: ['workouts', 'active'] as const,
    detail: (id: number) => ['workouts', 'detail', id] as const,
  },
  templates: {
    all: ['templates'] as const,
    list: ['templates', 'list'] as const,
    detail: (id: number) => ['templates', 'detail', id] as const,
  },
  progress: {
    all: ['progress'] as const,
    series: (exerciseId: number, range: ProgressRange) =>
      ['progress', 'series', exerciseId, range] as const,
    bests: (exerciseId: number) => ['progress', 'bests', exerciseId] as const,
    exercises: ['progress', 'exercises'] as const,
    prContext: (exerciseId: number, workoutId: number) =>
      ['progress', 'pr-context', exerciseId, workoutId] as const,
    previousSession: (exerciseId: number, workoutId: number) =>
      ['progress', 'previous-session', exerciseId, workoutId] as const,
  },
  stats: ['stats'] as const,
} as const;

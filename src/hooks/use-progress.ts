import { useQuery } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import type { ProgressRange } from '@/domain/models';
import { EMPTY_PR_CONTEXT } from '@/domain/pr';
import {
  getDatabaseStats,
  getExerciseBests,
  getPrContext,
  getPreviousSession,
  getProgressSeries,
  listExercisesWithData,
} from '@/repositories/stats';

import { queryKeys } from './query-keys';

export function useProgressSeries(exerciseId: number | null, range: ProgressRange) {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: queryKeys.progress.series(exerciseId ?? 0, range),
    queryFn: () => getProgressSeries(db, exerciseId as number, range),
    enabled: exerciseId !== null,
  });
}

export function useExerciseBests(exerciseId: number | null) {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: queryKeys.progress.bests(exerciseId ?? 0),
    queryFn: () => getExerciseBests(db, exerciseId as number),
    enabled: exerciseId !== null,
  });
}

export function useExercisesWithData() {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: queryKeys.progress.exercises,
    queryFn: () => listExercisesWithData(db),
  });
}

/**
 * A rekordok állapota az edzés előtt — ebből derül ki élőben, hogy egy most
 * rögzített szett új PR-e.
 */
export function usePrContext(
  exerciseId: number | null,
  workout: { id: number; performedAt: string } | null
) {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: queryKeys.progress.prContext(exerciseId ?? 0, workout?.id ?? 0),
    queryFn: () =>
      getPrContext(db, exerciseId as number, {
        beforePerformedAt: workout!.performedAt,
        excludeWorkoutId: workout!.id,
      }),
    enabled: exerciseId !== null && workout !== null,
    initialData: EMPTY_PR_CONTEXT,
  });
}

/** Az előző alkalom szettjei ugyanabból a gyakorlatból (előtöltéshez). */
export function usePreviousSession(
  exerciseId: number | null,
  workout: { id: number; performedAt: string } | null
) {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: queryKeys.progress.previousSession(exerciseId ?? 0, workout?.id ?? 0),
    queryFn: () =>
      getPreviousSession(db, exerciseId as number, {
        beforePerformedAt: workout!.performedAt,
        excludeWorkoutId: workout!.id,
      }),
    enabled: exerciseId !== null && workout !== null,
  });
}

export function useDatabaseStats() {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: () => getDatabaseStats(db),
  });
}

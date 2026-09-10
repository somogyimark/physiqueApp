import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import type { MuscleGroup } from '@/domain/models';
import {
  countWorkoutsForExercise,
  createExercise,
  getExercise,
  listExercises,
  setExerciseArchived,
  updateExercise,
  type ExerciseFilter,
  type ExerciseInput,
} from '@/repositories/exercises';

import { queryKeys } from './query-keys';

export function useExerciseList(filter: ExerciseFilter = {}) {
  const db = useSQLiteContext();
  const key = {
    search: filter.search ?? '',
    muscleGroup: filter.muscleGroup ?? null,
    includeArchived: filter.includeArchived ?? false,
  };

  return useQuery({
    queryKey: queryKeys.exercises.list(key),
    queryFn: () => listExercises(db, filter),
  });
}

export function useExercise(id: number | null) {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: queryKeys.exercises.detail(id ?? 0),
    queryFn: () => getExercise(db, id as number),
    enabled: id !== null,
  });
}

export function useExerciseUsage(id: number | null) {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: queryKeys.exercises.usage(id ?? 0),
    queryFn: () => countWorkoutsForExercise(db, id as number),
    enabled: id !== null,
  });
}

export function useCreateExercise() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ExerciseInput) => createExercise(db, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all }),
  });
}

export function useUpdateExercise() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ExerciseInput }) =>
      updateExercise(db, id, input),
    onSuccess: () => {
      // A gyakorlat neve az edzés- és progressz-nézetekben is megjelenik.
      queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.all });
    },
  });
}

export function useArchiveExercise() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, archived }: { id: number; archived: boolean }) =>
      setExerciseArchived(db, id, archived),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all }),
  });
}

export type { ExerciseFilter, ExerciseInput, MuscleGroup };

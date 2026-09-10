import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import type { WorkoutStatus } from '@/domain/models';
import type { DropStage } from '@/domain/drop-set';
import { addDropSet, addSet, deleteSet, updateSet, type SetInput } from '@/repositories/sets';
import {
  addExerciseToWorkout,
  createWorkout,
  deleteWorkout,
  finishWorkout,
  getActiveWorkout,
  getWorkoutDetail,
  listWorkoutSummaries,
  removeWorkoutExercise,
  updateWorkout,
} from '@/repositories/workouts';

import { queryKeys } from './query-keys';

/**
 * Minden edzés-mutáció ugyanazt a két gyökeret invalidálja: az edzés-nézeteket
 * és a progresszt. Így egyetlen szett mentése után a lista, a részletek és a
 * grafikon is friss adatot mutat.
 */
function useWorkoutMutation<TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
  });
}

export function useActiveWorkout() {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: queryKeys.workouts.active,
    queryFn: () => getActiveWorkout(db),
  });
}

export function useWorkoutList(options: { status?: WorkoutStatus } = {}) {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: [...queryKeys.workouts.list, options.status ?? 'all'],
    queryFn: () => listWorkoutSummaries(db, options),
  });
}

export function useWorkoutDetail(id: number | null) {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: queryKeys.workouts.detail(id ?? 0),
    queryFn: () => getWorkoutDetail(db, id as number),
    enabled: id !== null,
  });
}

export function useCreateWorkout() {
  const db = useSQLiteContext();
  return useWorkoutMutation((options: { title?: string | null } = {}) =>
    createWorkout(db, options)
  );
}

export function useUpdateWorkout() {
  const db = useSQLiteContext();
  return useWorkoutMutation(
    ({
      id,
      patch,
    }: {
      id: number;
      patch: { title?: string | null; notes?: string | null; performedAt?: string };
    }) => updateWorkout(db, id, patch)
  );
}

export function useFinishWorkout() {
  const db = useSQLiteContext();
  return useWorkoutMutation((id: number) => finishWorkout(db, id));
}

export function useDeleteWorkout() {
  const db = useSQLiteContext();
  return useWorkoutMutation((id: number) => deleteWorkout(db, id));
}

export function useAddExerciseToWorkout() {
  const db = useSQLiteContext();
  return useWorkoutMutation(({ workoutId, exerciseId }: { workoutId: number; exerciseId: number }) =>
    addExerciseToWorkout(db, workoutId, exerciseId)
  );
}

export function useRemoveWorkoutExercise() {
  const db = useSQLiteContext();
  return useWorkoutMutation((workoutExerciseId: number) =>
    removeWorkoutExercise(db, workoutExerciseId)
  );
}

export function useAddSet() {
  const db = useSQLiteContext();
  return useWorkoutMutation(
    ({ workoutExerciseId, input }: { workoutExerciseId: number; input: SetInput }) =>
      addSet(db, workoutExerciseId, input)
  );
}

export function useAddDropSet() {
  const db = useSQLiteContext();
  return useWorkoutMutation(
    ({ workoutExerciseId, stages }: { workoutExerciseId: number; stages: DropStage[] }) =>
      addDropSet(db, workoutExerciseId, stages)
  );
}

export function useUpdateSet() {
  const db = useSQLiteContext();
  return useWorkoutMutation(({ setId, patch }: { setId: number; patch: Partial<SetInput> }) =>
    updateSet(db, setId, patch)
  );
}

export function useDeleteSet() {
  const db = useSQLiteContext();
  return useWorkoutMutation((setId: number) => deleteSet(db, setId));
}

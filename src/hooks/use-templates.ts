import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import {
  createTemplateFromWorkout,
  deleteTemplate,
  getTemplateDetail,
  listTemplates,
  renameTemplate,
  startWorkoutFromTemplate,
  updateTemplateFromWorkout,
} from '@/repositories/templates';

import { queryKeys } from './query-keys';

export function useTemplateList() {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: queryKeys.templates.list,
    queryFn: () => listTemplates(db),
  });
}

export function useTemplateDetail(id: number | null) {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: queryKeys.templates.detail(id ?? 0),
    queryFn: () => getTemplateDetail(db, id as number),
    enabled: id !== null,
  });
}

export function useSaveWorkoutAsTemplate() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workoutId, name }: { workoutId: number; name: string }) =>
      createTemplateFromWorkout(db, workoutId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
      // Az edzés template_id-je nem változik itt, de a részletnézet frissüljön.
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts.all });
    },
  });
}

export function useUpdateTemplateFromWorkout() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, workoutId }: { templateId: number; workoutId: number }) =>
      updateTemplateFromWorkout(db, templateId, workoutId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.templates.all }),
  });
}

export function useRenameTemplate() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => renameTemplate(db, id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.templates.all }),
  });
}

export function useDeleteTemplate() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteTemplate(db, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.templates.all }),
  });
}

export function useStartWorkoutFromTemplate() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: number) => startWorkoutFromTemplate(db, templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
    },
  });
}

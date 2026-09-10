import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ExerciseBlock } from '@/components/workout/exercise-block';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { T } from '@/constants/strings';
import { Spacing } from '@/constants/theme';
import type { WorkoutExercise } from '@/domain/models';
import { totalVolume } from '@/domain/metrics';
import { useTheme } from '@/hooks/use-theme';
import {
  useAddDropSet,
  useAddSet,
  useDeleteSet,
  useDeleteWorkout,
  useFinishWorkout,
  useRemoveWorkoutExercise,
  useUpdateSet,
  useUpdateWorkout,
  useWorkoutDetail,
} from '@/hooks/use-workouts';
import { useSaveWorkoutAsTemplate, useUpdateTemplateFromWorkout } from '@/hooks/use-templates';
import { formatWorkoutDate } from '@/lib/date';
import { formatVolume } from '@/lib/format';
import { showActionSheet } from '@/lib/action-sheet';
import { getWorkoutPrCount } from '@/repositories/stats';

export default function WorkoutScreen() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const params = useLocalSearchParams<{ id: string }>();
  const workoutId = Number(params.id);

  const { data: workout, isPending } = useWorkoutDetail(
    Number.isFinite(workoutId) ? workoutId : null
  );

  const updateWorkout = useUpdateWorkout();
  const finishWorkout = useFinishWorkout();
  const deleteWorkout = useDeleteWorkout();
  const removeBlock = useRemoveWorkoutExercise();
  const addSet = useAddSet();
  const addDropSet = useAddDropSet();
  const updateSet = useUpdateSet();
  const deleteSet = useDeleteSet();
  const saveAsTemplate = useSaveWorkoutAsTemplate();
  const updateTemplate = useUpdateTemplateFromWorkout();

  const [title, setTitle] = useState<string | null>(null);

  if (isPending) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator color={theme.accent} />
      </Screen>
    );
  }

  if (!workout) {
    return (
      <Screen>
        <EmptyState title={T.common.error} />
      </Screen>
    );
  }

  const activeWorkout = workout;
  const setCount = activeWorkout.exercises.reduce((sum, block) => sum + block.sets.length, 0);
  const volume = activeWorkout.exercises.reduce((sum, block) => sum + totalVolume(block.sets), 0);
  const defaultTemplateName =
    activeWorkout.title?.trim() || formatWorkoutDate(activeWorkout.performedAt);

  function commitTitle() {
    if (title === null) return;
    const trimmed = title.trim();
    updateWorkout.mutate({
      id: workoutId,
      patch: { title: trimmed === '' ? null : trimmed },
    });
  }

  async function finish() {
    const prCount = await getWorkoutPrCount(db, workoutId);
    finishWorkout.mutate(workoutId, {
      onSuccess: () => {
        Alert.alert(
          T.workouts.finishedTitle,
          prCount > 0 ? T.workouts.newPrs(prCount) : T.workouts.noPrs,
          [{ text: T.common.done, onPress: () => router.back() }]
        );
      },
    });
  }

  function handleFinish() {
    if (setCount === 0) {
      Alert.alert(T.workouts.finish, T.workouts.emptyWorkoutWarning, [
        { text: T.common.cancel, style: 'cancel' },
        { text: T.workouts.finish, onPress: finish },
      ]);
      return;
    }
    void finish();
  }

  function handleDelete() {
    Alert.alert(T.workouts.deleteWorkout, T.workouts.deleteConfirm, [
      { text: T.common.cancel, style: 'cancel' },
      {
        text: T.common.delete,
        style: 'destructive',
        onPress: () => deleteWorkout.mutate(workoutId, { onSuccess: () => router.back() }),
      },
    ]);
  }

  function saveTemplate(name: string) {
    const finalName = name.trim() || defaultTemplateName;
    saveAsTemplate.mutate(
      { workoutId, name: finalName },
      { onSuccess: () => Alert.alert(T.workouts.templateSaved, finalName) }
    );
  }

  function handleSaveAsTemplate() {
    if (Platform.OS === 'ios' && Alert.prompt) {
      Alert.prompt(
        T.workouts.saveAsTemplate,
        T.workouts.templateNamePrompt,
        [
          { text: T.common.cancel, style: 'cancel' },
          {
            text: T.common.save,
            onPress: (value?: string) => saveTemplate(value ?? defaultTemplateName),
          },
        ],
        'plain-text',
        defaultTemplateName
      );
      return;
    }
    saveTemplate(defaultTemplateName);
  }

  function handleUpdateTemplate() {
    if (activeWorkout.templateId === null) return;
    updateTemplate.mutate(
      { templateId: activeWorkout.templateId, workoutId },
      { onSuccess: () => Alert.alert(T.workouts.templateUpdated) }
    );
  }

  function openMenu() {
    const options: { value: string; label: string; destructive?: boolean }[] = [
      { value: 'save-template', label: T.workouts.saveAsTemplate },
    ];
    if (activeWorkout.templateId !== null) {
      options.push({ value: 'update-template', label: T.workouts.updateTemplate });
    }
    options.push({ value: 'delete', label: T.workouts.deleteWorkout, destructive: true });

    showActionSheet(activeWorkout.title ?? formatWorkoutDate(activeWorkout.performedAt), options, (value) => {
      if (value === 'save-template') handleSaveAsTemplate();
      else if (value === 'update-template') handleUpdateTemplate();
      else if (value === 'delete') handleDelete();
    });
  }

  function renderBlock(block: WorkoutExercise) {
    return (
      <ExerciseBlock
        workout={activeWorkout}
        block={block}
        onAddSet={(input) => addSet.mutate({ workoutExerciseId: block.id, input })}
        onAddDropSet={(stages) => addDropSet.mutate({ workoutExerciseId: block.id, stages })}
        onChangeSet={(setId, patch) => updateSet.mutate({ setId, patch })}
        onDeleteSet={(setId) => deleteSet.mutate(setId)}
        onRemove={() => removeBlock.mutate(block.id)}
      />
    );
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: formatWorkoutDate(activeWorkout.performedAt),
          headerRight: () => (
            <Pressable onPress={openMenu} hitSlop={8}>
              <Text style={[styles.headerAction, { color: theme.accent }]}>•••</Text>
            </Pressable>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={96}>
        <FlatList
          data={activeWorkout.exercises}
          keyExtractor={(item) => String(item.id)}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={styles.list}
          renderItem={({ item }) => renderBlock(item)}
          ListHeaderComponent={
            <View style={styles.header}>
              <TextField
                value={title ?? activeWorkout.title ?? ''}
                onChangeText={setTitle}
                onBlur={commitTitle}
                placeholder={T.workouts.titlePlaceholder}
                returnKeyType="done"
              />
              <Text style={[styles.summary, { color: theme.textSecondary }]}>
                {`${T.workouts.exerciseCount(activeWorkout.exercises.length)} · ${T.workouts.setCount(
                  setCount
                )}${volume > 0 ? ` · ${formatVolume(volume)}` : ''}`}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <EmptyState title={T.workouts.noSets} body={T.workouts.addExercise} />
          }
          ListFooterComponent={
            <View style={styles.footer}>
              <Button
                title={`+ ${T.workouts.addExercise}`}
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: '/workout/[id]/picker',
                    params: { id: String(workoutId) },
                  })
                }
              />
              {activeWorkout.status === 'in_progress' ? (
                <Button
                  title={T.workouts.finish}
                  onPress={handleFinish}
                  loading={finishWorkout.isPending}
                />
              ) : null}
            </View>
          }
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingBottom: Spacing.six,
  },
  header: {
    gap: Spacing.two,
    padding: Spacing.three,
  },
  summary: {
    fontSize: 13,
  },
  footer: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  headerAction: {
    fontSize: 16,
    fontWeight: '700',
  },
});

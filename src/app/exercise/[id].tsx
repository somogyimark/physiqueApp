import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { ExerciseForm } from '@/components/exercise/exercise-form';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { T } from '@/constants/strings';
import { Spacing } from '@/constants/theme';
import {
  useArchiveExercise,
  useExercise,
  useExerciseUsage,
  useUpdateExercise,
} from '@/hooks/use-exercises';
import { useTheme } from '@/hooks/use-theme';
import { DuplicateExerciseNameError } from '@/repositories/errors';
import type { ExerciseInput } from '@/repositories/exercises';

export default function EditExerciseScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const exerciseId = Number(params.id);

  const { data: exercise, isPending } = useExercise(Number.isFinite(exerciseId) ? exerciseId : null);
  const { data: usageCount = 0 } = useExerciseUsage(
    Number.isFinite(exerciseId) ? exerciseId : null
  );
  const updateExercise = useUpdateExercise();
  const archiveExercise = useArchiveExercise();
  const [error, setError] = useState<string | null>(null);

  if (isPending) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator color={theme.accent} />
      </Screen>
    );
  }

  if (!exercise) {
    return (
      <Screen>
        <EmptyState title={T.common.error} />
      </Screen>
    );
  }

  function handleSubmit(input: ExerciseInput) {
    setError(null);
    updateExercise.mutate(
      { id: exerciseId, input },
      {
        onSuccess: () => router.back(),
        onError: (mutationError) => {
          setError(
            mutationError instanceof DuplicateExerciseNameError
              ? T.exercises.nameTaken
              : T.common.error
          );
        },
      }
    );
  }

  function handleArchiveToggle() {
    if (!exercise) return;
    const archived = !exercise.isArchived;

    const confirm = () =>
      archiveExercise.mutate(
        { id: exerciseId, archived },
        { onSuccess: () => router.back() }
      );

    if (archived) {
      Alert.alert(T.exercises.archive, T.exercises.archiveInfo, [
        { text: T.common.cancel, style: 'cancel' },
        { text: T.exercises.archive, style: 'destructive', onPress: confirm },
      ]);
    } else {
      confirm();
    }
  }

  return (
    <Screen>
      <ExerciseForm
        initial={exercise}
        submitLabel={T.common.save}
        submitting={updateExercise.isPending}
        errorMessage={error}
        onSubmit={handleSubmit}
      />

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <Text style={[styles.usage, { color: theme.textSecondary }]}>
          {usageCount > 0 ? T.exercises.usedInWorkouts(usageCount) : T.exercises.neverUsed}
        </Text>
        <Button
          title={exercise.isArchived ? T.exercises.unarchive : T.exercises.archive}
          variant={exercise.isArchived ? 'secondary' : 'danger'}
          onPress={handleArchiveToggle}
          loading={archiveExercise.isPending}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  usage: {
    fontSize: 13,
    textAlign: 'center',
  },
});

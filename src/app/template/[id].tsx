import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { MUSCLE_GROUP_LABELS, SET_TYPE_SHORT, T } from '@/constants/strings';
import { Spacing } from '@/constants/theme';
import type { TemplateExercise, TemplateSet } from '@/domain/models';
import {
  useDeleteTemplate,
  useRenameTemplate,
  useStartWorkoutFromTemplate,
  useTemplateDetail,
} from '@/hooks/use-templates';
import { useTheme } from '@/hooks/use-theme';
import { formatWeight } from '@/lib/format';

/** Egy cél-szett szöveggé: „8 × 60 kg", típusjelöléssel. */
function describeSet(set: TemplateSet): string {
  const reps = set.targetReps ?? '–';
  const weight = set.targetWeightKg === null ? '–' : formatWeight(set.targetWeightKg);
  const tag = SET_TYPE_SHORT[set.type];
  return `${tag ? `${tag} ` : ''}${reps} × ${weight}`;
}

function describeBlock(block: TemplateExercise): string {
  if (block.sets.length === 0) return T.workouts.noSets;

  // A drop-set lépcsőket egy sorba fűzzük.
  const parts: string[] = [];
  let i = 0;
  while (i < block.sets.length) {
    const set = block.sets[i];
    if (set.type === 'drop' && set.groupId) {
      const stages = block.sets.filter((s) => s.groupId === set.groupId);
      parts.push(
        `${T.dropSet.title}: ` +
          stages
            .map((s) => `${s.targetReps ?? '–'}×${s.targetWeightKg ?? '–'}`)
            .join(' → ')
      );
      i += stages.length;
    } else {
      parts.push(describeSet(set));
      i += 1;
    }
  }
  return parts.join('\n');
}

export default function TemplateDetailScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const templateId = Number(params.id);
  const enabled = Number.isFinite(templateId);

  const { data: template, isPending } = useTemplateDetail(enabled ? templateId : null);
  const startWorkout = useStartWorkoutFromTemplate();
  const renameTemplate = useRenameTemplate();
  const deleteTemplate = useDeleteTemplate();

  if (isPending) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator color={theme.accent} />
      </Screen>
    );
  }

  if (!template) {
    return (
      <Screen>
        <EmptyState title={T.common.error} />
      </Screen>
    );
  }

  const currentTemplate = template;

  function handleStart() {
    startWorkout.mutate(templateId, {
      onSuccess: (workoutId) =>
        router.replace({ pathname: '/workout/[id]', params: { id: String(workoutId) } }),
    });
  }

  function handleRename() {
    if (Platform.OS === 'ios' && Alert.prompt) {
      Alert.prompt(
        T.templates.rename,
        T.templates.renamePrompt,
        [
          { text: T.common.cancel, style: 'cancel' },
          {
            text: T.common.save,
            onPress: (value?: string) => {
              const name = (value ?? '').trim();
              if (name) renameTemplate.mutate({ id: templateId, name });
            },
          },
        ],
        'plain-text',
        currentTemplate.name
      );
    }
  }

  function handleDelete() {
    Alert.alert(T.templates.delete, T.templates.deleteConfirm, [
      { text: T.common.cancel, style: 'cancel' },
      {
        text: T.common.delete,
        style: 'destructive',
        onPress: () => deleteTemplate.mutate(templateId, { onSuccess: () => router.back() }),
      },
    ]);
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: currentTemplate.name }} />

      <ScrollView contentContainerStyle={styles.content}>
        {currentTemplate.exercises.map((block) => (
          <Card key={block.id} style={styles.card}>
            <Text style={[styles.exerciseName, { color: theme.text }]}>{block.exerciseName}</Text>
            <Text style={[styles.muscle, { color: theme.textSecondary }]}>
              {MUSCLE_GROUP_LABELS[block.muscleGroup]}
            </Text>
            <Text style={[styles.sets, { color: theme.textSecondary }]}>{describeBlock(block)}</Text>
          </Card>
        ))}

        {currentTemplate.exercises.length === 0 ? (
          <EmptyState title={T.workouts.noSets} />
        ) : null}

        <View style={styles.actions}>
          <Button
            title={T.templates.start}
            onPress={handleStart}
            loading={startWorkout.isPending}
          />
          {Platform.OS === 'ios' ? (
            <Button title={T.templates.rename} variant="secondary" onPress={handleRename} />
          ) : null}
          <Pressable onPress={handleDelete} style={styles.deleteRow}>
            <Text style={[styles.deleteText, { color: theme.danger }]}>{T.templates.delete}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
    paddingBottom: Spacing.six,
  },
  card: {
    gap: 2,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
  },
  muscle: {
    fontSize: 12,
  },
  sets: {
    fontSize: 14,
    lineHeight: 20,
    paddingTop: Spacing.one,
  },
  actions: {
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
  deleteRow: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  deleteText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

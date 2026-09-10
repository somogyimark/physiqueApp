import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { MUSCLE_GROUP_LABELS, T } from '@/constants/strings';
import { Radius, Spacing } from '@/constants/theme';
import type { Workout, WorkoutExercise, WorkoutSet } from '@/domain/models';
import { totalVolume } from '@/domain/metrics';
import type { DropStage } from '@/domain/drop-set';
import { annotateSetsWithPrs, EMPTY_PR_CONTEXT, type PrKind } from '@/domain/pr';
import { usePreviousSession, usePrContext } from '@/hooks/use-progress';
import { useTheme } from '@/hooks/use-theme';
import { formatSet, formatVolume } from '@/lib/format';
import { formatShortDate } from '@/lib/date';
import type { SetInput } from '@/repositories/sets';

import { DropSetForm } from './drop-set-form';
import { SetRow } from './set-row';

type ExerciseBlockProps = {
  workout: Workout;
  block: WorkoutExercise;
  onAddSet: (input: SetInput) => void;
  onAddDropSet: (stages: DropStage[]) => void;
  onChangeSet: (setId: number, patch: Partial<SetInput>) => void;
  onDeleteSet: (setId: number) => void;
  onRemove: () => void;
};

/** Alapértelmezés az első szetthez, ha semmilyen előzmény nincs. */
const FALLBACK_SET: SetInput = { reps: 8, weightKg: 20 };

type BlockItem =
  | { kind: 'set'; set: WorkoutSet }
  | { kind: 'drop'; groupId: string; stages: WorkoutSet[] };

/** Az egymást követő azonos `groupId`-jú drop szetteket egy elemmé fűzi. */
function buildItems(sets: readonly WorkoutSet[]): BlockItem[] {
  const items: BlockItem[] = [];

  for (const set of sets) {
    if (set.type === 'drop' && set.groupId) {
      const last = items[items.length - 1];
      if (last && last.kind === 'drop' && last.groupId === set.groupId) {
        last.stages.push(set);
        continue;
      }
      items.push({ kind: 'drop', groupId: set.groupId, stages: [set] });
      continue;
    }
    items.push({ kind: 'set', set });
  }

  return items;
}

export function ExerciseBlock({
  workout,
  block,
  onAddSet,
  onAddDropSet,
  onChangeSet,
  onDeleteSet,
  onRemove,
}: ExerciseBlockProps) {
  const theme = useTheme();
  const [showDropForm, setShowDropForm] = useState(false);

  const { data: prContext } = usePrContext(block.exerciseId, workout);
  const { data: previousSession } = usePreviousSession(block.exerciseId, workout);

  // A PR-jelölés élőben frissül: a kontextus az edzés előtti állapot, erre
  // futtatjuk rá sorrendben az edzés szettjeit.
  const annotated = annotateSetsWithPrs(block.sets, prContext ?? EMPTY_PR_CONTEXT);
  const prsBySetId = new Map<number, PrKind[]>(annotated.map((item) => [item.id, item.prs]));

  const items = useMemo(() => buildItems(block.sets), [block.sets]);

  /** Az utolsó „sima" (nem drop, nem bemelegítő) szett — előtöltéshez. */
  const lastPlainSet = [...block.sets]
    .reverse()
    .find((set) => set.type === 'normal' || set.type === 'one_rep_max' || set.type === 'to_failure');

  function handleAddSet() {
    if (lastPlainSet) {
      onAddSet({ reps: lastPlainSet.reps, weightKg: lastPlainSet.weightKg });
      return;
    }

    const previousFirstSet = previousSession?.sets.find((set) => set.type !== 'warmup');
    if (previousFirstSet) {
      onAddSet({ reps: previousFirstSet.reps, weightKg: previousFirstSet.weightKg });
      return;
    }

    onAddSet(FALLBACK_SET);
  }

  function handleRemove() {
    Alert.alert(block.exerciseName, T.common.delete, [
      { text: T.common.cancel, style: 'cancel' },
      { text: T.common.delete, style: 'destructive', onPress: onRemove },
    ]);
  }

  function handleAddDropSet(stages: DropStage[]) {
    setShowDropForm(false);
    onAddDropSet(stages);
  }

  const volume = totalVolume(block.sets);

  // A megjelenített sorszám: minden „sima" szett és minden drop csoport eggyel lép.
  let counter = 0;
  const numberedItems = items.map((item) => {
    if (item.kind === 'set' && item.set.type === 'warmup') {
      return { item, number: 0 };
    }
    counter += 1;
    return { item, number: counter };
  });

  return (
    <Card style={styles.card}>
      <Pressable onLongPress={handleRemove} style={styles.header}>
        <View style={styles.headerTexts}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {block.exerciseName}
          </Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            {MUSCLE_GROUP_LABELS[block.muscleGroup]}
            {volume > 0 ? ` · ${formatVolume(volume)}` : ''}
          </Text>
        </View>
      </Pressable>

      {previousSession && previousSession.sets.length > 0 ? (
        <Text style={[styles.previous, { color: theme.textSecondary }]} numberOfLines={2}>
          {`${T.workouts.lastTime} (${formatShortDate(previousSession.performedAt)}): ` +
            previousSession.sets.map((set) => formatSet(set.reps, set.weightKg)).join(', ')}
        </Text>
      ) : null}

      {block.sets.length > 0 ? (
        <View style={styles.tableHeader}>
          <Text style={[styles.columnIndex, { color: theme.textSecondary }]}>
            {T.workouts.setsHeader.index}
          </Text>
          <Text style={[styles.columnValue, { color: theme.textSecondary }]}>
            {T.workouts.setsHeader.reps}
          </Text>
          <Text style={[styles.columnValue, { color: theme.textSecondary }]}>
            {T.workouts.setsHeader.weight}
          </Text>
        </View>
      ) : null}

      <View style={styles.sets}>
        {numberedItems.map(({ item, number }) => {
          if (item.kind === 'drop') {
            return (
              <View
                key={`drop-${item.groupId}`}
                style={[styles.dropGroup, { borderColor: theme.accent }]}>
                <Text style={[styles.dropLabel, { color: theme.accent }]}>
                  {`${number}. ${T.dropSet.title}`}
                </Text>
                {item.stages.map((stage, stageIndex) => (
                  <SetRow
                    key={stage.id}
                    set={stage}
                    displayIndex={stageIndex + 1}
                    prs={prsBySetId.get(stage.id) ?? []}
                    onChange={(patch) => onChangeSet(stage.id, patch)}
                    onDelete={() => onDeleteSet(stage.id)}
                  />
                ))}
              </View>
            );
          }

          return (
            <SetRow
              key={item.set.id}
              set={item.set}
              displayIndex={number}
              prs={prsBySetId.get(item.set.id) ?? []}
              onChange={(patch) => onChangeSet(item.set.id, patch)}
              onDelete={() => onDeleteSet(item.set.id)}
            />
          );
        })}
      </View>

      {showDropForm ? (
        <DropSetForm
          defaultStartKg={lastPlainSet?.weightKg}
          onSubmit={handleAddDropSet}
          onCancel={() => setShowDropForm(false)}
        />
      ) : (
        <View style={styles.actions}>
          <Pressable
            onPress={handleAddSet}
            accessibilityRole="button"
            style={({ pressed }) => [styles.actionButton, { opacity: pressed ? 0.6 : 1 }]}>
            <Text style={[styles.actionLabel, { color: theme.accent }]}>
              {`+ ${T.workouts.addSet}`}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setShowDropForm(true)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.actionButton, { opacity: pressed ? 0.6 : 1 }]}>
            <Text style={[styles.actionLabel, { color: theme.accent }]}>
              {`+ ${T.workouts.addDropSet}`}
            </Text>
          </Pressable>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTexts: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
  },
  meta: {
    fontSize: 13,
  },
  previous: {
    fontSize: 12,
    lineHeight: 17,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.one,
  },
  columnIndex: {
    width: 28,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  columnValue: {
    width: 68,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sets: {
    gap: Spacing.two,
  },
  dropGroup: {
    borderLeftWidth: 2,
    paddingLeft: Spacing.two,
    gap: Spacing.two,
    borderRadius: Radius.small,
  },
  dropLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.four,
    paddingTop: Spacing.one,
  },
  actionButton: {},
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});

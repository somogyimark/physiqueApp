import { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { formatMetric, ProgressChart } from '@/components/charts/progress-chart';
import { Card } from '@/components/ui/card';
import { ChipRow } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { METRIC_LABELS, rangeLabel, T } from '@/constants/strings';
import { BottomTabInset, Spacing } from '@/constants/theme';
import {
  PROGRESS_METRICS,
  PROGRESS_RANGES,
  type ProgressMetric,
  type ProgressRange,
} from '@/domain/models';
import { useExerciseBests, useExercisesWithData, useProgressSeries } from '@/hooks/use-progress';
import { useTheme } from '@/hooks/use-theme';
import { formatShortDate } from '@/lib/date';

const METRIC_OPTIONS = PROGRESS_METRICS.map((metric) => ({
  value: metric,
  label: METRIC_LABELS[metric],
}));

const RANGE_OPTIONS = PROGRESS_RANGES.map((range) => ({
  value: range,
  label: rangeLabel(range),
}));

export default function ProgressScreen() {
  const theme = useTheme();
  const [exerciseId, setExerciseId] = useState<number | null>(null);
  const [metric, setMetric] = useState<ProgressMetric>('maxWeight');
  const [range, setRange] = useState<ProgressRange>(null);

  const { data: exercises = [] } = useExercisesWithData();
  const { data: points = [] } = useProgressSeries(exerciseId, range);
  const { data: bests } = useExerciseBests(exerciseId);

  const selected = exercises.find((exercise) => exercise.id === exerciseId) ?? null;

  if (selected === null) {
    return (
      <Screen>
        <ScreenHeader title={T.progress.title} />
        <FlatList
          data={exercises}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            exercises.length > 0 ? (
              <Text style={[styles.hint, { color: theme.textSecondary }]}>
                {T.progress.selectExercise}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState title={T.progress.emptyTitle} body={T.progress.emptyBody} />
          }
          renderItem={({ item }) => (
            <ListRow
              title={item.name}
              subtitle={T.progress.sessions(item.sessionCount)}
              onPress={() => setExerciseId(item.id)}
            />
          )}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title={selected.name}
        right={
          <Pressable onPress={() => setExerciseId(null)} hitSlop={8}>
            <Text style={[styles.headerAction, { color: theme.accent }]}>
              {T.progress.changeExercise}
            </Text>
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        <ChipRow options={METRIC_OPTIONS} value={metric} onChange={setMetric} />
        <ChipRow options={RANGE_OPTIONS} value={range} onChange={setRange} />

        {points.length < 2 ? (
          <EmptyState title={T.progress.emptyTitle} body={T.progress.emptyBody} />
        ) : (
          <Card style={styles.chartCard}>
            <ProgressChart points={points} metric={metric} />
          </Card>
        )}

        {bests && bests.sessionCount > 0 ? (
          <Card style={styles.bestsCard}>
            <Text style={[styles.bestsTitle, { color: theme.text }]}>{T.progress.bests}</Text>

            <BestRow
              label={T.progress.bestWeight}
              value={bests.bestWeight === null ? '-' : formatMetric(bests.bestWeight, 'maxWeight')}
            />
            <BestRow
              label={T.progress.bestE1rm}
              value={bests.bestE1rm === null ? '-' : formatMetric(bests.bestE1rm, 'est1rm')}
            />
            <BestRow
              label={T.progress.bestVolume}
              value={bests.bestVolume === null ? '-' : formatMetric(bests.bestVolume, 'volume')}
            />
            <BestRow
              label={T.progress.lastSession}
              value={
                bests.lastPerformedAt === null ? '-' : formatShortDate(bests.lastPerformedAt)
              }
            />
            <BestRow
              label={T.progress.sessions(bests.sessionCount)}
              value={String(bests.sessionCount)}
            />
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function BestRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={styles.bestRow}>
      <Text style={[styles.bestLabel, { color: theme.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.bestValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: BottomTabInset + Spacing.four,
  },
  hint: {
    fontSize: 13,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  content: {
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.six,
  },
  chartCard: {
    marginHorizontal: Spacing.three,
  },
  bestsCard: {
    marginHorizontal: Spacing.three,
  },
  bestsTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  bestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  bestLabel: {
    flex: 1,
    fontSize: 14,
  },
  bestValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  headerAction: {
    fontSize: 15,
    fontWeight: '600',
  },
});

import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { T } from '@/constants/strings';
import { Radius, Spacing } from '@/constants/theme';
import type { WorkoutSummary } from '@/domain/models';
import { useTheme } from '@/hooks/use-theme';
import { formatWorkoutDate } from '@/lib/date';
import { formatVolume } from '@/lib/format';

type WorkoutCardProps = {
  workout: WorkoutSummary;
  onPress: () => void;
};

export function WorkoutCard({ workout, onPress }: WorkoutCardProps) {
  const theme = useTheme();

  const meta = [
    T.workouts.exerciseCount(workout.exerciseCount),
    T.workouts.setCount(workout.setCount),
    workout.totalVolume > 0 ? formatVolume(workout.totalVolume) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={[styles.date, { color: theme.text }]} numberOfLines={1}>
          {workout.title ?? formatWorkoutDate(workout.performedAt)}
        </Text>
        {workout.status === 'in_progress' ? (
          <View style={[styles.badge, { backgroundColor: theme.accentSoft }]}>
            <Text style={[styles.badgeText, { color: theme.accent }]}>
              {T.workouts.inProgress}
            </Text>
          </View>
        ) : null}
      </View>

      {workout.title ? (
        <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
          {formatWorkoutDate(workout.performedAt)}
        </Text>
      ) : null}

      {workout.exerciseNames.length > 0 ? (
        <Text style={[styles.exercises, { color: theme.textSecondary }]} numberOfLines={2}>
          {workout.exerciseNames.join(', ')}
        </Text>
      ) : null}

      <Text style={[styles.meta, { color: theme.textSecondary }]}>{meta}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  date: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 13,
  },
  exercises: {
    fontSize: 14,
    lineHeight: 19,
  },
  meta: {
    fontSize: 12,
    fontWeight: '600',
  },
});

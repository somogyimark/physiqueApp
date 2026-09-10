import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { T } from '@/constants/strings';
import { Spacing } from '@/constants/theme';
import type { TemplateSummary } from '@/domain/models';
import { useTheme } from '@/hooks/use-theme';
import { formatShortDate } from '@/lib/date';

type TemplateCardProps = {
  template: TemplateSummary;
  starting?: boolean;
  onPress: () => void;
  onStart: () => void;
};

export function TemplateCard({ template, starting = false, onPress, onStart }: TemplateCardProps) {
  const theme = useTheme();

  const meta = [
    T.workouts.exerciseCount(template.exerciseCount),
    T.workouts.setCount(template.setCount),
    template.lastUsedAt
      ? T.templates.lastUsed(formatShortDate(template.lastUsedAt))
      : T.templates.neverUsed,
  ].join(' · ');

  return (
    <Card onPress={onPress} style={styles.card}>
      <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
        {template.name}
      </Text>

      {template.exerciseNames.length > 0 ? (
        <Text style={[styles.exercises, { color: theme.textSecondary }]} numberOfLines={2}>
          {template.exerciseNames.join(', ')}
        </Text>
      ) : null}

      <Text style={[styles.meta, { color: theme.textSecondary }]}>{meta}</Text>

      <View style={styles.actionRow}>
        <Button
          title={T.templates.start}
          onPress={onStart}
          loading={starting}
          style={styles.startButton}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
  },
  exercises: {
    fontSize: 14,
    lineHeight: 19,
  },
  meta: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    paddingTop: Spacing.one,
  },
  startButton: {
    flex: 1,
  },
});

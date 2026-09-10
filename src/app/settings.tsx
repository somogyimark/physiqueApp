import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { T } from '@/constants/strings';
import { Spacing } from '@/constants/theme';
import { useDatabaseStats } from '@/hooks/use-progress';
import { useTheme } from '@/hooks/use-theme';

export default function SettingsScreen() {
  const theme = useTheme();
  const { data: stats } = useDatabaseStats();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={[styles.title, { color: theme.text }]}>{T.settings.data}</Text>
          <Row label={T.settings.exerciseCount} value={String(stats?.exercises ?? 0)} />
          <Row label={T.settings.workoutCount} value={String(stats?.workouts ?? 0)} />
          <Row label={T.settings.setCount} value={String(stats?.sets ?? 0)} />
          <Row label={T.settings.schemaVersion} value={String(stats?.schemaVersion ?? 0)} />
        </Card>
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
  },
});

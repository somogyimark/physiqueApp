import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { Fab } from '@/components/ui/fab';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { WorkoutCard } from '@/components/workout/workout-card';
import { T } from '@/constants/strings';
import { BottomTabInset, Spacing } from '@/constants/theme';
import type { WorkoutSummary } from '@/domain/models';
import { useTheme } from '@/hooks/use-theme';
import { useStartWorkoutFromTemplate, useTemplateList } from '@/hooks/use-templates';
import { useCreateWorkout, useWorkoutList } from '@/hooks/use-workouts';
import { formatMonthTitle, monthKey } from '@/lib/date';
import { showActionSheet } from '@/lib/action-sheet';

type Section = {
  title: string;
  data: WorkoutSummary[];
};

/** Az edzéseket hónapokra bontva mutatjuk, legfrissebb elöl. */
function groupByMonth(workouts: readonly WorkoutSummary[]): Section[] {
  const sections: Section[] = [];
  let currentKey: string | null = null;

  for (const workout of workouts) {
    const key = monthKey(workout.day);
    if (key !== currentKey) {
      sections.push({ title: formatMonthTitle(workout.day), data: [] });
      currentKey = key;
    }
    sections[sections.length - 1].data.push(workout);
  }

  return sections;
}

export default function WorkoutsScreen() {
  const theme = useTheme();
  const { data: workouts = [], isPending } = useWorkoutList();
  const { data: templates = [] } = useTemplateList();
  const createWorkout = useCreateWorkout();
  const startFromTemplate = useStartWorkoutFromTemplate();

  const sections = useMemo(() => groupByMonth(workouts), [workouts]);

  function openWorkout(id: number) {
    router.push({ pathname: '/workout/[id]', params: { id: String(id) } });
  }

  function createEmptyWorkout() {
    createWorkout.mutate({}, { onSuccess: (id) => openWorkout(id) });
  }

  function handleNewWorkout() {
    const active = workouts.find((workout) => workout.status === 'in_progress');
    if (active) {
      // Egyszerre egy edzés lehet folyamatban — a meglévőt folytatjuk.
      openWorkout(active.id);
      return;
    }

    if (templates.length === 0) {
      createEmptyWorkout();
      return;
    }

    // Van sablon: választható üres edzés vagy egy sablonból indítás.
    showActionSheet<'empty' | number>(
      T.templates.chooseTitle,
      [
        { value: 'empty', label: T.templates.chooseEmpty },
        ...templates.map((template) => ({
          value: template.id,
          label: `${T.templates.chooseFromTemplate} ${template.name}`,
        })),
      ],
      (value) => {
        if (value === 'empty') {
          createEmptyWorkout();
        } else {
          startFromTemplate.mutate(value, { onSuccess: (id) => openWorkout(id) });
        }
      }
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title={T.workouts.title}
        right={
          <Pressable onPress={() => router.push('/settings')} hitSlop={8}>
            <Text style={[styles.headerAction, { color: theme.accent }]}>
              {T.settings.title}
            </Text>
          </Pressable>
        }
      />

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <WorkoutCard workout={item} onPress={() => openWorkout(item.id)} />
        )}
        ListEmptyComponent={
          isPending ? null : (
            <View style={styles.empty}>
              <EmptyState title={T.workouts.emptyTitle} body={T.workouts.emptyBody} />
            </View>
          )
        }
      />

      <Fab
        label={`+ ${T.workouts.newWorkout}`}
        onPress={handleNewWorkout}
        bottomInset={BottomTabInset + Spacing.three}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: BottomTabInset + Spacing.six + Spacing.four,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  empty: {
    paddingTop: Spacing.six,
  },
  headerAction: {
    fontSize: 15,
    fontWeight: '600',
  },
});

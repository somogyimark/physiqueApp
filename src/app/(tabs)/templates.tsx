import { router } from 'expo-router';
import { FlatList, StyleSheet } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TemplateCard } from '@/components/workout/template-card';
import { T } from '@/constants/strings';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useStartWorkoutFromTemplate, useTemplateList } from '@/hooks/use-templates';

export default function TemplatesScreen() {
  const { data: templates = [], isPending } = useTemplateList();
  const startWorkout = useStartWorkoutFromTemplate();

  function handleStart(templateId: number) {
    startWorkout.mutate(templateId, {
      onSuccess: (workoutId) =>
        router.push({ pathname: '/workout/[id]', params: { id: String(workoutId) } }),
    });
  }

  return (
    <Screen>
      <ScreenHeader title={T.templates.title} />

      <FlatList
        data={templates}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          isPending ? null : (
            <EmptyState title={T.templates.emptyTitle} body={T.templates.emptyBody} />
          )
        }
        renderItem={({ item }) => (
          <TemplateCard
            template={item}
            starting={startWorkout.isPending && startWorkout.variables === item.id}
            onPress={() =>
              router.push({ pathname: '/template/[id]', params: { id: String(item.id) } })
            }
            onStart={() => handleStart(item.id)}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.six,
  },
});

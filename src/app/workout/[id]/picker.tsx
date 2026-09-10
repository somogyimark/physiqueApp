import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { EQUIPMENT_LABELS, MUSCLE_GROUP_LABELS, T } from '@/constants/strings';
import { Spacing } from '@/constants/theme';
import { MUSCLE_GROUPS, type MuscleGroup } from '@/domain/models';
import { useExerciseList } from '@/hooks/use-exercises';
import { useAddExerciseToWorkout } from '@/hooks/use-workouts';

/** Gyakorlatválasztó modal: koppintásra hozzáadja a gyakorlatot és visszalép. */
export default function ExercisePickerScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const workoutId = Number(params.id);

  const [search, setSearch] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(null);

  const { data: exercises = [] } = useExerciseList({ search, muscleGroup });
  const addExercise = useAddExerciseToWorkout();

  function handleSelect(exerciseId: number) {
    addExercise.mutate({ workoutId, exerciseId }, { onSuccess: () => router.back() });
  }

  return (
    <Screen>
      <View style={styles.searchWrapper}>
        <TextField
          value={search}
          onChangeText={setSearch}
          placeholder={T.common.search}
          autoFocus
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      <View style={styles.filters}>
        <Chip
          label={T.common.all}
          selected={muscleGroup === null}
          onPress={() => setMuscleGroup(null)}
        />
        {MUSCLE_GROUPS.map((group) => (
          <Chip
            key={group}
            label={MUSCLE_GROUP_LABELS[group]}
            selected={group === muscleGroup}
            onPress={() => setMuscleGroup(group === muscleGroup ? null : group)}
          />
        ))}
      </View>

      <FlatList
        data={exercises}
        keyExtractor={(item) => String(item.id)}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState title={T.exercises.emptyTitle} body={T.exercises.emptyBody} />
        }
        renderItem={({ item }) => (
          <ListRow
            title={item.name}
            subtitle={[
              MUSCLE_GROUP_LABELS[item.muscleGroup],
              item.equipment ? EQUIPMENT_LABELS[item.equipment] : null,
            ]
              .filter(Boolean)
              .join(' · ')}
            onPress={() => handleSelect(item.id)}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrapper: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
});

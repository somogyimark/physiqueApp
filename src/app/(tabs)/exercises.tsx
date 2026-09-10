import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Fab } from '@/components/ui/fab';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { EQUIPMENT_LABELS, MUSCLE_GROUP_LABELS, T } from '@/constants/strings';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { MUSCLE_GROUPS, type MuscleGroup } from '@/domain/models';
import { useExerciseList } from '@/hooks/use-exercises';
import { useTheme } from '@/hooks/use-theme';

export default function ExercisesScreen() {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(null);
  const [includeArchived, setIncludeArchived] = useState(false);

  const { data: exercises = [], isPending } = useExerciseList({
    search,
    muscleGroup,
    includeArchived,
  });

  return (
    <Screen>
      <ScreenHeader title={T.exercises.title} />

      <View style={styles.searchWrapper}>
        <TextField
          value={search}
          onChangeText={setSearch}
          placeholder={T.common.search}
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
        <Chip
          label={T.exercises.showArchived}
          selected={includeArchived}
          onPress={() => setIncludeArchived((value) => !value)}
        />
      </View>

      <FlatList
        data={exercises}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          isPending ? null : (
            <EmptyState title={T.exercises.emptyTitle} body={T.exercises.emptyBody} />
          )
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
            right={
              item.isArchived ? (
                <Text style={[styles.badge, { color: theme.textSecondary }]}>
                  {T.exercises.archived}
                </Text>
              ) : null
            }
            onPress={() =>
              router.push({ pathname: '/exercise/[id]', params: { id: String(item.id) } })
            }
          />
        )}
      />

      <Fab
        label={`+ ${T.exercises.newExercise}`}
        onPress={() => router.push('/exercise/new')}
        bottomInset={BottomTabInset + Spacing.three}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrapper: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
  list: {
    paddingBottom: BottomTabInset + Spacing.six + Spacing.four,
  },
  badge: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

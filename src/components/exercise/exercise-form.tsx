import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { TextField } from '@/components/ui/text-field';
import { EQUIPMENT_LABELS, MUSCLE_GROUP_LABELS, T } from '@/constants/strings';
import { Spacing } from '@/constants/theme';
import {
  EQUIPMENTS,
  MUSCLE_GROUPS,
  type Equipment,
  type Exercise,
  type MuscleGroup,
} from '@/domain/models';
import { useTheme } from '@/hooks/use-theme';
import type { ExerciseInput } from '@/repositories/exercises';

type ExerciseFormProps = {
  initial?: Exercise;
  submitLabel: string;
  submitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (input: ExerciseInput) => void;
};

export function ExerciseForm({
  initial,
  submitLabel,
  submitting = false,
  errorMessage,
  onSubmit,
}: ExerciseFormProps) {
  const theme = useTheme();
  const [name, setName] = useState(initial?.name ?? '');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>(initial?.muscleGroup ?? 'mell');
  const [equipment, setEquipment] = useState<Equipment | null>(initial?.equipment ?? null);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [nameError, setNameError] = useState<string | null>(null);

  function handleSubmit() {
    const trimmed = name.trim();
    if (trimmed === '') {
      setNameError(T.exercises.nameRequired);
      return;
    }

    setNameError(null);
    onSubmit({
      name: trimmed,
      muscleGroup,
      equipment,
      notes: notes.trim() === '' ? null : notes.trim(),
    });
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive">
      <TextField
        label={T.exercises.namePlaceholder}
        value={name}
        onChangeText={setName}
        placeholder={T.exercises.namePlaceholder}
        autoFocus={initial === undefined}
        autoCapitalize="sentences"
        error={nameError ?? errorMessage}
      />

      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          {T.exercises.muscleGroup}
        </Text>
        <View style={styles.chips}>
          {MUSCLE_GROUPS.map((group) => (
            <Chip
              key={group}
              label={MUSCLE_GROUP_LABELS[group]}
              selected={group === muscleGroup}
              onPress={() => setMuscleGroup(group)}
            />
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{T.exercises.equipment}</Text>
        <View style={styles.chips}>
          {EQUIPMENTS.map((item) => (
            <Chip
              key={item}
              label={EQUIPMENT_LABELS[item]}
              selected={item === equipment}
              onPress={() => setEquipment(item === equipment ? null : item)}
            />
          ))}
        </View>
      </View>

      <TextField
        label={T.exercises.notesPlaceholder}
        value={notes}
        onChangeText={setNotes}
        placeholder={T.exercises.notesPlaceholder}
        multiline
        style={styles.notes}
      />

      <Button title={submitLabel} onPress={handleSubmit} loading={submitting} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.four,
    paddingBottom: Spacing.six,
  },
  group: {
    gap: Spacing.two,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  notes: {
    minHeight: 96,
    paddingTop: Spacing.two,
    textAlignVertical: 'top',
  },
});

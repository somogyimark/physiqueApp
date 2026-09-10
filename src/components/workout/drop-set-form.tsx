import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { T } from '@/constants/strings';
import { Radius, Spacing } from '@/constants/theme';
import { generateDropStages, type DropStage } from '@/domain/drop-set';
import { useTheme } from '@/hooks/use-theme';
import { formatSet, parseRepsInput, parseWeightInput } from '@/lib/format';

type DropSetFormProps = {
  /** Előtöltéshez: az utolsó normál szett súlya lehet a kezdő súly. */
  defaultStartKg?: number;
  onSubmit: (stages: DropStage[]) => void;
  onCancel: () => void;
};

export function DropSetForm({ defaultStartKg, onSubmit, onCancel }: DropSetFormProps) {
  const theme = useTheme();
  const [startKg, setStartKg] = useState(defaultStartKg ? String(defaultStartKg) : '');
  const [endKg, setEndKg] = useState('');
  const [stepKg, setStepKg] = useState('5');
  const [reps, setReps] = useState('8');

  const result = useMemo(
    () =>
      generateDropStages({
        startKg: parseWeightInput(startKg) ?? NaN,
        endKg: parseWeightInput(endKg) ?? NaN,
        stepKg: parseWeightInput(stepKg) ?? NaN,
        reps: parseRepsInput(reps) ?? NaN,
      }),
    [startKg, endKg, stepKg, reps]
  );

  const message = !result.ok
    ? result.error === 'too_many'
      ? T.dropSet.tooMany
      : T.dropSet.invalid
    : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background, borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.text }]}>{T.dropSet.title}</Text>

      <View style={styles.grid}>
        <View style={styles.cell}>
          <TextField
            label={T.dropSet.startKg}
            value={startKg}
            onChangeText={setStartKg}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.cell}>
          <TextField
            label={T.dropSet.endKg}
            value={endKg}
            onChangeText={setEndKg}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.cell}>
          <TextField
            label={T.dropSet.stepKg}
            value={stepKg}
            onChangeText={setStepKg}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.cell}>
          <TextField
            label={T.dropSet.reps}
            value={reps}
            onChangeText={setReps}
            keyboardType="number-pad"
          />
        </View>
      </View>

      {result.ok ? (
        <Text style={[styles.preview, { color: theme.textSecondary }]}>
          {`${T.dropSet.preview}: ` +
            result.stages.map((stage) => formatSet(stage.reps, stage.weightKg)).join('  →  ')}
        </Text>
      ) : (
        <Text style={[styles.preview, { color: theme.textSecondary }]}>{message}</Text>
      )}

      <View style={styles.actions}>
        <Button title={T.common.cancel} variant="secondary" onPress={onCancel} style={styles.action} />
        <Button
          title={T.dropSet.add}
          onPress={() => result.ok && onSubmit(result.stages)}
          disabled={!result.ok}
          style={styles.action}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  cell: {
    flexGrow: 1,
    flexBasis: '45%',
  },
  preview: {
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  action: {
    flex: 1,
  },
});

import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { SET_TYPE_LABELS } from '@/constants/strings';
import { Radius, Spacing } from '@/constants/theme';
import type { SetType, WorkoutSet } from '@/domain/models';
import type { PrKind } from '@/domain/pr';
import { useTheme } from '@/hooks/use-theme';
import { showActionSheet } from '@/lib/action-sheet';
import { formatNumber, parseRepsInput, parseWeightInput } from '@/lib/format';
import type { SetInput } from '@/repositories/sets';

import { PrBadge } from './pr-badge';
import { SetTypeBadge } from './set-type-badge';

type SetRowProps = {
  set: WorkoutSet;
  /** A sorban kijelzett sorszám (drop seten belül a lépcső indexe). */
  displayIndex: number;
  prs: readonly PrKind[];
  onChange: (patch: Partial<SetInput>) => void;
  onDelete: () => void;
};

/** A leading cellából választható típusok (a `drop` külön gombbal jön létre). */
const PICKABLE_TYPES: SetType[] = ['normal', 'warmup', 'one_rep_max', 'to_failure'];

/**
 * Egy szett sora. A beírt érték a mező elhagyásakor (blur) mentődik, így nem
 * indítunk adatbázis-írást minden leütésre, de a mentés nem igényel külön gombot.
 * A bal oldali cellára koppintva választható a szett típusa.
 */
export function SetRow({ set, displayIndex, prs, onChange, onDelete }: SetRowProps) {
  const theme = useTheme();
  const [reps, setReps] = useState(String(set.reps));
  const [weight, setWeight] = useState(formatNumber(set.weightKg));

  // Külső változás (pl. törlés utáni újraszámozás) felülírja a helyi állapotot.
  useEffect(() => {
    setReps(String(set.reps));
    setWeight(formatNumber(set.weightKg));
  }, [set.id, set.reps, set.weightKg]);

  function commitReps() {
    const parsed = parseRepsInput(reps);
    if (parsed === null || parsed === set.reps) {
      setReps(String(set.reps));
      return;
    }
    onChange({ reps: parsed });
  }

  function commitWeight() {
    const parsed = parseWeightInput(weight);
    if (parsed === null || parsed === set.weightKg) {
      setWeight(formatNumber(set.weightKg));
      return;
    }
    onChange({ weightKg: parsed });
  }

  function pickType() {
    // A drop-set lépcső típusa nem váltogatható — a drop set egészként jön létre/törlődik.
    if (set.type === 'drop') return;
    showActionSheet<SetType>(
      SET_TYPE_LABELS[set.type] ?? '',
      PICKABLE_TYPES.map((type) => ({ value: type, label: SET_TYPE_LABELS[type] })),
      (type) => {
        if (type === set.type) return;
        // 1RM kísérletnél az 1 ismétlés az alapértelmezés.
        if (type === 'one_rep_max' && set.reps !== 1) {
          onChange({ type, reps: 1 });
        } else {
          onChange({ type });
        }
      }
    );
  }

  const isWarmup = set.type === 'warmup';
  const inputStyle = [
    styles.input,
    { color: theme.text, backgroundColor: theme.background, borderColor: theme.border },
  ];

  return (
    <View style={styles.row}>
      <Pressable
        onPress={pickType}
        style={styles.indexWrapper}
        accessibilityRole="button"
        accessibilityLabel={`Szett típusa: ${SET_TYPE_LABELS[set.type]}`}>
        <Text
          style={[styles.index, { color: isWarmup ? theme.textSecondary : theme.text }]}>
          {isWarmup ? 'B' : displayIndex}
        </Text>
      </Pressable>

      <TextInput
        value={reps}
        onChangeText={setReps}
        onBlur={commitReps}
        onEndEditing={commitReps}
        keyboardType="number-pad"
        returnKeyType="done"
        selectTextOnFocus
        style={inputStyle}
      />

      <TextInput
        value={weight}
        onChangeText={setWeight}
        onBlur={commitWeight}
        onEndEditing={commitWeight}
        keyboardType="decimal-pad"
        returnKeyType="done"
        selectTextOnFocus
        style={inputStyle}
      />

      <View style={styles.badgeSlot}>
        <SetTypeBadge type={set.type} />
        <PrBadge prs={prs} />
      </View>

      <Pressable
        onPress={onDelete}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Szett törlése">
        <Text style={[styles.delete, { color: theme.textSecondary }]}>×</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  indexWrapper: {
    width: 28,
    alignItems: 'center',
  },
  index: {
    fontSize: 15,
    fontWeight: '700',
  },
  input: {
    width: 68,
    height: 40,
    borderRadius: Radius.small,
    borderWidth: StyleSheet.hairlineWidth,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  badgeSlot: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  delete: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: Spacing.one,
  },
});

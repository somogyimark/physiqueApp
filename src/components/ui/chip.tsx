import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function Chip({ label, selected, onPress }: ChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.accentSoft : theme.backgroundElement,
          borderColor: selected ? theme.accent : theme.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <Text
        style={[styles.label, { color: selected ? theme.accent : theme.textSecondary }]}
        numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

type ChipOption<T> = { value: T; label: string };

type ChipRowProps<T> = {
  options: readonly ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** Vízszintesen görgethető szűrősor (izomcsoport, metrika, időtáv). */
export function ChipRow<T extends string | number | null>({
  options,
  value,
  onChange,
}: ChipRowProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled">
      {options.map((option) => (
        <Chip
          key={String(option.value)}
          label={option.label}
          selected={option.value === value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});

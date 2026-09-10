import { Pressable, StyleSheet, Text } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FabProps = {
  label: string;
  onPress: () => void;
  bottomInset?: number;
};

/** Lebegő elsődleges gomb a lista fölött (új edzés, új gyakorlat). */
export function Fab({ label, onPress, bottomInset = Spacing.four }: FabProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        {
          backgroundColor: theme.accent,
          bottom: bottomInset,
          opacity: pressed ? 0.85 : 1,
          shadowColor: '#000',
        },
      ]}>
      <Text style={[styles.label, { color: theme.onAccent }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    minHeight: 52,
    justifyContent: 'center',
    borderRadius: Radius.pill,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
});

import { StyleSheet, Text, View } from 'react-native';

import { SET_TYPE_SHORT } from '@/constants/strings';
import { Radius, Spacing } from '@/constants/theme';
import type { SetType } from '@/domain/models';
import { useTheme } from '@/hooks/use-theme';

/** Rövid, halvány jelölés a szett típusához. `normal` esetén nem jelenít meg semmit. */
export function SetTypeBadge({ type }: { type: SetType }) {
  const theme = useTheme();
  if (type === 'normal') return null;

  const label = SET_TYPE_SHORT[type];
  const accent = type === 'warmup' ? theme.textSecondary : theme.accent;
  const background = type === 'warmup' ? theme.backgroundElement : theme.accentSoft;

  return (
    <View style={[styles.badge, { backgroundColor: background, borderColor: accent }]}>
      <Text style={[styles.text, { color: accent }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

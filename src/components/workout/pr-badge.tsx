import { StyleSheet, Text, View } from 'react-native';

import { PR_LABELS } from '@/constants/strings';
import { Radius, Spacing } from '@/constants/theme';
import type { PrKind } from '@/domain/pr';
import { useTheme } from '@/hooks/use-theme';

type PrBadgeProps = {
  prs: readonly PrKind[];
  /** Rövid változat a szettsorba; hosszú a részletnézetbe. */
  compact?: boolean;
};

/** A legerősebb rekordot mutatja: rekordsúly > 1RM > ismétlés-rekord. */
export function PrBadge({ prs, compact = true }: PrBadgeProps) {
  const theme = useTheme();
  if (prs.length === 0) return null;

  return (
    <View style={[styles.badge, { backgroundColor: theme.prSoft, borderColor: theme.pr }]}>
      <Text style={[styles.text, { color: theme.pr }]} numberOfLines={1}>
        {compact ? 'PR' : PR_LABELS[prs[0]]}
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
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type ScreenProps = {
  children: ReactNode;
  style?: ViewStyle;
};

/** Képernyő-háttér a téma szerint. A biztonságos margókat a natív tabbar/fejléc kezeli. */
export function Screen({ children, style }: ScreenProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

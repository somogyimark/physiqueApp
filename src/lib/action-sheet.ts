import { ActionSheetIOS, Alert, Platform } from 'react-native';

export type SheetOption<T> = {
  value: T;
  label: string;
  destructive?: boolean;
};

/**
 * Egyszerű választó: iOS-en natív ActionSheet, máshol Alert gombokkal.
 * A „Mégse" opciót magától hozzáadja.
 */
export function showActionSheet<T>(
  title: string,
  options: readonly SheetOption<T>[],
  onSelect: (value: T) => void,
  cancelLabel = 'Mégse'
): void {
  if (Platform.OS === 'ios') {
    const labels = [...options.map((option) => option.label), cancelLabel];
    const destructiveButtonIndex = options.findIndex((option) => option.destructive);

    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options: labels,
        cancelButtonIndex: labels.length - 1,
        destructiveButtonIndex: destructiveButtonIndex >= 0 ? destructiveButtonIndex : undefined,
      },
      (index) => {
        if (index >= 0 && index < options.length) onSelect(options[index].value);
      }
    );
    return;
  }

  Alert.alert(title, undefined, [
    ...options.map((option) => ({
      text: option.label,
      style: option.destructive ? ('destructive' as const) : ('default' as const),
      onPress: () => onSelect(option.value),
    })),
    { text: cancelLabel, style: 'cancel' as const },
  ]);
}

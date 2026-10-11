import NativeSegmentedControl from '@react-native-segmented-control/segmented-control';
import { StyleSheet } from 'react-native';

import { useTheme } from '../theme';

export interface SegmentOption<T> {
  label: string;
  value: T;
}

export interface SegmentedControlProps<T> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
  enabled?: boolean;
}

/** Native `UISegmentedControl` on iOS, faithful recreations elsewhere. */
export function SegmentedControl<T>({
  options,
  value,
  onChange,
  accessibilityLabel,
  enabled = true,
}: SegmentedControlProps<T>) {
  const { dark } = useTheme();
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  return (
    <NativeSegmentedControl
      values={options.map((option) => option.label)}
      selectedIndex={selectedIndex}
      enabled={enabled}
      appearance={dark ? 'dark' : 'light'}
      accessibilityLabel={accessibilityLabel}
      style={styles.control}
      onChange={(event) => {
        const option = options[event.nativeEvent.selectedSegmentIndex];
        if (option && option.value !== value) onChange(option.value);
      }}
    />
  );
}

const styles = StyleSheet.create({
  control: {
    height: 32,
  },
});

import { StyleSheet } from 'react-native';

import { MIN_TOUCH_TARGET, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';

export interface IconButtonProps {
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
}

/** A circular toolbar button with a full 44-pt hit target. */
export function IconButton({ icon, accessibilityLabel, onPress }: IconButtonProps) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={(MIN_TOUCH_TARGET - 36) / 2}
      style={[styles.button, { backgroundColor: colors.tertiaryFill }]}
    >
      <Icon name={icon} size={18} color="secondaryLabel" weight="semibold" />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

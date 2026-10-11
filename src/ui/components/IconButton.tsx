import { StyleSheet } from 'react-native';

import { MIN_TOUCH_TARGET, useTheme } from '../theme';
import { GlassFill } from './GlassFill';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';

const SIZE = 38;

export interface IconButtonProps {
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
  /** Highlighted state, e.g. while dictating. */
  active?: boolean;
}

/** A small glass circle with a full 44-pt hit target. */
export function IconButton({ icon, accessibilityLabel, onPress, active }: IconButtonProps) {
  const { glass, colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={active === undefined ? undefined : { selected: active }}
      hitSlop={(MIN_TOUCH_TARGET - SIZE) / 2}
      style={[
        styles.button,
        { boxShadow: glass.shadow },
        active && { backgroundColor: colors.label },
      ]}
    >
      {active ? null : <GlassFill borderRadius={SIZE / 2} />}
      <Icon name={icon} size={16} color={active ? 'onLabel' : 'label'} weight="medium" />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

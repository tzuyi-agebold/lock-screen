import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { durations, springs } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** How far the control shrinks while pressed. */
  pressedScale?: number;
  pressedOpacity?: number;
}

/**
 * The tactile press feedback of iOS controls: a quick shrink and dim on touch-down that
 * springs back on release. Falls back to a plain dim when Reduce Motion is enabled.
 */
export function PressableScale({
  style,
  pressedScale = 0.97,
  pressedOpacity = 0.8,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: PressableScaleProps) {
  const reduceMotion = useReducedMotion();
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - pressed.get() * (1 - pressedOpacity),
    transform: [{ scale: reduceMotion ? 1 : 1 - pressed.get() * (1 - pressedScale) }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(event) => {
        pressed.set(withTiming(1, { duration: durations.fast / 2 }));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        pressed.set(
          reduceMotion
            ? withTiming(0, { duration: durations.fast })
            : withSpring(0, springs.snappy),
        );
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
    />
  );
}

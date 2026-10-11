import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { durations, useTheme, type ColorName } from '../theme';

export interface ProgressBarProps {
  /** 0 to 1. */
  progress: number;
  color?: ColorName;
  accessibilityLabel: string;
}

/** A 4-pt capsule progress bar, like `UIProgressView`. */
export function ProgressBar({ progress, color = 'tint', accessibilityLabel }: ProgressBarProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const value = useSharedValue(progress);

  useEffect(() => {
    value.set(reduceMotion ? progress : withTiming(progress, { duration: durations.slow }));
  }, [progress, reduceMotion, value]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.min(1, Math.max(0, value.get())) * 100}%`,
  }));

  return (
    <View
      style={[styles.track, { backgroundColor: colors.tertiaryFill }]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
    >
      <Animated.View style={[styles.fill, { backgroundColor: colors[color] }, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});

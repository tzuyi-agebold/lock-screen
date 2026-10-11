import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { durations, useTheme } from '../theme';

export interface ProgressBarProps {
  /** 0 to 1. */
  progress: number;
  accessibilityLabel: string;
}

/** A 2-pt hairline progress bar in the label color. */
export function ProgressBar({ progress, accessibilityLabel }: ProgressBarProps) {
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
      style={[styles.track, { backgroundColor: colors.surfaceStrong }]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
    >
      <Animated.View style={[styles.fill, { backgroundColor: colors.label }, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});

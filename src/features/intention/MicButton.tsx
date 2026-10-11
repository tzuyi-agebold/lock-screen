import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { IconButton } from '@/ui/components';
import { useTheme } from '@/ui/theme';

export interface MicButtonProps {
  listening: boolean;
  onPress: () => void;
}

/** Starts and stops dictation. A thin ring ripples outward while listening. */
export function MicButton({ listening, onPress }: MicButtonProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const ring = useSharedValue(0);

  useEffect(() => {
    if (listening && !reduceMotion) {
      ring.set(0);
      ring.set(
        withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }), -1, false),
      );
    } else {
      cancelAnimation(ring);
      ring.set(0);
    }
  }, [listening, reduceMotion, ring]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: listening ? 0.5 * (1 - ring.get()) : 0,
    transform: [{ scale: 1 + ring.get() * 0.8 }],
  }));

  return (
    <View>
      <Animated.View
        pointerEvents="none"
        style={[styles.ring, { borderColor: colors.label }, ringStyle]}
      />
      <IconButton
        icon={listening ? 'waveform' : 'mic'}
        accessibilityLabel={listening ? 'Stop dictation' : 'Speak your intention'}
        onPress={onPress}
        active={listening}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    ...StyleSheet.absoluteFill,
    borderRadius: 999,
    borderWidth: 1,
  },
});

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

import { Icon, PressableScale } from '@/ui/components';
import { useTheme } from '@/ui/theme';

const SIZE = 40;

export interface MicButtonProps {
  listening: boolean;
  onPress: () => void;
}

/** Starts and stops dictation. A soft ring pulses outward while listening. */
export function MicButton({ listening, onPress }: MicButtonProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const ring = useSharedValue(0);

  useEffect(() => {
    if (listening && !reduceMotion) {
      ring.set(0);
      ring.set(
        withRepeat(withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }), -1, false),
      );
    } else {
      cancelAnimation(ring);
      ring.set(0);
    }
  }, [listening, reduceMotion, ring]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: listening ? 0.45 * (1 - ring.get()) : 0,
    transform: [{ scale: 1 + ring.get() * 0.7 }],
  }));

  return (
    <View style={styles.wrapper}>
      <Animated.View
        pointerEvents="none"
        style={[styles.ring, { backgroundColor: colors.tint }, ringStyle]}
      />
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={listening ? 'Stop dictation' : 'Speak your intention'}
        accessibilityState={{ selected: listening }}
        hitSlop={4}
        style={[styles.button, { backgroundColor: listening ? colors.tint : colors.tintFill }]}
      >
        <Icon
          name={listening ? 'waveform' : 'mic'}
          size={18}
          tintColor={listening ? colors.onTint : colors.tint}
          weight="semibold"
        />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: SIZE,
    height: SIZE,
  },
  ring: {
    ...StyleSheet.absoluteFill,
    borderRadius: SIZE / 2,
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

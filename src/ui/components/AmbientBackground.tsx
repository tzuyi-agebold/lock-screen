import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { useNow } from '@/hooks/useNow';

import { paletteForHour, useTheme, withAlpha } from '../theme';
import { gradient } from './gradient';

const noise = require('../../../assets/noise.png');

/**
 * Where each blob lives and how it moves. Every period is different (and none divides
 * another), so the composition never visibly repeats — the colors seem to slowly morph.
 */
const BLOBS = [
  { x: 0.18, y: 0.2, size: 1.05, driftX: 0.16, driftY: 0.1, periods: [19000, 23000, 14000, 17000] },
  {
    x: 0.88,
    y: 0.34,
    size: 0.95,
    driftX: 0.13,
    driftY: 0.14,
    periods: [23000, 17000, 18000, 21000],
  },
  {
    x: 0.22,
    y: 0.74,
    size: 1.0,
    driftX: 0.15,
    driftY: 0.09,
    periods: [17000, 21000, 22000, 13000],
  },
  { x: 0.82, y: 0.9, size: 0.9, driftX: 0.18, driftY: 0.12, periods: [26000, 15000, 16000, 25000] },
] as const;

const PALETTE_CROSSFADE_MS = 1500;

/**
 * The ambient depth layer behind the home screen: soft nature-colored light that drifts and
 * breathes, frosted by a blur, with a fine grain on top. The palette follows the time of
 * day (dawn, day, dusk). With Reduce Motion on, it holds still.
 */
export function AmbientBackground() {
  const { dark, colors } = useTheme();
  const now = useNow(60_000);
  const palette = paletteForHour(new Date(now).getHours());
  const [area, setArea] = useState<{ width: number; height: number } | null>(null);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setArea((previous) =>
      previous?.width === width && previous.height === height ? previous : { width, height },
    );
  };

  const vignette = dark
    ? 'linear-gradient(180deg, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0) 26%, rgba(0, 0, 0, 0) 62%, rgba(0, 0, 0, 0.5) 100%)'
    : 'linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 28%, rgba(255, 255, 255, 0) 58%, rgba(255, 255, 255, 0.65) 100%)';

  return (
    <View
      pointerEvents="none"
      onLayout={onLayout}
      style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}
    >
      {area ? (
        <Animated.View
          key={palette.phase}
          entering={FadeIn.duration(PALETTE_CROSSFADE_MS)}
          exiting={FadeOut.duration(PALETTE_CROSSFADE_MS)}
          style={StyleSheet.absoluteFill}
        >
          {palette.colors.map((color, index) => (
            <Blob key={index} index={index} color={color} area={area} dark={dark} />
          ))}
        </Animated.View>
      ) : null}
      <BlurView
        tint={dark ? 'dark' : 'light'}
        intensity={dark ? 38 : 40}
        style={StyleSheet.absoluteFill}
      />
      <Image
        source={noise}
        resizeMode="repeat"
        style={[StyleSheet.absoluteFill, styles.grain, { opacity: dark ? 0.07 : 0.05 }]}
      />
      <View style={[StyleSheet.absoluteFill, gradient(vignette)]} />
    </View>
  );
}

function useOscillator(period: number, still: boolean): SharedValue<number> {
  const value = useSharedValue(0.5);
  useEffect(() => {
    if (still) {
      value.set(0.5);
      return;
    }
    value.set(0);
    value.set(
      withRepeat(withTiming(1, { duration: period, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [period, still, value]);
  return value;
}

function Blob({
  index,
  color,
  area,
  dark,
}: {
  index: number;
  color: string;
  area: { width: number; height: number };
  dark: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const blob = BLOBS[index % BLOBS.length]!;
  const [px, py, ps, po] = blob.periods;
  const driftX = useOscillator(px, reduceMotion);
  const driftY = useOscillator(py, reduceMotion);
  const breathe = useOscillator(ps, reduceMotion);
  const glow = useOscillator(po, reduceMotion);

  const diameter = Math.max(area.width, area.height) * 0.78 * blob.size;
  const amplitudeX = area.width * blob.driftX;
  const amplitudeY = area.height * blob.driftY;
  const strength = dark ? 1 : 0.6;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + glow.get() * 0.45,
    transform: [
      { translateX: (driftX.get() * 2 - 1) * amplitudeX },
      { translateY: (driftY.get() * 2 - 1) * amplitudeY },
      { scale: 0.88 + breathe.get() * 0.26 },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.blob,
        {
          width: diameter,
          height: diameter,
          left: area.width * blob.x - diameter / 2,
          top: area.height * blob.y - diameter / 2,
        },
        gradient(
          `radial-gradient(circle, ${withAlpha(color, strength)} 0%, ${withAlpha(color, strength * 0.45)} 38%, ${withAlpha(color, 0)} 70%)`,
        ),
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    borderRadius: 9999,
  },
  grain: {
    width: '100%',
    height: '100%',
  },
});

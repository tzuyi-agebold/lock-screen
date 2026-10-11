import { useEffect, useState, type ReactNode } from 'react';
import {
  Image,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
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

import { paletteForHour, useTheme, withAlpha, type GlowPalette } from '../theme';
import { gradient } from './gradient';

const noise = require('../../../assets/noise.png');

type LightName = 'umber' | 'ember' | 'haze' | 'cream';

/**
 * Where each light sits inside the slab and how it moves. Periods differ (and none divides
 * another), so the glow never visibly repeats; it slowly shifts like light through frost.
 * Painted in order, so the umber core sits on top of the cream glow.
 */
const LIGHTS: readonly {
  name: LightName;
  x: number;
  y: number;
  size: number;
  strength: number;
  driftX: number;
  driftY: number;
  periods: readonly [number, number, number, number];
}[] = [
  {
    name: 'cream',
    x: 0.6,
    y: 1.0,
    size: 1.25,
    strength: 0.95,
    driftX: 0.1,
    driftY: 0.05,
    periods: [21000, 17000, 15000, 23000],
  },
  {
    name: 'ember',
    x: 0.02,
    y: 0.5,
    size: 0.8,
    strength: 0.9,
    driftX: 0.06,
    driftY: 0.12,
    periods: [17000, 25000, 19000, 14000],
  },
  {
    name: 'haze',
    x: 1.0,
    y: 0.08,
    size: 0.75,
    strength: 0.75,
    driftX: 0.05,
    driftY: 0.08,
    periods: [26000, 18000, 22000, 16000],
  },
  {
    name: 'umber',
    x: 0.38,
    y: 0.18,
    size: 1.0,
    strength: 0.95,
    driftX: 0.12,
    driftY: 0.07,
    periods: [19000, 23000, 13000, 27000],
  },
];

const PHASE_CROSSFADE_MS = 1500;
/** How far the halo spreads beyond the slab's edges. */
const HALO_SPREAD = 72;

export interface GlowSlabProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Corner radius; drawn with continuous (squircle) corners on iOS. */
  radius?: number;
  /** Force a palette (otherwise it follows the time of day). */
  palette?: GlowPalette;
  testID?: string;
}

/**
 * A frosted slab lit from inside: deep umber, burnt orange, cream and blue-grey light drifting
 * behind frosted grain, with a warm halo spilling onto the surroundings. It's the one place
 * color lives in the app. With Reduce Motion on, the light holds still.
 */
export function GlowSlab({ children, style, radius = 40, palette, testID }: GlowSlabProps) {
  const { dark } = useTheme();
  const now = useNow(60_000);
  const glow = palette ?? paletteForHour(new Date(now).getHours());
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((previous) =>
      previous?.width === width && previous.height === height ? previous : { width, height },
    );
  };

  const [top, middle, bottom] = glow.base;
  // A soft light falling off around the slab, strongest just below it (where the cream is).
  const halo = gradient(
    `radial-gradient(ellipse closest-side at 50% 56%, ${withAlpha(glow.halo, dark ? 0.42 : 0.5)} 62%, ${withAlpha(glow.halo, dark ? 0.12 : 0.16)} 82%, ${withAlpha(glow.halo, 0)} 100%)`,
  );

  return (
    <View
      testID={testID}
      onLayout={onLayout}
      style={[styles.outer, { borderRadius: radius }, style]}
    >
      <View pointerEvents="none" style={[styles.halo, halo]} />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.clip,
          { borderRadius: radius },
          gradient(`linear-gradient(180deg, ${top} 0%, ${middle} 58%, ${bottom} 100%)`),
        ]}
      >
        {size ? (
          <Animated.View
            key={glow.phase}
            entering={FadeIn.duration(PHASE_CROSSFADE_MS)}
            exiting={FadeOut.duration(PHASE_CROSSFADE_MS)}
            style={StyleSheet.absoluteFill}
          >
            {LIGHTS.map((light, index) => (
              <Light key={light.name} index={index} color={glow[light.name]} size={size} />
            ))}
          </Animated.View>
        ) : null}
        <Image source={noise} resizeMode="repeat" style={[StyleSheet.absoluteFill, styles.grain]} />
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.rim,
            { borderRadius: radius },
            gradient(
              'linear-gradient(180deg, rgba(255, 244, 228, 0.16) 0%, rgba(255, 244, 228, 0) 22%)',
            ),
          ]}
        />
      </View>
      {children}
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

function Light({
  index,
  color,
  size,
}: {
  index: number;
  color: string;
  size: { width: number; height: number };
}) {
  const reduceMotion = useReducedMotion();
  const light = LIGHTS[index]!;
  const [px, py, ps, po] = light.periods;
  const driftX = useOscillator(px, reduceMotion);
  const driftY = useOscillator(py, reduceMotion);
  const breathe = useOscillator(ps, reduceMotion);
  const glow = useOscillator(po, reduceMotion);

  const diameter = Math.max(size.width, size.height) * light.size;
  const amplitudeX = size.width * light.driftX;
  const amplitudeY = size.height * light.driftY;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.7 + glow.get() * 0.3,
    transform: [
      { translateX: (driftX.get() * 2 - 1) * amplitudeX },
      { translateY: (driftY.get() * 2 - 1) * amplitudeY },
      { scale: 0.9 + breathe.get() * 0.2 },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.light,
        {
          width: diameter,
          height: diameter,
          left: size.width * light.x - diameter / 2,
          top: size.height * light.y - diameter / 2,
        },
        gradient(
          `radial-gradient(circle, ${withAlpha(color, light.strength)} 0%, ${withAlpha(color, light.strength * 0.5)} 32%, ${withAlpha(color, 0)} 68%)`,
        ),
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  outer: {
    borderCurve: 'continuous',
  },
  halo: {
    position: 'absolute',
    top: -HALO_SPREAD,
    left: -HALO_SPREAD,
    right: -HALO_SPREAD,
    bottom: -HALO_SPREAD * 1.3,
  },
  clip: {
    overflow: 'hidden',
    borderCurve: 'continuous',
  },
  light: {
    position: 'absolute',
    borderRadius: 9999,
  },
  grain: {
    width: '100%',
    height: '100%',
    opacity: 0.32,
    mixBlendMode: 'overlay',
  },
  rim: {
    borderWidth: 1,
    borderColor: 'rgba(255, 238, 214, 0.22)',
    borderCurve: 'continuous',
  },
});

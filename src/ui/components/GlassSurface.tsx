import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme';
import { GlassFill } from './GlassFill';

const liquidGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();

export interface GlassSurfaceProps {
  style?: StyleProp<ViewStyle>;
  /** Corner radius of the surface (needed to clip the glass layers). */
  borderRadius: number;
  children?: ReactNode;
  /** Liquid Glass reacts to touch on iOS 26+. */
  interactive?: boolean;
}

/**
 * Floating chrome (the intention pill): Liquid Glass on iOS 26+, otherwise the app's
 * monochrome glass material.
 */
export function GlassSurface({
  style,
  borderRadius,
  children,
  interactive = false,
}: GlassSurfaceProps) {
  const { dark } = useTheme();

  if (liquidGlass) {
    return (
      <GlassView
        style={[style, { borderRadius }]}
        glassEffectStyle="regular"
        colorScheme={dark ? 'dark' : 'light'}
        isInteractive={interactive}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View style={[styles.base, style, { borderRadius }]}>
      <GlassFill borderRadius={borderRadius} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});

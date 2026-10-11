import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme';

const liquidGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();

export interface GlassSurfaceProps {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** Liquid Glass reacts to touch on iOS 26+. */
  interactive?: boolean;
}

/**
 * Floating chrome material: Liquid Glass on iOS 26+, a system blur material on older iOS
 * and the web, and a translucent fill elsewhere.
 */
export function GlassSurface({ style, children, interactive = false }: GlassSurfaceProps) {
  const { dark, colors } = useTheme();

  if (liquidGlass) {
    return (
      <GlassView style={style} glassEffectStyle="regular" isInteractive={interactive}>
        {children}
      </GlassView>
    );
  }

  if (Platform.OS === 'android') {
    return (
      <View style={[style, { backgroundColor: colors.secondaryGroupedBackground }]}>
        {children}
      </View>
    );
  }

  return (
    <BlurView
      tint={dark ? 'systemMaterialDark' : 'systemMaterialLight'}
      intensity={90}
      style={[style, styles.clip, { borderColor: colors.separator }]}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
});

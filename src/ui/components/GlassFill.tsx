import { BlurView } from 'expo-blur';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme';
import { gradient } from './gradient';

export interface GlassFillProps {
  borderRadius: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * The glass / brushed-metal material, as an absolutely positioned layer behind a control's
 * content: frosted blur, a soft vertical sheen, a hairline rim and a thin top highlight.
 */
export function GlassFill({ borderRadius, style }: GlassFillProps) {
  const { glass } = useTheme();
  return (
    <View
      pointerEvents="none"
      style={[styles.fill, { borderRadius, borderColor: glass.rim }, style]}
    >
      <BlurView
        tint={glass.blurTint}
        intensity={glass.blurIntensity}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, gradient(glass.sheen)]} />
      <View style={[styles.highlight, gradient(glass.highlight)]} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    borderWidth: 1,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: '18%',
    right: '18%',
    height: 1,
  },
});

import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';

/** The app's mark: concentric rings around a point of focus, drawn in the label color. */
export function BrandMark({ size = 64 }: { size?: number }) {
  const { colors } = useTheme();
  const stroke = Math.max(2, Math.round(size * 0.055));
  const ring = (diameter: number, opacity: number) => ({
    width: diameter,
    height: diameter,
    borderRadius: diameter / 2,
    borderWidth: stroke,
    borderColor: colors.label,
    opacity,
  });

  return (
    <View style={[styles.box, { width: size, height: size }]} accessible={false}>
      <View style={[styles.center, ring(size, 0.4)]} />
      <View style={[styles.center, ring(size * 0.56, 1)]} />
      <View
        style={[
          styles.center,
          {
            width: size * 0.18,
            height: size * 0.18,
            borderRadius: size * 0.09,
            backgroundColor: colors.label,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
  },
});

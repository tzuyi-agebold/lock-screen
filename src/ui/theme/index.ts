import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type ColorPalette } from './colors';
import { glassMaterial, type GlassMaterial } from './materials';

export { AMBIENT_PALETTES, paletteForHour, phaseForHour, withAlpha } from './ambient';
export type { AmbientPalette, AmbientPhase } from './ambient';
export { darkColors, lightColors, type ColorPalette } from './colors';
export { glassMaterial, type GlassMaterial } from './materials';
export { typography, type TextVariant } from './typography';
export { durations, MIN_TOUCH_TARGET, radius, spacing, springs } from './tokens';

export type ColorName = keyof ColorPalette;

export interface Theme {
  dark: boolean;
  colors: ColorPalette;
  glass: GlassMaterial;
}

const light: Theme = { dark: false, colors: lightColors, glass: glassMaterial(false) };
const dark: Theme = { dark: true, colors: darkColors, glass: glassMaterial(true) };

/** Current theme, following the phone's light/dark appearance. */
export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

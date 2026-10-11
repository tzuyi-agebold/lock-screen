import { createContext, createElement, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type ColorPalette } from './colors';

export { darkColors, lightColors, type ColorPalette } from './colors';
export { roundedFontFamily, typography, type TextVariant } from './typography';
export { durations, MIN_TOUCH_TARGET, radius, spacing, springs } from './tokens';

export type ColorName = keyof ColorPalette;
export type Scheme = 'light' | 'dark';

export interface Theme {
  dark: boolean;
  colors: ColorPalette;
}

const light: Theme = { dark: false, colors: lightColors };
const dark: Theme = { dark: true, colors: darkColors };

const ForcedScheme = createContext<Scheme | null>(null);

/** Forces a color scheme for a subtree, e.g. the always-dark time's-up screen. */
export function ThemeScope({ scheme, children }: { scheme: Scheme; children: ReactNode }) {
  return createElement(ForcedScheme.Provider, { value: scheme }, children);
}

/** Current theme: a forced `ThemeScope` if any, otherwise the system appearance. */
export function useTheme(): Theme {
  const forced = useContext(ForcedScheme);
  const system = useColorScheme();
  return (forced ?? system) === 'dark' ? dark : light;
}

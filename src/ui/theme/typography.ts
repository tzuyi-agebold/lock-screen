import { Platform, type TextStyle } from 'react-native';

/**
 * Type scale: iOS Dynamic Type sizes with a quieter, tighter voice (lighter weights,
 * negative tracking), plus three expressive styles used sparingly:
 * - `display` for the intention itself,
 * - `numeral` for countdowns,
 * - `micro` for the few labels the interface needs, in monospace.
 *
 * Text scales with the user's Dynamic Type setting (`allowFontScaling`), and the system font
 * resolves to SF Pro on iOS.
 */
export type TextVariant =
  | 'display'
  | 'numeral'
  | 'title'
  | 'headline'
  | 'body'
  | 'callout'
  | 'subheadline'
  | 'footnote'
  | 'caption'
  | 'micro';

/** Monospace for the small labels, like an instrument readout. */
const monoFamily = Platform.select({
  ios: 'ui-monospace',
  web: 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace',
  default: 'monospace',
});

const fontFamily = Platform.select({
  web: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, "Helvetica Neue", system-ui, sans-serif',
  default: undefined,
});

export const typography: Record<TextVariant, TextStyle> = {
  display: { fontFamily, fontSize: 32, lineHeight: 38, letterSpacing: -0.8, fontWeight: '500' },
  numeral: {
    fontFamily,
    fontSize: 64,
    lineHeight: 70,
    letterSpacing: -2,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
  },
  title: { fontFamily, fontSize: 28, lineHeight: 34, letterSpacing: -0.6, fontWeight: '600' },
  headline: { fontFamily, fontSize: 17, lineHeight: 22, letterSpacing: -0.3, fontWeight: '600' },
  body: { fontFamily, fontSize: 17, lineHeight: 22, letterSpacing: -0.3, fontWeight: '400' },
  callout: { fontFamily, fontSize: 16, lineHeight: 21, letterSpacing: -0.2, fontWeight: '400' },
  subheadline: {
    fontFamily,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.15,
    fontWeight: '400',
  },
  footnote: { fontFamily, fontSize: 13, lineHeight: 18, letterSpacing: -0.05, fontWeight: '400' },
  caption: { fontFamily, fontSize: 12, lineHeight: 16, letterSpacing: 0, fontWeight: '400' },
  micro: {
    fontFamily: monoFamily,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.8,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
};

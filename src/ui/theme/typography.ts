import { Platform, type TextStyle } from 'react-native';

/**
 * iOS Dynamic Type text styles at the default ("Large") content size.
 * Sizes, leading and tracking from Apple's HIG › Typography › Specifications.
 *
 * Text scales with the user's Dynamic Type setting automatically (`allowFontScaling`),
 * and the system font resolves to SF Pro on iOS.
 */
export type TextVariant =
  | 'largeTitle'
  | 'title1'
  | 'title2'
  | 'title3'
  | 'headline'
  | 'body'
  | 'callout'
  | 'subheadline'
  | 'footnote'
  | 'caption1'
  | 'caption2';

const fontFamily = Platform.select({
  web: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", system-ui, sans-serif',
  default: undefined,
});

/** SF Pro Rounded — used sparingly for numerals and timers, like the iOS Clock app. */
export const roundedFontFamily = Platform.select({
  ios: 'ui-rounded',
  web: 'ui-rounded, "SF Pro Rounded", -apple-system, system-ui, sans-serif',
  default: undefined,
});

export const typography: Record<TextVariant, TextStyle> = {
  largeTitle: { fontFamily, fontSize: 34, lineHeight: 41, letterSpacing: 0.4, fontWeight: '700' },
  title1: { fontFamily, fontSize: 28, lineHeight: 34, letterSpacing: 0.38, fontWeight: '700' },
  title2: { fontFamily, fontSize: 22, lineHeight: 28, letterSpacing: -0.26, fontWeight: '700' },
  title3: { fontFamily, fontSize: 20, lineHeight: 25, letterSpacing: -0.45, fontWeight: '600' },
  headline: { fontFamily, fontSize: 17, lineHeight: 22, letterSpacing: -0.43, fontWeight: '600' },
  body: { fontFamily, fontSize: 17, lineHeight: 22, letterSpacing: -0.43, fontWeight: '400' },
  callout: { fontFamily, fontSize: 16, lineHeight: 21, letterSpacing: -0.31, fontWeight: '400' },
  subheadline: {
    fontFamily,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.23,
    fontWeight: '400',
  },
  footnote: { fontFamily, fontSize: 13, lineHeight: 18, letterSpacing: -0.08, fontWeight: '400' },
  caption1: { fontFamily, fontSize: 12, lineHeight: 16, letterSpacing: 0, fontWeight: '400' },
  caption2: { fontFamily, fontSize: 11, lineHeight: 13, letterSpacing: 0.06, fontWeight: '400' },
};

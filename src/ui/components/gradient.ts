import { Platform, type ViewStyle } from 'react-native';

/**
 * A CSS gradient (`linear-gradient(...)` / `radial-gradient(...)`) as a view background:
 * React Native's `experimental_backgroundImage` on iOS/Android (New Architecture, available in
 * Expo Go), plain CSS `backgroundImage` on the web. No extra native dependency.
 */
export function gradient(css: string): ViewStyle {
  return (
    Platform.OS === 'web' ? { backgroundImage: css } : { experimental_backgroundImage: css }
  ) as ViewStyle;
}

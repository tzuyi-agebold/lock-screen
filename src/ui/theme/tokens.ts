/** 4-pt spacing grid. iOS content margins are 16 pt (compact) / 20 pt (regular). */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  /** Inset-grouped list sections and cards. */
  lg: 16,
  xl: 22,
  /** Fully rounded capsule — iOS buttons and the floating pill. */
  capsule: 999,
} as const;

/** Apple's minimum hit target. */
export const MIN_TOUCH_TARGET = 44;

/**
 * Spring presets that approximate SwiftUI's `.snappy`, `.smooth` and `.bouncy`.
 * Used with Reanimated's `withSpring`; swapped for timing when Reduce Motion is on.
 */
export const springs = {
  snappy: { damping: 22, stiffness: 260, mass: 1 },
  smooth: { damping: 28, stiffness: 180, mass: 1 },
  bouncy: { damping: 14, stiffness: 200, mass: 1 },
} as const;

export const durations = {
  fast: 160,
  base: 240,
  slow: 360,
} as const;

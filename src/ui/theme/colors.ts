/**
 * iOS system colors (UIKit semantic colors), light and dark.
 * Values follow Apple's Human Interface Guidelines › Color.
 *
 * Hex/rgba strings (rather than PlatformColor) keep them usable everywhere — Reanimated
 * interpolation, web preview, and native props that require strings.
 */
export interface ColorPalette {
  /** App accent. Indigo reads as calm and intentional, not alarming. */
  tint: string;
  onTint: string;
  tintFill: string;

  background: string;
  secondaryBackground: string;
  groupedBackground: string;
  secondaryGroupedBackground: string;
  tertiaryGroupedBackground: string;

  label: string;
  secondaryLabel: string;
  tertiaryLabel: string;
  quaternaryLabel: string;

  separator: string;
  fill: string;
  secondaryFill: string;
  tertiaryFill: string;

  green: string;
  red: string;
  orange: string;
  indigo: string;
  teal: string;
  blue: string;
  gray: string;

  /** Deep indigo night for the time's-up / rest screen. */
  restBackground: string;
}

export const lightColors: ColorPalette = {
  tint: '#5856D6',
  onTint: '#FFFFFF',
  tintFill: 'rgba(88, 86, 214, 0.14)',

  background: '#FFFFFF',
  secondaryBackground: '#F2F2F7',
  groupedBackground: '#F2F2F7',
  secondaryGroupedBackground: '#FFFFFF',
  tertiaryGroupedBackground: '#F2F2F7',

  label: '#000000',
  secondaryLabel: 'rgba(60, 60, 67, 0.6)',
  tertiaryLabel: 'rgba(60, 60, 67, 0.3)',
  quaternaryLabel: 'rgba(60, 60, 67, 0.18)',

  separator: 'rgba(60, 60, 67, 0.29)',
  fill: 'rgba(120, 120, 128, 0.2)',
  secondaryFill: 'rgba(120, 120, 128, 0.16)',
  tertiaryFill: 'rgba(118, 118, 128, 0.12)',

  green: '#34C759',
  red: '#FF3B30',
  orange: '#FF9500',
  indigo: '#5856D6',
  teal: '#30B0C7',
  blue: '#007AFF',
  gray: '#8E8E93',

  restBackground: '#14132B',
};

export const darkColors: ColorPalette = {
  tint: '#7D7AFF',
  onTint: '#FFFFFF',
  tintFill: 'rgba(125, 122, 255, 0.22)',

  background: '#000000',
  secondaryBackground: '#1C1C1E',
  groupedBackground: '#000000',
  secondaryGroupedBackground: '#1C1C1E',
  tertiaryGroupedBackground: '#2C2C2E',

  label: '#FFFFFF',
  secondaryLabel: 'rgba(235, 235, 245, 0.6)',
  tertiaryLabel: 'rgba(235, 235, 245, 0.3)',
  quaternaryLabel: 'rgba(235, 235, 245, 0.16)',

  separator: 'rgba(84, 84, 88, 0.6)',
  fill: 'rgba(120, 120, 128, 0.36)',
  secondaryFill: 'rgba(120, 120, 128, 0.32)',
  tertiaryFill: 'rgba(118, 118, 128, 0.24)',

  green: '#30D158',
  red: '#FF453A',
  orange: '#FF9F0A',
  indigo: '#5E5CE6',
  teal: '#40C8E0',
  blue: '#0A84FF',
  gray: '#8E8E93',

  restBackground: '#14132B',
};

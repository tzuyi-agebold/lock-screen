/**
 * Monochrome palette. The interface is black and white only; the accent is the label color
 * itself. The only color in the app lives in the ambient background (`ambient.ts`) and in the
 * single destructive action.
 */
export interface ColorPalette {
  background: string;
  /** Faint fill for tracks and quiet containers (4% of the label color). */
  surface: string;
  /** A slightly stronger fill, e.g. pressed rows. */
  surfaceStrong: string;
  /** Hairlines between content. */
  border: string;
  /** Rims of glass controls. */
  borderStrong: string;

  label: string;
  secondaryLabel: string;
  tertiaryLabel: string;
  quaternaryLabel: string;
  /** Text and glyphs drawn on a `label`-colored fill (switch thumb, dot). */
  onLabel: string;

  danger: string;
}

export const darkColors: ColorPalette = {
  background: '#000000',
  surface: 'rgba(255, 255, 255, 0.04)',
  surfaceStrong: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(255, 255, 255, 0.09)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',

  label: '#FFFFFF',
  secondaryLabel: 'rgba(255, 255, 255, 0.56)',
  tertiaryLabel: 'rgba(255, 255, 255, 0.34)',
  quaternaryLabel: 'rgba(255, 255, 255, 0.18)',
  onLabel: '#000000',

  danger: '#FF6369',
};

export const lightColors: ColorPalette = {
  background: '#FFFFFF',
  surface: 'rgba(0, 0, 0, 0.04)',
  surfaceStrong: 'rgba(0, 0, 0, 0.07)',
  border: 'rgba(0, 0, 0, 0.08)',
  borderStrong: 'rgba(0, 0, 0, 0.14)',

  label: '#0A0A0A',
  secondaryLabel: 'rgba(0, 0, 0, 0.55)',
  tertiaryLabel: 'rgba(0, 0, 0, 0.32)',
  quaternaryLabel: 'rgba(0, 0, 0, 0.16)',
  onLabel: '#FFFFFF',

  danger: '#E5484D',
};

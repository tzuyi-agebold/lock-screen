/**
 * The glass / brushed-metal material used by every control (buttons, the choice indicator,
 * icon buttons, the floating pill). Never a solid fill: a frosted blur, a soft vertical
 * sheen, a hairline rim and a thin highlight along the top edge.
 */
export interface GlassMaterial {
  /** expo-blur tint for the frosted base. */
  blurTint: 'systemUltraThinMaterialDark' | 'systemUltraThinMaterialLight';
  blurIntensity: number;
  /** CSS linear-gradient for the sheen over the blur. */
  sheen: string;
  rim: string;
  /** CSS linear-gradient for the 1-pt highlight along the top edge. */
  highlight: string;
  shadow: string;
}

const darkGlass: GlassMaterial = {
  blurTint: 'systemUltraThinMaterialDark',
  blurIntensity: 40,
  sheen:
    'linear-gradient(180deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.06) 55%, rgba(255, 255, 255, 0.10) 100%)',
  rim: 'rgba(255, 255, 255, 0.14)',
  highlight:
    'linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.55) 50%, rgba(255, 255, 255, 0) 100%)',
  shadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
};

const lightGlass: GlassMaterial = {
  blurTint: 'systemUltraThinMaterialLight',
  blurIntensity: 50,
  sheen:
    'linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(244, 244, 244, 0.82) 60%, rgba(236, 236, 236, 0.88) 100%)',
  rim: 'rgba(0, 0, 0, 0.08)',
  highlight:
    'linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 50%, rgba(255, 255, 255, 0) 100%)',
  shadow: '0 1px 2px rgba(0, 0, 0, 0.06), 0 6px 20px rgba(0, 0, 0, 0.08)',
};

export function glassMaterial(dark: boolean): GlassMaterial {
  return dark ? darkGlass : lightGlass;
}

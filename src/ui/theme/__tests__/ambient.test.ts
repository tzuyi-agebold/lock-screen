import { AMBIENT_PALETTES, paletteForHour, phaseForHour, withAlpha } from '../ambient';

describe('ambient palette by time of day', () => {
  it('maps hours to dawn, day and dusk', () => {
    expect(phaseForHour(4)).toBe('dusk');
    expect(phaseForHour(5)).toBe('dawn');
    expect(phaseForHour(10)).toBe('dawn');
    expect(phaseForHour(11)).toBe('day');
    expect(phaseForHour(16)).toBe('day');
    expect(phaseForHour(17)).toBe('dusk');
    expect(phaseForHour(23)).toBe('dusk');
    expect(phaseForHour(0)).toBe('dusk');
  });

  it('wraps out-of-range hours', () => {
    expect(phaseForHour(29)).toBe('dawn');
    expect(phaseForHour(-1)).toBe('dusk');
  });

  it('returns four colors per palette', () => {
    expect(paletteForHour(13)).toBe(AMBIENT_PALETTES.day);
    Object.values(AMBIENT_PALETTES).forEach((palette) => {
      expect(palette.colors).toHaveLength(4);
      palette.colors.forEach((color) => expect(color).toMatch(/^#[0-9A-F]{6}$/i));
    });
  });

  it('converts hex to rgba', () => {
    expect(withAlpha('#2E6B50', 0.5)).toBe('rgba(46, 107, 80, 0.5)');
  });
});

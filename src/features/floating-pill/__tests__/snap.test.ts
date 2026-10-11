import {
  PILL_MARGIN,
  project,
  reanchor,
  resolveSnap,
  TUCK_VISIBLE_WIDTH,
  untuck,
  type SnapArea,
} from '../snap';

// iPhone 15-sized screen with notch and home-indicator insets.
const area: SnapArea = { width: 393, height: 852, top: 59, bottom: 34, left: 0, right: 0 };
const size = { width: 200, height: 48 };

const minX = PILL_MARGIN;
const maxX = area.width - size.width - PILL_MARGIN;
const minY = area.top + PILL_MARGIN;
const maxY = area.height - area.bottom - size.height - PILL_MARGIN;
const still = { x: 0, y: 0 };

describe('resolveSnap', () => {
  it('rests in the nearest corner when released without velocity', () => {
    expect(resolveSnap({ x: 20, y: 120 }, still, size, area)).toEqual({
      x: minX,
      y: minY,
      side: 'left',
      tucked: false,
    });
    expect(resolveSnap({ x: 180, y: 600 }, still, size, area)).toEqual({
      x: maxX,
      y: maxY,
      side: 'right',
      tucked: false,
    });
  });

  it('follows a flick toward the opposite corner', () => {
    const result = resolveSnap({ x: 20, y: 120 }, { x: 1500, y: 2500 }, size, area);
    expect(result).toMatchObject({ x: maxX, y: maxY, side: 'right', tucked: false });
  });

  it('tucks into the edge when dragged past it, keeping a grab-able sliver', () => {
    const left = resolveSnap({ x: -100, y: 400 }, still, size, area);
    expect(left).toEqual({
      x: TUCK_VISIBLE_WIDTH - size.width,
      y: 400,
      side: 'left',
      tucked: true,
    });

    const right = resolveSnap({ x: area.width - 90, y: 400 }, still, size, area);
    expect(right).toEqual({
      x: area.width - TUCK_VISIBLE_WIDTH,
      y: 400,
      side: 'right',
      tucked: true,
    });
  });

  it('tucks when flicked hard toward an edge', () => {
    expect(resolveSnap({ x: 100, y: 400 }, { x: -2000, y: 0 }, size, area).tucked).toBe(true);
  });

  it('clamps a tucked pill vertically inside the safe area', () => {
    const result = resolveSnap({ x: -150, y: 5 }, still, size, area);
    expect(result).toMatchObject({ tucked: true, y: minY });
  });

  it('never produces an inverted range on a tiny container', () => {
    const tiny: SnapArea = { width: 150, height: 60, top: 0, bottom: 0, left: 0, right: 0 };
    const result = resolveSnap({ x: 10, y: 10 }, still, size, tiny);
    expect(result.x).toBe(PILL_MARGIN);
    expect(result.y).toBe(PILL_MARGIN);
  });
});

describe('untuck and reanchor', () => {
  it('returns a tucked pill to the corner on the same side', () => {
    expect(untuck(700, 'right', size, area)).toEqual({
      x: maxX,
      y: maxY,
      side: 'right',
      tucked: false,
    });
  });

  it('keeps a corner pill in its corner when it grows', () => {
    const bigger = { width: 300, height: 140 };
    const result = reanchor({ x: maxX, y: maxY, side: 'right', tucked: false }, bigger, area);
    expect(result).toEqual({
      x: area.width - bigger.width - PILL_MARGIN,
      y: area.height - area.bottom - bigger.height - PILL_MARGIN,
      side: 'right',
      tucked: false,
    });
  });
});

describe('project', () => {
  it('is proportional to velocity and zero at rest', () => {
    expect(project(0)).toBe(0);
    expect(project(1000)).toBeCloseTo(199);
    expect(project(-1000)).toBeCloseTo(-199);
  });
});

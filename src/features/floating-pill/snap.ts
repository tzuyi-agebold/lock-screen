/**
 * Picture-in-Picture style snapping for the floating intention pill.
 *
 * Every function is a worklet so it runs on the UI thread inside gesture callbacks, and is
 * also plain TypeScript so it can be unit-tested in Jest.
 */

export type Side = 'left' | 'right';

export interface Size {
  width: number;
  height: number;
}

/** Container size plus the safe-area insets the pill must respect. */
export interface SnapArea {
  width: number;
  height: number;
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface SnapResult {
  x: number;
  y: number;
  side: Side;
  tucked: boolean;
}

/** Distance between the pill and the safe-area edge when resting in a corner. */
export const PILL_MARGIN = 12;
/** Width of the sliver that stays on screen when the pill is tucked into an edge. */
export const TUCK_VISIBLE_WIDTH = 28;
/** How far past the edge (as a fraction of pill width) a release needs to tuck the pill. */
export const TUCK_THRESHOLD = 0.35;

function clamp(value: number, min: number, max: number): number {
  'worklet';
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/**
 * Where a flicked object would come to rest, using the deceleration model from Apple's
 * "Designing Fluid Interfaces" (WWDC 2018). Velocity is in points per second.
 */
export function project(velocity: number, decelerationRate = 0.995): number {
  'worklet';
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

export function cornerBounds(size: Size, area: SnapArea) {
  'worklet';
  const minX = area.left + PILL_MARGIN;
  const maxX = Math.max(minX, area.width - area.right - size.width - PILL_MARGIN);
  const minY = area.top + PILL_MARGIN;
  const maxY = Math.max(minY, area.height - area.bottom - size.height - PILL_MARGIN);
  return { minX, maxX, minY, maxY };
}

/** x for a pill tucked into `side`, leaving only a grab-able sliver visible. */
export function tuckedX(side: Side, size: Size, area: SnapArea): number {
  'worklet';
  return side === 'left' ? TUCK_VISIBLE_WIDTH - size.width : area.width - TUCK_VISIBLE_WIDTH;
}

/**
 * Resolves where the pill should settle after a drag ends.
 *
 * - Released (or flicked) far enough past the left/right screen edge → tucked into that edge,
 *   keeping its vertical position.
 * - Otherwise → the nearest of the four safe-area corners, after projecting the flick.
 */
export function resolveSnap(
  position: { x: number; y: number },
  velocity: { x: number; y: number },
  size: Size,
  area: SnapArea,
): SnapResult {
  'worklet';
  const { minX, maxX, minY, maxY } = cornerBounds(size, area);
  const projectedX = position.x + project(velocity.x);
  const projectedY = position.y + project(velocity.y);

  // Tuck when the pill is released partly past an edge, or flicked mostly sideways hard
  // enough that it would fly fully off screen.
  const threshold = size.width * TUCK_THRESHOLD;
  const horizontalFlick = Math.abs(velocity.x) > Math.abs(velocity.y);
  const pastLeft = position.x < -threshold || (horizontalFlick && projectedX + size.width < 0);
  const pastRight =
    position.x + size.width > area.width + threshold ||
    (horizontalFlick && projectedX > area.width);

  if (pastLeft || pastRight) {
    const side: Side = pastLeft ? 'left' : 'right';
    return {
      x: tuckedX(side, size, area),
      y: clamp(position.y, minY, maxY),
      side,
      tucked: true,
    };
  }

  const side: Side = projectedX + size.width / 2 < area.width / 2 ? 'left' : 'right';
  const top = projectedY + size.height / 2 < (minY + maxY + size.height) / 2;
  return {
    x: side === 'left' ? minX : maxX,
    y: top ? minY : maxY,
    side,
    tucked: false,
  };
}

/** Brings a tucked pill back to the corner on the same side, nearest vertically. */
export function untuck(y: number, side: Side, size: Size, area: SnapArea): SnapResult {
  'worklet';
  const { minX, maxX, minY, maxY } = cornerBounds(size, area);
  const top = y + size.height / 2 < (minY + maxY + size.height) / 2;
  return { x: side === 'left' ? minX : maxX, y: top ? minY : maxY, side, tucked: false };
}

/** Keeps a resting pill inside the area after its size or the screen size changes. */
export function reanchor(snap: SnapResult, size: Size, area: SnapArea): SnapResult {
  'worklet';
  const { minX, maxX, minY, maxY } = cornerBounds(size, area);
  if (snap.tucked) {
    return { ...snap, x: tuckedX(snap.side, size, area), y: clamp(snap.y, minY, maxY) };
  }
  const distanceToTop = Math.abs(snap.y - minY);
  const distanceToBottom = Math.abs(snap.y - maxY);
  return {
    ...snap,
    x: snap.side === 'left' ? minX : maxX,
    y: distanceToTop <= distanceToBottom ? minY : maxY,
  };
}

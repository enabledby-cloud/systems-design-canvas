import { describe, it, expect } from 'vitest';
import { roundedPolylinePath, polylineMidpoint } from './system-edge';

describe('roundedPolylinePath', () => {
  it('draws a straight line for two points', () => {
    const path = roundedPolylinePath([{ x: 0, y: 0 }, { x: 100, y: 0 }], 16);
    expect(path).toBe('M 0,0 L 100,0');
  });

  it('rounds interior corners with a quadratic curve for three or more points', () => {
    const path = roundedPolylinePath(
      [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }],
      16
    );
    expect(path).toContain('Q 100,0');
    expect(path.startsWith('M 0,0')).toBe(true);
    expect(path.endsWith('L 100,100')).toBe(true);
  });

  it('clamps the corner radius so it never exceeds half of the shorter adjacent segment', () => {
    // Segments are only 10 long; a radius of 16 must not overshoot past the segment midpoints.
    const path = roundedPolylinePath(
      [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }],
      16
    );
    expect(path).toContain('L 5,0');
  });
});

describe('polylineMidpoint', () => {
  it('finds the point halfway along a single straight segment', () => {
    expect(polylineMidpoint([{ x: 0, y: 0 }, { x: 100, y: 0 }])).toEqual({ x: 50, y: 0 });
  });

  it('finds the halfway point by cumulative length across multiple segments', () => {
    // Total length 150 (100 + 50); midpoint at length 75 falls 75 units into the first segment.
    const mid = polylineMidpoint([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }]);
    expect(mid).toEqual({ x: 75, y: 0 });
  });
});

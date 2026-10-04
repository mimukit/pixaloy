import { describe, expect, it } from 'vitest';
import { boxModelFromBorderBox, formatSize } from '../../src/inspector/geometry';

const edges = (top: number, right = top, bottom = top, left = right) => ({
  top,
  right,
  bottom,
  left,
});

describe('boxModelFromBorderBox', () => {
  it('derives the margin, padding and content boxes from the border box', () => {
    const box = boxModelFromBorderBox(
      { x: 100, y: 50, width: 332, height: 100 },
      edges(20),
      edges(4),
      edges(12),
    );
    expect(box.margin).toEqual({ x: 80, y: 30, width: 372, height: 140 });
    expect(box.padding).toEqual({ x: 104, y: 54, width: 324, height: 92 });
    expect(box.content).toEqual({ x: 116, y: 66, width: 300, height: 68 });
  });

  it('shrinks the margin box for negative margins and never goes below zero size', () => {
    const box = boxModelFromBorderBox(
      { x: 0, y: 0, width: 10, height: 10 },
      edges(-2),
      edges(0),
      edges(8),
    );
    expect(box.margin).toEqual({ x: 2, y: 2, width: 6, height: 6 });
    expect(box.content.width).toBe(0);
    expect(box.content.height).toBe(0);
  });
});

describe('formatSize', () => {
  it('rounds to two decimals', () => {
    expect(formatSize(332, 99.995)).toBe('332 × 100');
    expect(formatSize(12.345, 0.5)).toBe('12.35 × 0.5');
  });
});

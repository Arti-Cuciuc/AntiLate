import { test } from 'node:test';
import assert from 'node:assert/strict';
import { themeWaveRadius } from '../src/lib/theme-transition.ts';

test('theme wave covers all viewport corners from the toggle', () => {
  for (const [width, height, x, y] of [[390, 844, 220, 40], [1440, 900, 1100, 50], [320, 740, 0, 0], [1440, 900, 720, 450]]) {
    const radius = themeWaveRadius({ x, y }, width, height);
    for (const [cx, cy] of [[0, 0], [width, 0], [0, height], [width, height]]) assert.ok(radius >= Math.hypot(cx - x, cy - y));
  }
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSiteTheme, resolveSiteTheme } from '../src/lib/site-theme.ts';

test('new visitors and malformed preferences use the system theme', () => {
  for (const value of [null, undefined, '', 'invalid', 4, 'system']) assert.equal(parseSiteTheme(value), 'system');
  assert.equal(parseSiteTheme('dark'), 'dark');
  assert.equal(parseSiteTheme('light'), 'light');
});
test('system theme follows the OS; explicit preferences override it', () => {
  assert.equal(resolveSiteTheme('system', true), 'dark');
  assert.equal(resolveSiteTheme('system', false), 'light');
  assert.equal(resolveSiteTheme('light', true), 'light');
  assert.equal(resolveSiteTheme('dark', false), 'dark');
});

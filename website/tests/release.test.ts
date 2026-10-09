import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getApkAsset, safeDownloadUrl } from '../src/lib/release.ts';

test('download URLs reject executable, insecure and protocol-relative links', () => {
  for (const url of ['javascript:alert(1)', 'http://example.com/app.apk', '//example.com/app.apk', '/\\example.com/app.apk', '/\n/example.com/app.apk', 'https://user:pass@example.com/app.apk']) assert.equal(safeDownloadUrl(url), null);
  assert.equal(safeDownloadUrl('/app.apk'), '/app.apk');
  assert.equal(safeDownloadUrl('https://example.com/app.apk'), 'https://example.com/app.apk');
});
test('only a release APK from the project is selected', () => {
  const apk = 'https://github.com/Arti-Cuciuc/AntiLate/releases/download/v1/AntiLate.apk';
  assert.equal(getApkAsset({ assets: [{ name: 'source.zip' }, { name: 'AntiLate.apk', browser_download_url: apk }] }), apk);
  assert.equal(getApkAsset({ assets: [{ name: 'app.apk', browser_download_url: 'https://example.com/app.apk' }] }), null);
});
test('missing and malformed releases do not produce fake links', () => {
  for (const value of [null, {}, { assets: null }, { assets: [] }, { assets: [null, 4, { name: 'app.aab' }] }]) assert.equal(getApkAsset(value), null);
});

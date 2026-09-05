import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeSiteAsset, MAX_SITE_ASSET_BYTES } from './site-assets.mjs';

const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

test('site image uploads accept bounded raster images only', () => {
  const asset = decodeSiteAsset({ kind: 'logo', dataUrl: `data:image/png;base64,${png.toString('base64')}` });
  assert.equal(asset.kind, 'logo');
  assert.equal(asset.mime, 'image/png');
  assert.equal(asset.key.length, 64);
  assert.throws(() => decodeSiteAsset({ kind: 'unknown', dataUrl: `data:image/png;base64,${png.toString('base64')}` }), /тип/);
  assert.throws(() => decodeSiteAsset({ kind: 'logo', dataUrl: 'data:image/svg+xml;base64,PHN2Zz4=' }), /PNG/);
  assert.throws(() => decodeSiteAsset({ kind: 'favicon', dataUrl: `data:image/png;base64,${Buffer.alloc(MAX_SITE_ASSET_BYTES + 1).toString('base64')}` }), /4 МБ/);
});

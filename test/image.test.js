const test = require('node:test');
const assert = require('node:assert/strict');
const { detectImageMimeType } = require('../backend/utils/image');

test('detects supported image formats by their file signatures', () => {
  assert.equal(
    detectImageMimeType(Buffer.from([0xff, 0xd8, 0xff, 0x00])),
    'image/jpeg',
  );
  assert.equal(
    detectImageMimeType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    'image/png',
  );
  assert.equal(
    detectImageMimeType(Buffer.from('RIFF0000WEBP')),
    'image/webp',
  );
  assert.equal(detectImageMimeType(Buffer.from('not an image')), null);
});

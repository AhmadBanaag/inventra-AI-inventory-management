const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../backend/server');

let server;
let baseUrl;

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('serves the scan page and redirects the app root to it', async () => {
  const rootResponse = await fetch(baseUrl, { redirect: 'manual' });
  const pageResponse = await fetch(`${baseUrl}/pages/scan-inventory.html`);
  const page = await pageResponse.text();

  assert.equal(rootResponse.status, 302);
  assert.equal(rootResponse.headers.get('location'), '/pages/scan-inventory.html');
  assert.equal(pageResponse.status, 200);
  assert.match(page, /Process with Gemini AI/);
});

test('returns a clear error when no image is uploaded', async () => {
  const response = await fetch(`${baseUrl}/api/ai/extract`, {
    method: 'POST',
    body: new FormData(),
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error.code, 'IMAGE_REQUIRED');
});

test('rejects unsupported image media types before calling Gemini', async () => {
  const formData = new FormData();
  formData.append('image', new Blob(['not an image'], { type: 'text/plain' }), 'note.txt');
  const response = await fetch(`${baseUrl}/api/ai/extract`, {
    method: 'POST',
    body: formData,
  });
  const body = await response.json();

  assert.equal(response.status, 415);
  assert.equal(body.error.code, 'UNSUPPORTED_IMAGE_TYPE');
});

test('rejects image uploads with a spoofed supported media type', async () => {
  const formData = new FormData();
  formData.append('image', new Blob(['not a PNG'], { type: 'image/png' }), 'fake.png');
  const response = await fetch(`${baseUrl}/api/ai/extract`, {
    method: 'POST',
    body: formData,
  });
  const body = await response.json();

  assert.equal(response.status, 415);
  assert.equal(body.error.code, 'INVALID_IMAGE_CONTENT');
});

test('rejects empty images', async () => {
  const formData = new FormData();
  formData.append('image', new Blob([], { type: 'image/png' }), 'empty.png');
  const response = await fetch(`${baseUrl}/api/ai/extract`, {
    method: 'POST',
    body: formData,
  });
  const body = await response.json();

  assert.equal(response.status, 415);
  assert.equal(body.error.code, 'EMPTY_IMAGE');
});

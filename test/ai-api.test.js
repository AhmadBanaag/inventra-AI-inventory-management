const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../backend/server');
const productService = require('../backend/services/productService');

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

test('scan results page exposes unit price, manual add, and verified save controls', async () => {
  const response = await fetch(`${baseUrl}/pages/scan-results.html`);
  const page = await response.text();

  assert.equal(response.status, 200);
  assert.match(page, /Unit prices are extracted only when clearly written/);
  assert.match(page, /Add missing product/);
  assert.match(page, /Save verified products to inventory/);
});

test('print sheet link points to the inventory template', async () => {
  const [landingResponse, templateResponse, removedTemplateResponse] = await Promise.all([
    fetch(`${baseUrl}/index.html`),
    fetch(`${baseUrl}/pages/inventory-template.html`),
    fetch(`${baseUrl}/pages/print-template.html`),
  ]);
  const landingPage = await landingResponse.text();

  assert.equal(templateResponse.status, 200);
  assert.equal(removedTemplateResponse.status, 404);
  assert.match(landingPage, /pages\/inventory-template\.html/);
  assert.doesNotMatch(landingPage, /pages\/print-template\.html/);
});

test('requires a unit price when saving verified AI results', async () => {
  const response = await fetch(`${baseUrl}/api/ai/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ name: 'Rice', quantity: 3, category: 'Food' }],
    }),
  });
  const body = await response.json();

  assert.equal(response.status, 422);
  assert.match(body.error.message, /Invalid items/);
  assert.equal(body.error.details[0].field, 'unit_price');
});

test('rejects malformed entries in verified AI results', async () => {
  const response = await fetch(`${baseUrl}/api/ai/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [null] }),
  });
  const body = await response.json();

  assert.equal(response.status, 422);
  assert.equal(body.error.details[0].field, 'item');
});

test('saves explicitly verified AI results through the inventory upsert', async () => {
  const originalBatchUpsert = productService.batchUpsertVerifiedProducts;
  const item = {
    name: 'Rice',
    quantity: 3,
    unit: 'bags',
    unit_price: 12.5,
    category: 'Food',
  };
  let savedItems;
  productService.batchUpsertVerifiedProducts = async (items) => {
    savedItems = items;
    return { totalProcessed: items.length, addedCount: 1, updatedCount: 0, mode: 'additive' };
  };

  try {
    const response = await fetch(`${baseUrl}/api/ai/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [item] }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(savedItems, [item]);
    assert.equal(body.success, true);
    assert.equal(body.data.summary.addedCount, 1);
  } finally {
    productService.batchUpsertVerifiedProducts = originalBatchUpsert;
  }
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

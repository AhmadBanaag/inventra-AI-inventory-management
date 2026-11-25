const test = require('node:test');
const assert = require('node:assert/strict');
const {
  extractInventoryFromImage,
  normalizeItem,
  parseGeminiResponse,
} = require('../backend/services/geminiService');

test('marks incomplete and low-confidence extraction fields for review', () => {
  const item = normalizeItem({
    name: 'Apples',
    quantity: null,
    unit: '',
    category: 'Produce',
    confidence: 0.6,
  });

  assert.equal(item.needsReview, true);
  assert.match(item.reviewReason, /Quantity needs review/);
  assert.match(item.reviewReason, /Unit needs review/);
  assert.match(item.reviewReason, /below 75%/);
});

test('normalizes out-of-range confidence and unknown categories conservatively', () => {
  const item = normalizeItem({
    name: 'Rice',
    quantity: 3,
    unit: 'bags',
    category: 'Unlisted category',
    confidence: 1.5,
  });

  assert.equal(item.category, 'Other');
  assert.equal(item.confidence, 1);
  assert.equal(item.needsReview, true);
  assert.match(item.reviewReason, /Category needs review/);
  assert.equal(normalizeItem({
    name: 'Pancit Canton',
    quantity: 1,
    unit: 'pcs',
    category: 'Instant Noodles',
    confidence: 0.9,
  }).category, 'Instant Noodles');
});

test('rejects invalid structured model responses', () => {
  assert.throws(
    () => parseGeminiResponse('not json'),
    (error) => error.code === 'INVALID_GEMINI_RESPONSE',
  );
  assert.throws(
    () => parseGeminiResponse('{"products": []}'),
    (error) => error.code === 'INVALID_GEMINI_RESPONSE',
  );
});

test('sends the image to the model and returns reviewable candidates', async () => {
  let request;
  const client = {
    models: {
      async generateContent(value) {
      request = value;
        return {
          text: JSON.stringify({
            items: [{
              name: 'Canned tomatoes',
              quantity: 12,
              unit: 'cans',
              category: 'Food',
              confidence: 0.94,
              needsReview: false,
              reviewReason: '',
            }],
          }),
        };
      },
    },
  };

  const result = await extractInventoryFromImage({
    imageBuffer: Buffer.from('sample-image'),
    mimeType: 'image/png',
    client,
    modelName: 'gemini-3.8-flash',
  });

  assert.equal(request.model, 'gemini-3.8-flash');
  assert.equal(request.contents[0].parts[1].inlineData.mimeType, 'image/png');
  assert.equal(
    request.contents[0].parts[1].inlineData.data,
    Buffer.from('sample-image').toString('base64'),
  );
  assert.equal(request.config.responseMimeType, 'application/json');
  assert.equal(request.config.temperature, 0);
  assert.ok(request.config.responseSchema.properties.items);
  assert.equal(result.items[0].name, 'Canned tomatoes');
  assert.equal(result.requiresReview, true);
  assert.ok(result.categories.includes('Food'));
});

test('maps unreadable Gemini candidate text to a safe upstream error', async () => {
  const client = {
    models: {
      async generateContent() {
        return { text: null };
      },
    },
  };

  await assert.rejects(
    extractInventoryFromImage({
      imageBuffer: Buffer.from('sample-image'),
      mimeType: 'image/png',
      client,
      modelName: 'gemini-3.8-flash',
    }),
    (error) => error.statusCode === 502 && error.code === 'INVALID_GEMINI_RESPONSE',
  );
});

test('preserves transient Gemini availability errors for callers', async () => {
  const client = {
    models: {
      async generateContent() {
        const error = new Error('provider detail');
        error.status = 503;
        throw error;
      },
    },
  };

  await assert.rejects(
    extractInventoryFromImage({
      imageBuffer: Buffer.from('sample-image'),
      mimeType: 'image/png',
      client,
      modelName: 'gemini-3.8-flash',
    }),
    (error) => error.statusCode === 503 && error.code === 'GEMINI_TEMPORARILY_UNAVAILABLE',
  );
});

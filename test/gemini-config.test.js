const test = require('node:test');
const assert = require('node:assert/strict');
const { getGeminiClient } = require('../backend/config/gemini');

test('defaults to the tested Gemini Flash-Lite model', () => {
  const originalApiKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.GEMINI_MODEL;

  process.env.GEMINI_API_KEY = 'test-api-key';
  delete process.env.GEMINI_MODEL;

  try {
    assert.equal(getGeminiClient().name, 'gemini-3.1-flash-lite');
  } finally {
    if (originalApiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalApiKey;
    }

    if (originalModel === undefined) {
      delete process.env.GEMINI_MODEL;
    } else {
      process.env.GEMINI_MODEL = originalModel;
    }
  }
});

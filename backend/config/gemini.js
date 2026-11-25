const { GoogleGenAI } = require('@google/genai');

const DEFAULT_MODEL = 'gemini-3.1-flash-lite';

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your-gemini-api-key') {
    const error = new Error('Gemini is not configured. Set GEMINI_API_KEY in the backend environment.');
    error.statusCode = 503;
    error.code = 'GEMINI_NOT_CONFIGURED';
    throw error;
  }

  const modelName = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const client = new GoogleGenAI({ apiKey });

  return { client, name: modelName };
}

module.exports = { getGeminiClient };
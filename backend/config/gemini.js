const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;

let genAI = null;
let geminiModel = null;

if (apiKey && !apiKey.includes('your-gemini')) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-1.5-flash for fast and accurate multimodal extraction
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('[Gemini] Initialized Google Gemini client.');
  } catch (err) {
    console.warn('[Gemini] Failed to initialize Gemini client:', err.message);
  }
} else {
  console.log('[Gemini] GEMINI_API_KEY not configured in .env. Mock OCR mode active.');
}

module.exports = {
  genAI,
  geminiModel,
};

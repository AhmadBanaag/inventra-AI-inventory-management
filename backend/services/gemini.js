const fs = require('fs');
const { getGeminiClient } = require('../config/gemini');
const { extractInventoryFromImage } = require('./geminiService');

/**
 * Processes an uploaded inventory count sheet with Google Gemini
 * Returns structured line items with handwriting recognition
 */
async function extractHandwrittenInventory(filePath, mimeType = 'image/jpeg') {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error('Count sheet image file is missing or unreadable.');
  }

  try {
    const { client, name } = getGeminiClient();
    const { items } = await extractInventoryFromImage({
      imageBuffer: fs.readFileSync(filePath),
      mimeType,
      client,
      modelName: name,
    });

    return items.map((item) => ({
      ...item,
      unit_price: null,
      confidence: item.confidence >= 0.9
        ? 'high'
        : item.confidence >= 0.75
          ? 'medium'
          : 'low',
    }));
  } catch (err) {
    console.error('[Gemini OCR Error]:', err.message);
    throw err;
  }
}

module.exports = {
  extractHandwrittenInventory,
};

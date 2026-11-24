const fs = require('fs');
const { geminiModel } = require('../config/gemini');

/**
 * Converts a local file into a Gemini inlineData part
 */
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString('base64'),
      mimeType,
    },
  };
}

/**
 * Processes an uploaded inventory count sheet with Google Gemini
 * Returns structured line items with handwriting recognition
 */
async function extractHandwrittenInventory(filePath, mimeType = 'image/jpeg') {
  if (!geminiModel) {
    throw new Error('Gemini API is not configured. Please set GEMINI_API_KEY in your .env file to enable AI handwriting recognition.');
  }

  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error('Count sheet image file is missing or unreadable.');
  }

  const prompt = `
You are an expert handwriting recognition and optical character recognition (OCR) assistant for small business inventory sheets.
Analyze this handwritten inventory count sheet.

The sheet has rows containing:
1. Item Name / Description
2. Category
3. Quantity (must be a non-negative integer)
4. Unit Price (optional decimal number, defaults to 0.00 if omitted)

Return ONLY valid JSON matching this exact structure:
{
  "items": [
    {
      "name": "Item Description",
      "category": "Category Name",
      "quantity": 10,
      "unit_price": 5.00,
      "confidence": "high" | "medium" | "low"
    }
  ]
}

Rules:
- Transcribe handwritten product descriptions carefully.
- If quantity is uncertain, mark confidence as "medium" or "low".
- Omit blank rows.
- Do not wrap in markdown quotes. Return strictly valid JSON.
`;

  try {
    const imagePart = fileToGenerativePart(filePath, mimeType);
    const result = await geminiModel.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Clean JSON response
    const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedJson);
    return parsed.items || [];
  } catch (err) {
    console.error('[Gemini OCR Error]:', err.message);
    throw new Error(`Failed to process sheet with Gemini: ${err.message}`);
  }
}

module.exports = {
  extractHandwrittenInventory,
};

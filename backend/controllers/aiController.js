const { getGeminiClient } = require('../config/gemini');
const { extractInventoryFromImage } = require('../services/geminiService');
const { detectImageMimeType } = require('../utils/image');
const productService = require('../services/productService');

async function extractInventory(req, res, next) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { code: 'IMAGE_REQUIRED', message: 'Choose an image to process.' },
    });
  }

  if (req.file.buffer.length === 0) {
    return res.status(415).json({
      success: false,
      error: {
        code: 'EMPTY_IMAGE',
        message: 'The uploaded image is empty.',
      },
    });
  }

  const actualMimeType = detectImageMimeType(req.file.buffer);
  if (!actualMimeType || actualMimeType !== req.file.mimetype) {
    return res.status(415).json({
      success: false,
      error: {
        code: 'INVALID_IMAGE_CONTENT',
        message: 'The file contents do not match a supported JPEG, PNG, or WebP image.',
      },
    });
  }

  try {
    const { client, name } = getGeminiClient();
    const result = await extractInventoryFromImage({
      imageBuffer: req.file.buffer,
      mimeType: req.file.mimetype,
      client,
      modelName: name,
    });

    res.json({
      success: true,
      data: { ...result, model: name },
    });
  } catch (error) {
    next(error);
  }
}

async function saveVerifiedInventory(req, res, next) {
  try {
    const summary = await productService.batchUpsertVerifiedProducts(req.body.items);
    res.json({
      success: true,
      data: {
        message: `${req.body.items.length} verified items saved to inventory.`,
        summary,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { extractInventory, saveVerifiedInventory };

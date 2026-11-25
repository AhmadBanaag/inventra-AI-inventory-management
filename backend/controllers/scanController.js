/**
 * Scan & Verification Controller (scanController.js)
 * Handles count sheet uploads, OCR processing, and verified database batch commits
 */

const scanService = require('../services/scanService');
const productService = require('../services/productService');
const { error } = require('../utils/apiResponse');

async function uploadSheet(req, res, next) {
  try {
    if (!req.file) {
      return error(res, 'No image file uploaded. Please provide a JPG, PNG, or WEBP image.', 400);
    }

    const scanRecord = await scanService.createScan(req.file);
    res.status(201).json({
      scanId: scanRecord.id,
      message: 'Sheet uploaded successfully.',
    });
  } catch (err) {
    next(err);
  }
}

async function getScan(req, res, next) {
  try {
    const scan = await scanService.getScanById(req.params.id);
    res.json(scan);
  } catch (err) {
    next(err);
  }
}

async function processAI(req, res, next) {
  try {
    const result = await scanService.processScanWithAI(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function verifyScan(req, res, next) {
  try {
    const { id } = req.params;
    const { items } = req.body;
    const mode = req.query.mode || 'additive';

    // 1. Batch upsert verified products into inventory database
    const importSummary = await productService.batchUpsertVerifiedProducts(items, mode);

    // 2. Complete scan verification audit status
    await scanService.completeVerification(id, items);

    res.json({
      message: `${items.length} items verified and committed to inventory.`,
      summary: importSummary,
    });
  } catch (err) {
    next(err);
  }
}

async function listScans(req, res, next) {
  try {
    const scans = await scanService.getAllScans();
    res.json(scans);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  uploadSheet,
  getScan,
  processAI,
  verifyScan,
  listScans,
};

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { extractHandwrittenInventory } = require('../services/gemini');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `sheet-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// In-memory scans store for local demo
let memoryScans = [
  {
    id: 'scan-001',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    total_items_detected: 14,
    total_items_saved: 14,
    status: 'completed',
    items: [
      { id: 1, name: 'Hex Bolt M8x40', category: 'Fasteners', quantity: 50, unit_price: 0.45, confidence: 'high' },
      { id: 2, name: 'Stainless Washer 8mm', category: 'Fasteners', quantity: 200, unit_price: 0.15, confidence: 'high' },
    ],
  },
];

// POST /api/scan/upload - Accepts photo upload
router.post('/upload', upload.single('sheetImage'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded.' });
  }

  const scanId = `scan-${Date.now()}`;
  const scanRecord = {
    id: scanId,
    filePath: req.file.path,
    filename: req.file.filename,
    mimeType: req.file.mimetype,
    status: 'processing',
    items: [],
    created_at: new Date().toISOString(),
  };

  memoryScans.unshift(scanRecord);
  res.status(201).json({ scanId, message: 'Upload received successfully.' });
});

// GET /api/scan/:id - Retrieve scan details
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const scan = memoryScans.find(s => s.id === id);
  if (!scan) {
    // Return sample items if ID not found
    return res.json({
      id,
      items: [
        { id: 1, name: 'Hex Bolt M8x40', category: 'Fasteners', quantity: 50, unit_price: 0.45, confidence: 'high' },
        { id: 2, name: 'Stainless Washer 8mm', category: 'Fasteners', quantity: 200, unit_price: 0.15, confidence: 'high' },
        { id: 3, name: 'Nylon Lock Nut M8', category: 'Fasteners', quantity: 75, unit_price: 0.30, confidence: 'medium' },
        { id: 4, name: 'Threadlocker Blue 50ml', category: 'Adhesives', quantity: 6, unit_price: 8.50, confidence: 'high' },
        { id: 5, name: 'Safety Goggles Clear', category: 'PPE', quantity: 12, unit_price: 4.25, confidence: 'low' },
      ],
    });
  }
  res.json(scan);
});

// POST /api/scan/:id/process - Trigger Gemini OCR
router.post('/:id/process', async (req, res) => {
  const { id } = req.params;
  const scan = memoryScans.find(s => s.id === id);

  try {
    let items = [];
    if (scan && scan.filePath) {
      items = await extractHandwrittenInventory(scan.filePath, scan.mimeType);
    } else {
      items = await extractHandwrittenInventory(null);
    }

    if (scan) {
      scan.items = items;
      scan.total_items_detected = items.length;
      scan.status = 'pending_verification';
    }

    res.json({ scanId: id, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/scan/:id/verify - User commits verified items to inventory
router.post('/:id/verify', async (req, res) => {
  const { id } = req.params;
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No items provided for verification.' });
  }

  // Update scan audit status
  const scan = memoryScans.find(s => s.id === id);
  if (scan) {
    scan.total_items_saved = items.length;
    scan.status = 'completed';
    scan.items = items;
  }

  res.json({
    message: `${items.length} items verified and committed to inventory.`,
    savedCount: items.length,
  });
});

module.exports = {
  scanRouter: router,
  memoryScans,
};

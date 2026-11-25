const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const scanController = require('../controllers/scanController');
const { validateVerifiedScan } = require('../middleware/validator');

const supportedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

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
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (supportedImageTypes.has(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error('Upload a JPEG, PNG, or WebP image.');
      error.statusCode = 415;
      error.code = 'UNSUPPORTED_IMAGE_TYPE';
      cb(error, false);
    }
  },
});

// POST /api/scan/upload - Accepts photo upload
router.post('/upload', upload.single('sheetImage'), scanController.uploadSheet);

// GET /api/scan/:id - Retrieve scan details & extracted items
router.get('/:id', scanController.getScan);

// POST /api/scan/:id/process - Trigger Gemini Multimodal OCR
router.post('/:id/process', scanController.processAI);

// POST /api/scan/:id/verify - User commits verified items to inventory (strictly validated)
router.post('/:id/verify', validateVerifiedScan, scanController.verifyScan);

// GET /api/scan (or mount as /api/scans) - Audit log
router.get('/', scanController.listScans);

module.exports = router;

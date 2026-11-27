const express = require('express');
const multer = require('multer');
const { extractInventory, saveVerifiedInventory } = require('../controllers/aiController');
const { validateVerifiedScan } = require('../middleware/validator');

const router = express.Router();
const supportedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter(req, file, callback) {
    if (!supportedImageTypes.has(file.mimetype)) {
      const error = new Error('Upload a JPEG, PNG, or WebP image.');
      error.statusCode = 415;
      error.code = 'UNSUPPORTED_IMAGE_TYPE';
      return callback(error);
    }

    callback(null, true);
  },
});

router.post('/extract', upload.single('image'), extractInventory);
router.post('/verify', (req, res, next) => {
  validateVerifiedScan(req, res, next, { requireUnitPrice: true });
}, saveVerifiedInventory);

module.exports = router;

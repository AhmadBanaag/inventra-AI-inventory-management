const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// GET /api/dashboard/stats - Real-time inventory and OCR performance KPIs
router.get('/stats', dashboardController.getStats);

module.exports = router;

const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const productsRouter = require('./routes/products');
const dashboardRouter = require('./routes/dashboard');
const { scanRouter, memoryScans } = require('./routes/scan');
const supabase = require('./config/supabase');
const { geminiModel } = require('./config/gemini');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health & Diagnostic API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: supabase ? 'Connected (Supabase)' : 'In-Memory (Local Dev Mode)',
    gemini: geminiModel ? 'Configured (Live API)' : 'Mock OCR (Development Mode)',
  });
});

// Mount Application REST APIs
app.use('/api/products', productsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/scan', scanRouter);

// Scan History endpoint
app.get('/api/scans', (req, res) => {
  res.json(memoryScans);
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err.stack);
  res.status(500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Fallback for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start Express Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  Inventra Application Server running`);
    console.log(`  URL: http://localhost:${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`====================================================`);
  });
}

module.exports = app;

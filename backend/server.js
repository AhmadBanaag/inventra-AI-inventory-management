const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const productsRouter = require('./routes/products');
const dashboardRouter = require('./routes/dashboard');
const scanRouter = require('./routes/scan');
const errorHandler = require('./middleware/errorHandler');
const supabase = require('./config/supabase');
const { geminiModel } = require('./config/gemini');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Parsing Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Static Assets
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// System Health & Diagnostics Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: supabase ? 'Connected (Supabase PostgreSQL)' : 'In-Memory (Local Development Mode)',
    gemini: geminiModel ? 'Configured (Live Gemini API)' : 'Mock OCR (Development Mode)',
    environment: process.env.NODE_ENV || 'development',
  });
});

// REST API Routers
app.use('/api/products', productsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/scan', scanRouter);
app.use('/api/scans', scanRouter); // Alias for historical scan audit

// Fallback for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Centralized Error Handling Middleware (must be registered last)
app.use(errorHandler);

// Start Express Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  Inventra Backend Server running`);
    console.log(`  URL: http://localhost:${PORT}`);
    console.log(`  Supabase: ${supabase ? 'Active' : 'Offline (In-memory fallback)'}`);
    console.log(`  Gemini:   ${geminiModel ? 'Active' : 'Mock mode'}`);
    console.log(`====================================================`);
  });
}

module.exports = app;

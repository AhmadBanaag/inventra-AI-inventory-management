require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const productsRouter = require('./routes/products');
const dashboardRouter = require('./routes/dashboard');
const scanRouter = require('./routes/scan');
const aiRoutes = require('./routes/ai');
const supabase = require('./config/supabase');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const port = Number(process.env.PORT) || 3000;
const frontendPath = path.join(__dirname, '..', 'frontend');

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.get('/', (req, res) => {
  res.redirect('/pages/scan-inventory.html');
});
app.use(express.static(frontendPath));
app.get('/api/health', (req, res) => {
  const geminiConfigured = Boolean(
    process.env.GEMINI_API_KEY
      && process.env.GEMINI_API_KEY !== 'your-gemini-api-key',
  );
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: supabase ? 'Connected (Supabase PostgreSQL)' : 'In-memory development mode',
    gemini: geminiConfigured ? 'Configured (Live Gemini API)' : 'Not configured',
    environment: process.env.NODE_ENV || 'development',
  });
});
app.use('/api/products', productsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/scan', scanRouter);
app.use('/api/scans', scanRouter);
app.use('/api/ai', aiRoutes);
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE') {
    err.message = 'The image must be 8 MB or smaller.';
    err.statusCode = 413;
  } else if (err.name === 'MulterError' && !err.statusCode) {
    err.statusCode = 400;
  }

  if (err.statusCode || err.code) {
    if (err.statusCode >= 500) console.error(err);
    return res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'REQUEST_FAILED', message: err.message },
    });
  }

  return errorHandler(err, req, res, next);
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Inventra server listening on port ${port}`);
  });
}

module.exports = app;

require('dotenv').config();

const path = require('path');
const express = require('express');
const aiRoutes = require('./routes/ai');

const app = express();
const port = Number(process.env.PORT) || 3000;
const frontendPath = path.join(__dirname, '..', 'frontend');

app.use(express.json({ limit: '1mb' }));
app.get('/', (req, res) => {
  res.redirect('/pages/scan-inventory.html');
});
app.use(express.static(frontendPath));
app.use('/api/ai', aiRoutes);

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || (error.name === 'MulterError' ? 400 : 500);
  let message = error.message || 'An unexpected server error occurred.';

  if (error.name === 'MulterError' && error.code === 'LIMIT_FILE_SIZE') {
    message = 'The image must be 8 MB or smaller.';
  } else if (error.name === 'MulterError') {
    message = 'The image upload could not be processed.';
  } else if (statusCode >= 500 && !error.statusCode) {
    message = 'An unexpected server error occurred.';
  }

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    error: { code: error.code || 'REQUEST_FAILED', message },
  });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Inventra server listening on port ${port}`);
  });
}

module.exports = app;
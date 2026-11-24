/**
 * Centralized Error Handling Middleware (errorHandler.js)
 * Catches unhandled exceptions and formats consistent JSON error responses
 */

const { error } = require('../utils/apiResponse');

function errorHandler(err, req, res, next) {
  console.error(`[Server Error] ${req.method} ${req.url}:`, err.message);

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return error(res, 'Uploaded image exceeds the 10MB size limit.', 400);
    }
    return error(res, `File upload error: ${err.message}`, 400);
  }

  // Handle SyntaxError (malformed JSON in request body)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return error(res, 'Malformed JSON payload in request body.', 400);
  }

  // Custom application errors with status code
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  const details = process.env.NODE_ENV === 'development' ? err.stack : null;

  return error(res, message, statusCode, details);
}

module.exports = errorHandler;

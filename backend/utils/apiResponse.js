/**
 * Standardized API Response Utilities (apiResponse.js)
 * Enforces a consistent response envelope across all endpoints
 */

function success(res, data, statusCode = 200, meta = null) {
  const response = {
    success: true,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
}

function error(res, message, statusCode = 500, details = null) {
  const response = {
    success: false,
    error: {
      message: message || 'An unexpected error occurred.',
    },
  };

  if (details) {
    response.error.details = details;
  }

  return res.status(statusCode).json(response);
}

module.exports = {
  success,
  error,
};

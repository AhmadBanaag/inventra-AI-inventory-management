/**
 * Input Validation & Sanitization Middleware (validator.js)
 * Strictly verifies incoming data types, boundaries, and formats
 */

const { error } = require('../utils/apiResponse');

/**
 * Validates product creation request
 */
function validateProductCreate(req, res, next) {
  const { name, sku, category, quantity, unit_price, low_stock_threshold } = req.body;
  const errors = [];

  // Name validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Product name is required.' });
  } else if (name.trim().length < 2 || name.trim().length > 255) {
    errors.push({ field: 'name', message: 'Product name must be between 2 and 255 characters.' });
  }

  // Quantity validation
  if (quantity !== undefined && quantity !== null && quantity !== '') {
    const qtyNum = Number(quantity);
    if (!Number.isInteger(qtyNum) || qtyNum < 0) {
      errors.push({ field: 'quantity', message: 'Quantity must be a non-negative integer.' });
    }
  }

  // Unit Price validation
  if (unit_price !== undefined && unit_price !== null && unit_price !== '') {
    const priceNum = Number(unit_price);
    if (isNaN(priceNum) || priceNum < 0) {
      errors.push({ field: 'unit_price', message: 'Unit price must be a non-negative number.' });
    }
  }

  // Threshold validation
  if (low_stock_threshold !== undefined && low_stock_threshold !== null && low_stock_threshold !== '') {
    const threshNum = Number(low_stock_threshold);
    if (!Number.isInteger(threshNum) || threshNum < 0) {
      errors.push({ field: 'low_stock_threshold', message: 'Low stock threshold must be a non-negative integer.' });
    }
  }

  // SKU validation (if provided)
  if (sku && typeof sku === 'string' && sku.trim().length > 0) {
    if (sku.trim().length > 100) {
      errors.push({ field: 'sku', message: 'SKU cannot exceed 100 characters.' });
    }
  }

  if (errors.length > 0) {
    return error(res, 'Validation failed for product submission.', 400, errors);
  }

  // Sanitize trimmed strings
  req.body.name = name.trim();
  if (req.body.sku) req.body.sku = req.body.sku.trim();
  if (req.body.category) req.body.category = req.body.category.trim();
  if (req.body.description) req.body.description = req.body.description.trim();

  next();
}

/**
 * Validates product update request
 */
function validateProductUpdate(req, res, next) {
  const { name, quantity, unit_price, low_stock_threshold } = req.body;
  const errors = [];

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Product name cannot be empty.' });
    } else if (name.trim().length < 2 || name.trim().length > 255) {
      errors.push({ field: 'name', message: 'Product name must be between 2 and 255 characters.' });
    }
  }

  if (quantity !== undefined) {
    const qtyNum = Number(quantity);
    if (!Number.isInteger(qtyNum) || qtyNum < 0) {
      errors.push({ field: 'quantity', message: 'Quantity must be a non-negative integer.' });
    }
  }

  if (unit_price !== undefined) {
    const priceNum = Number(unit_price);
    if (isNaN(priceNum) || priceNum < 0) {
      errors.push({ field: 'unit_price', message: 'Unit price must be a non-negative number.' });
    }
  }

  if (low_stock_threshold !== undefined) {
    const threshNum = Number(low_stock_threshold);
    if (!Number.isInteger(threshNum) || threshNum < 0) {
      errors.push({ field: 'low_stock_threshold', message: 'Low stock threshold must be a non-negative integer.' });
    }
  }

  if (errors.length > 0) {
    return error(res, 'Validation failed for product update.', 400, errors);
  }

  next();
}

/**
 * Validates batch items submitted for scan verification
 */
function validateVerifiedScan(req, res, next, { requireUnitPrice = false } = {}) {
  const { items } = req.body || {};

  if (!items || !Array.isArray(items) || items.length === 0) {
    return error(res, 'Verification payload must be a non-empty array of items.', 400);
  }

  const errors = [];

  items.forEach((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push({ index, field: 'item', message: 'Each item must be an object.' });
      return;
    }

    if (!item.name || typeof item.name !== 'string' || item.name.trim().length === 0) {
      errors.push({ index, field: 'name', message: 'Item name is required.' });
    }

    const qty = Number(item.quantity);
    if (isNaN(qty) || !Number.isInteger(qty) || qty < 0) {
      errors.push({ index, field: 'quantity', message: 'Quantity must be a non-negative integer.' });
    }

    if (requireUnitPrice && (item.unit_price === undefined || item.unit_price === null || item.unit_price === '')) {
      errors.push({ index, field: 'unit_price', message: 'Unit price is required.' });
    } else if (item.unit_price !== undefined && item.unit_price !== null && item.unit_price !== '') {
      const price = Number(item.unit_price);
      if (!Number.isFinite(price) || price < 0) {
        errors.push({ index, field: 'unit_price', message: 'Unit price must be a non-negative number.' });
      }
    }
  });

  if (errors.length > 0) {
    return error(res, 'Invalid items detected in verification batch.', 422, errors);
  }

  next();
}

module.exports = {
  validateProductCreate,
  validateProductUpdate,
  validateVerifiedScan,
};

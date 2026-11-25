/**
 * Product Controller (productController.js)
 * Handles incoming HTTP requests for catalog management
 */

const productService = require('../services/productService');

async function list(req, res, next) {
  try {
    const products = await productService.getAllProducts(req.query);
    res.json(products);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const product = await productService.getProductById(req.params.id);
    res.json(product);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const created = await productService.createProduct(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const updated = await productService.updateProduct(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await productService.deleteProduct(req.params.id);
    res.json({ message: 'Product deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
};

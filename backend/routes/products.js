const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { validateProductCreate, validateProductUpdate } = require('../middleware/validator');

// GET /api/products - List all products with optional filters (?search=&category=&status=)
router.get('/', productController.list);

// GET /api/products/:id - Single product details
router.get('/:id', productController.getOne);

// POST /api/products - Create a new product (strictly validated)
router.post('/', validateProductCreate, productController.create);

// PUT /api/products/:id - Update product details (strictly validated)
router.put('/:id', validateProductUpdate, productController.update);

// DELETE /api/products/:id - Delete product
router.delete('/:id', productController.remove);

module.exports = router;

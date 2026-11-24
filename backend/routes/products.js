const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// In-memory catalog store for development when Supabase is not yet connected
let memoryProducts = [
  { id: '1', name: 'Hex Head Bolt M8x40', sku: 'BLT-001', category: 'Fasteners', quantity: 120, unit_price: 0.45, low_stock_threshold: 30, description: 'Grade 8.8 zinc-plated bolt', created_at: new Date().toISOString() },
  { id: '2', name: 'Stainless Washer 8mm', sku: 'WSH-002', category: 'Fasteners', quantity: 14, unit_price: 0.15, low_stock_threshold: 25, description: '316 Marine Grade Stainless Steel', created_at: new Date().toISOString() },
  { id: '3', name: 'Silicone Sealant Clear 300ml', sku: 'ADH-003', category: 'Adhesives', quantity: 4, unit_price: 6.50, low_stock_threshold: 10, description: 'Waterproof neutral cure silicone', created_at: new Date().toISOString() },
  { id: '4', name: 'Heavy Duty Masking Tape 50mm', sku: 'TAP-004', category: 'Consumables', quantity: 0, unit_price: 3.20, low_stock_threshold: 5, description: 'High adhesion crepe paper tape', created_at: new Date().toISOString() },
  { id: '5', name: 'Drill Bit Set 13-Piece HSS', sku: 'TLS-005', category: 'Tools', quantity: 18, unit_price: 15.00, low_stock_threshold: 5, description: 'Titanium coated drill bits', created_at: new Date().toISOString() },
];

// GET /api/products - List all products
router.get('/', async (req, res) => {
  if (supabase) {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }
  res.json(memoryProducts);
});

// GET /api/products/:id - Single product
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (supabase) {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (error) return res.status(404).json({ error: 'Product not found' });
    return res.json(data);
  }
  const item = memoryProducts.find(p => p.id === id);
  if (!item) return res.status(404).json({ error: 'Product not found' });
  res.json(item);
});

// POST /api/products - Create new product
router.post('/', async (req, res) => {
  const { name, sku, category, quantity, unit_price, low_stock_threshold, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Product name is required.' });
  }

  const newProduct = {
    id: String(Date.now()),
    name: name.trim(),
    sku: (sku && sku.trim()) || `INV-${Math.floor(100 + Math.random() * 900)}`,
    category: (category && category.trim()) || 'General',
    quantity: Number(quantity) || 0,
    unit_price: Number(unit_price) || 0.00,
    low_stock_threshold: Number(low_stock_threshold) || 5,
    description: description ? description.trim() : '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (supabase) {
    const { data, error } = await supabase.from('products').insert([newProduct]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  memoryProducts.unshift(newProduct);
  res.status(201).json(newProduct);
});

// PUT /api/products/:id - Update product
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (supabase) {
    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  const index = memoryProducts.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: 'Product not found' });

  memoryProducts[index] = { ...memoryProducts[index], ...updates, updated_at: new Date().toISOString() };
  res.json(memoryProducts[index]);
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (supabase) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ message: 'Product deleted' });
  }

  memoryProducts = memoryProducts.filter(p => p.id !== id);
  res.json({ message: 'Product deleted' });
});

module.exports = router;

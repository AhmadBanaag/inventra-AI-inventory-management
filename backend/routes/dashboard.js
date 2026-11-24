const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    let products = [];
    let totalScans = 3;

    if (supabase) {
      const { data, error } = await supabase.from('products').select('*');
      if (!error && data) products = data;
      const { count } = await supabase.from('scans').select('*', { count: 'exact', head: true });
      if (count !== null) totalScans = count;
    } else {
      // Access products from router or fallback
      const productsRouter = require('./products');
      // Fallback demo statistics
      products = [
        { id: '1', name: 'Hex Head Bolt M8x40', sku: 'BLT-001', category: 'Fasteners', quantity: 120, unit_price: 0.45, low_stock_threshold: 30 },
        { id: '2', name: 'Stainless Washer 8mm', sku: 'WSH-002', category: 'Fasteners', quantity: 14, unit_price: 0.15, low_stock_threshold: 25 },
        { id: '3', name: 'Silicone Sealant Clear 300ml', sku: 'ADH-003', category: 'Adhesives', quantity: 4, unit_price: 6.50, low_stock_threshold: 10 },
        { id: '4', name: 'Heavy Duty Masking Tape 50mm', sku: 'TAP-004', category: 'Consumables', quantity: 0, unit_price: 3.20, low_stock_threshold: 5 },
        { id: '5', name: 'Drill Bit Set 13-Piece HSS', sku: 'TLS-005', category: 'Tools', quantity: 18, unit_price: 15.00, low_stock_threshold: 5 },
      ];
    }

    const totalProducts = products.length;
    const lowStockCount = products.filter(p => (p.quantity || 0) <= (p.low_stock_threshold || 5)).length;
    const totalValue = products.reduce((sum, p) => sum + ((Number(p.quantity) || 0) * (Number(p.unit_price) || 0)), 0);
    const categoryCount = new Set(products.map(p => p.category || 'General')).size;
    const recentProducts = products.slice(0, 5);

    res.json({
      totalProducts,
      lowStockCount,
      totalValue,
      totalScans,
      categoryCount,
      recentProducts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

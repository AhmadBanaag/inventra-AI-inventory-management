/**
 * Dashboard Business Service (dashboardService.js)
 * Computes aggregate statistics, low-stock warnings, and recent activity
 */

const { getAllProducts } = require('./productService');
const { getAllScans } = require('./scanService');

async function getDashboardStats() {
  const [products, scans] = await Promise.all([
    getAllProducts(),
    getAllScans(),
  ]);

  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => (Number(p.quantity) || 0) <= (Number(p.low_stock_threshold) || 5));
  const lowStockCount = lowStockProducts.length;

  const totalValue = products.reduce((sum, p) => {
    const qty = Number(p.quantity) || 0;
    const price = Number(p.unit_price) || 0;
    return sum + (qty * price);
  }, 0);

  const categories = new Set(products.map(p => p.category || 'General'));
  const categoryCount = categories.size;

  const totalScans = scans.length;
  const recentProducts = products.slice(0, 5);

  return {
    totalProducts,
    lowStockCount,
    totalValue,
    totalScans,
    categoryCount,
    recentProducts,
  };
}

module.exports = {
  getDashboardStats,
};

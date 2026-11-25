/**
 * Dashboard Controller (dashboardController.js)
 * Serves aggregated metrics and low stock alerts
 */

const dashboardService = require('../services/dashboardService');

async function getStats(req, res, next) {
  try {
    const stats = await dashboardService.getDashboardStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStats,
};

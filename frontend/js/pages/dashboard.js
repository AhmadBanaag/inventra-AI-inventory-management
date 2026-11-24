/**
 * INVENTRA DASHBOARD CONTROLLER (dashboard.js)
 */

document.addEventListener('DOMContentLoaded', async () => {
  renderSidebar('dashboard');
  renderNavbar('Dashboard');

  await loadDashboardData();
});

async function loadDashboardData() {
  const kpiProducts = document.getElementById('kpi-total-products');
  const kpiLowStock = document.getElementById('kpi-low-stock');
  const kpiTotalValue = document.getElementById('kpi-total-value');
  const kpiTotalScans = document.getElementById('kpi-total-scans');
  const kpiCategoriesBadge = document.getElementById('kpi-categories-badge');
  const lowStockAlert = document.getElementById('low-stock-alert');
  const lowStockMsg = document.getElementById('low-stock-message');

  const recentState = document.getElementById('recent-products-state');
  const recentContainer = document.getElementById('recent-products-container');
  const recentTbody = document.getElementById('recent-products-tbody');

  try {
    const stats = await api.get('/dashboard/stats');

    // Populate KPIs
    if (kpiProducts) kpiProducts.textContent = stats.totalProducts || 0;
    if (kpiLowStock) kpiLowStock.textContent = stats.lowStockCount || 0;
    if (kpiTotalValue) kpiTotalValue.textContent = formatCurrency(stats.totalValue || 0);
    if (kpiTotalScans) kpiTotalScans.textContent = stats.totalScans || 0;
    if (kpiCategoriesBadge) kpiCategoriesBadge.textContent = `${stats.categoryCount || 0} categories`;

    // Low stock alert visibility
    if (stats.lowStockCount > 0 && lowStockAlert && lowStockMsg) {
      lowStockAlert.style.display = 'block';
      lowStockMsg.textContent = `There are currently ${stats.lowStockCount} product(s) at or below their low stock threshold. Restock recommended.`;
    }

    // Populate Recent Products
    const recent = stats.recentProducts || [];
    if (recentState) recentState.style.display = 'none';

    if (recent.length === 0) {
      if (recentContainer) recentContainer.style.display = 'none';
      if (recentState) {
        recentState.style.display = 'flex';
        recentState.innerHTML = `
          <div class="state-title">No products yet</div>
          <div class="state-description">Add a product manually or scan a handwritten sheet to get started.</div>
        `;
      }
    } else {
      if (recentContainer) recentContainer.style.display = 'block';
      if (recentTbody) {
        recentTbody.innerHTML = recent.map(p => {
          let badgeClass = 'badge-success';
          let statusText = 'In Stock';
          if (p.quantity === 0) {
            badgeClass = 'badge-danger';
            statusText = 'Out of Stock';
          } else if (p.quantity <= (p.low_stock_threshold || 5)) {
            badgeClass = 'badge-warning';
            statusText = 'Low Stock';
          }

          return `
            <tr>
              <td>
                <a href="/pages/product-details.html?id=${p.id}" class="text-bold" style="color: var(--color-text-main);">
                  ${p.name}
                </a>
                <div style="font-size: var(--font-size-xs); color: var(--color-text-subtle);">${p.sku || 'No SKU'}</div>
              </td>
              <td>${p.category || 'General'}</td>
              <td><strong>${p.quantity}</strong> units</td>
              <td><span class="badge ${badgeClass}">${statusText}</span></td>
            </tr>
          `;
        }).join('');
      }
    }
  } catch (err) {
    console.warn('Dashboard API unavailable, displaying demo fallback state:', err);
    if (kpiProducts) kpiProducts.textContent = '0';
    if (kpiLowStock) kpiLowStock.textContent = '0';
    if (kpiTotalValue) kpiTotalValue.textContent = '$0.00';
    if (kpiTotalScans) kpiTotalScans.textContent = '0';
    if (recentState) {
      recentState.style.display = 'flex';
      recentState.innerHTML = `
        <div class="state-title">No items loaded</div>
        <div class="state-description">Server connection initializing or no database entries found.</div>
      `;
    }
  }
}

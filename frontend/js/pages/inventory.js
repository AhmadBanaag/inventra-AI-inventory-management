/**
 * INVENTRA MY INVENTORY CONTROLLER (inventory.js)
 */

let allProducts = [];

document.addEventListener('DOMContentLoaded', async () => {
  renderSidebar('inventory');
  renderNavbar('My Inventory');

  // Check URL query parameters for initial filter (e.g. ?status=low_stock)
  const urlParams = new URLSearchParams(window.location.search);
  const statusParam = urlParams.get('status');
  if (statusParam) {
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) statusFilter.value = statusParam;
  }

  setupEventListeners();
  await fetchProducts();
});

function setupEventListeners() {
  const searchInput = document.getElementById('inventory-search');
  const catFilter = document.getElementById('category-filter');
  const statusFilter = document.getElementById('status-filter');

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (catFilter) catFilter.addEventListener('change', applyFilters);
  if (statusFilter) statusFilter.addEventListener('change', applyFilters);
}

async function fetchProducts() {
  const loading = document.getElementById('table-loading-state');
  const table = document.getElementById('inventory-table');
  const empty = document.getElementById('table-empty-state');

  try {
    const data = await api.get('/products');
    allProducts = data || [];

    populateCategoryOptions(allProducts);
    applyFilters();
  } catch (err) {
    console.warn('API error, falling back to local demo catalog:', err);
    // Use fallback demo catalog if server is in development mode
    allProducts = [
      { id: '1', name: 'Standard Hex Bolt M8x40', sku: 'BLT-001', category: 'Fasteners', quantity: 120, unit_price: 0.45, low_stock_threshold: 30 },
      { id: '2', name: 'Stainless Washer 8mm', sku: 'WSH-002', category: 'Fasteners', quantity: 14, unit_price: 0.15, low_stock_threshold: 25 },
      { id: '3', name: 'Silicone Sealant Clear 300ml', sku: 'ADH-003', category: 'Adhesives', quantity: 4, unit_price: 6.50, low_stock_threshold: 10 },
      { id: '4', name: 'Heavy Duty Masking Tape 50mm', sku: 'TAP-004', category: 'Consumables', quantity: 0, unit_price: 3.20, low_stock_threshold: 5 },
      { id: '5', name: 'Drill Bit Set 13-Piece HSS', sku: 'TLS-005', category: 'Tools', quantity: 18, unit_price: 15.00, low_stock_threshold: 5 },
    ];
    populateCategoryOptions(allProducts);
    applyFilters();
  } finally {
    if (loading) loading.style.display = 'none';
  }
}

function populateCategoryOptions(products) {
  const catFilter = document.getElementById('category-filter');
  if (!catFilter) return;

  const categories = [...new Set(products.map(p => p.category || 'General'))].sort();
  catFilter.innerHTML = '<option value="">All Categories</option>' + 
    categories.map(c => `<option value="${c}">${c}</option>`).join('');
}

function applyFilters() {
  const searchTerm = (document.getElementById('inventory-search')?.value || '').toLowerCase().trim();
  const selectedCategory = document.getElementById('category-filter')?.value || '';
  const selectedStatus = document.getElementById('status-filter')?.value || '';

  const filtered = allProducts.filter(p => {
    // Search match
    const matchName = (p.name || '').toLowerCase().includes(searchTerm);
    const matchSku = (p.sku || '').toLowerCase().includes(searchTerm);
    if (searchTerm && !matchName && !matchSku) return false;

    // Category match
    if (selectedCategory && (p.category || 'General') !== selectedCategory) return false;

    // Status match
    const threshold = p.low_stock_threshold || 5;
    if (selectedStatus === 'out_of_stock' && p.quantity > 0) return false;
    if (selectedStatus === 'low_stock' && (p.quantity === 0 || p.quantity > threshold)) return false;
    if (selectedStatus === 'in_stock' && p.quantity <= threshold) return false;

    return true;
  });

  renderTable(filtered);
}

function renderTable(products) {
  const table = document.getElementById('inventory-table');
  const tbody = document.getElementById('inventory-tbody');
  const empty = document.getElementById('table-empty-state');
  const countLabel = document.getElementById('product-count-label');

  if (countLabel) {
    countLabel.textContent = `Showing ${products.length} of ${allProducts.length} product(s)`;
  }

  if (products.length === 0) {
    if (table) table.style.display = 'none';
    if (empty) empty.style.display = 'flex';
    return;
  }

  if (empty) empty.style.display = 'none';
  if (table) table.style.display = 'table';

  if (tbody) {
    tbody.innerHTML = products.map(p => {
      const threshold = p.low_stock_threshold || 5;
      let badge = '<span class="badge badge-success">In Stock</span>';
      if (p.quantity === 0) {
        badge = '<span class="badge badge-danger">Out of Stock</span>';
      } else if (p.quantity <= threshold) {
        badge = '<span class="badge badge-warning">Low Stock</span>';
      }

      const totalVal = (Number(p.quantity) || 0) * (Number(p.unit_price) || 0);

      return `
        <tr>
          <td><code style="font-size: var(--font-size-xs);">${p.sku || '-'}</code></td>
          <td>
            <a href="/pages/product-details.html?id=${p.id}" class="text-bold" style="color: var(--color-text-main);">
              ${p.name}
            </a>
          </td>
          <td>${p.category || 'General'}</td>
          <td><strong>${p.quantity}</strong></td>
          <td>${formatCurrency(p.unit_price || 0)}</td>
          <td>${formatCurrency(totalVal)}</td>
          <td>${badge}</td>
          <td style="text-align: right;">
            <div class="table-actions" style="justify-content: flex-end;">
              <a href="/pages/product-details.html?id=${p.id}" class="btn btn-secondary btn-sm" title="View details">
                View
              </a>
              <a href="/pages/product-form.html?id=${p.id}" class="btn btn-secondary btn-sm" title="Edit product">
                Edit
              </a>
              <button type="button" class="btn btn-outline-danger btn-sm" onclick="confirmDelete('${p.id}', '${p.name.replace(/'/g, "\\'")}')" title="Delete product">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }
}

async function confirmDelete(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}" from inventory? This action cannot be undone.`)) {
    return;
  }

  try {
    await api.delete(`/products/${id}`);
    notify.success(`Product "${name}" deleted.`);
    allProducts = allProducts.filter(p => p.id !== id);
    applyFilters();
  } catch (err) {
    notify.error(`Failed to delete product: ${err.message}`);
  }
}

window.confirmDelete = confirmDelete;

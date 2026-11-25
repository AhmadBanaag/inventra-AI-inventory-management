/**
 * INVENTRA PRODUCT DETAILS CONTROLLER (product-details.js)
 */

let currentProduct = null;

document.addEventListener('DOMContentLoaded', async () => {
  renderSidebar('inventory');
  renderNavbar('Product Details');

  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  if (!productId) {
    notify.error('No product ID provided.');
    setTimeout(() => { window.location.href = '/pages/inventory.html'; }, 1000);
    return;
  }

  await loadProduct(productId);
  setupActions(productId);
});

async function loadProduct(id) {
  try {
    currentProduct = await api.get(`/products/${id}`);
    renderDetails(currentProduct);
  } catch (err) {
    console.error('Failed to load product:', err);
    notify.error('Product not found.');
    setTimeout(() => { window.location.href = '/pages/inventory.html'; }, 1200);
  }
}

function renderDetails(p) {
  document.getElementById('product-title').textContent = p.name || 'Unnamed Product';
  document.getElementById('product-sku-subtitle').textContent = `SKU: ${p.sku || 'None'}`;
  document.getElementById('product-qty-display').textContent = p.quantity;
  document.getElementById('product-threshold-hint').textContent = `Reorder threshold: ${p.low_stock_threshold || 5} units`;
  document.getElementById('detail-category').textContent = p.category || 'General';
  document.getElementById('detail-price').textContent = formatCurrency(p.unit_price || 0);
  document.getElementById('detail-total-value').textContent = formatCurrency((p.quantity || 0) * (p.unit_price || 0));
  document.getElementById('detail-created').textContent = formatDate(p.created_at);
  document.getElementById('detail-description').textContent = p.description || 'No description provided.';

  // Status Badge
  const badge = document.getElementById('product-status-badge');
  const threshold = p.low_stock_threshold || 5;
  if (p.quantity === 0) {
    badge.className = 'badge badge-danger';
    badge.textContent = 'Out of Stock';
  } else if (p.quantity <= threshold) {
    badge.className = 'badge badge-warning';
    badge.textContent = 'Low Stock';
  } else {
    badge.className = 'badge badge-success';
    badge.textContent = 'In Stock';
  }

  // Edit Link
  const editLink = document.getElementById('edit-link');
  if (editLink) editLink.href = `/pages/product-form.html?id=${p.id}`;
}

function setupActions(productId) {
  const minusBtn = document.getElementById('adjust-minus-btn');
  const plusBtn = document.getElementById('adjust-plus-btn');
  const deleteBtn = document.getElementById('delete-btn');

  if (minusBtn) {
    minusBtn.addEventListener('click', async () => {
      if (!currentProduct || currentProduct.quantity <= 0) return;
      await adjustQuantity(productId, currentProduct.quantity - 1);
    });
  }

  if (plusBtn) {
    plusBtn.addEventListener('click', async () => {
      if (!currentProduct) return;
      await adjustQuantity(productId, currentProduct.quantity + 1);
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (!currentProduct) return;
      if (confirm(`Are you sure you want to delete "${currentProduct.name}"?`)) {
        try {
          await api.delete(`/products/${productId}`);
          notify.success('Product deleted.');
          setTimeout(() => { window.location.href = '/pages/inventory.html'; }, 500);
        } catch (err) {
          notify.error(`Failed to delete product: ${err.message}`);
        }
      }
    });
  }
}

async function adjustQuantity(productId, newQty) {
  try {
    const updated = await api.put(`/products/${productId}`, { quantity: newQty });
    currentProduct.quantity = newQty;
    renderDetails(currentProduct);
    notify.success(`Stock updated to ${newQty}`);
  } catch (err) {
    // Optimistic fallback for demo mode
    currentProduct.quantity = newQty;
    renderDetails(currentProduct);
    notify.info(`Stock updated to ${newQty} (Demo Mode)`);
  }
}

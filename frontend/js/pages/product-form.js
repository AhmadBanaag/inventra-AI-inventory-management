/**
 * INVENTRA PRODUCT FORM CONTROLLER (product-form.js)
 * Handles both Add Product and Edit Product flows
 */

document.addEventListener('DOMContentLoaded', async () => {
  renderSidebar('inventory');

  const params = new URLSearchParams(window.location.search);
  const editId = params.get('id');

  const heading = document.getElementById('form-heading');
  const idInput = document.getElementById('product-id');
  const genSkuBtn = document.getElementById('generate-sku-btn');
  const form = document.getElementById('product-form');

  if (editId) {
    renderNavbar('Edit Product');
    if (heading) heading.textContent = 'Edit Product';
    if (idInput) idInput.value = editId;
    await populateFormData(editId);
  } else {
    renderNavbar('Add Product');
    if (heading) heading.textContent = 'Add New Product';
  }

  if (genSkuBtn) {
    genSkuBtn.addEventListener('click', () => {
      const name = document.getElementById('product-name')?.value.trim();
      const prefix = name ? name.substring(0, 3).toUpperCase() : 'INV';
      const random = Math.floor(100 + Math.random() * 900);
      const skuInput = document.getElementById('product-sku');
      if (skuInput) skuInput.value = `${prefix}-${random}`;
    });
  }

  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }
});

async function populateFormData(id) {
  try {
    const product = await api.get(`/products/${id}`);
    document.getElementById('product-name').value = product.name || '';
    document.getElementById('product-sku').value = product.sku || '';
    document.getElementById('product-category').value = product.category || '';
    document.getElementById('product-quantity').value = product.quantity ?? 0;
    document.getElementById('product-price').value = (product.unit_price ?? 0).toFixed(2);
    document.getElementById('product-threshold').value = product.low_stock_threshold ?? 5;
    document.getElementById('product-description').value = product.description || '';
  } catch (err) {
    notify.error('Unable to load product for editing.');
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('product-id')?.value;
  const name = document.getElementById('product-name')?.value.trim();
  const sku = document.getElementById('product-sku')?.value.trim();
  const category = document.getElementById('product-category')?.value.trim() || 'General';
  const quantity = Number(document.getElementById('product-quantity')?.value);
  const unitPrice = Number(document.getElementById('product-price')?.value) || 0;
  const threshold = Number(document.getElementById('product-threshold')?.value) || 5;
  const description = document.getElementById('product-description')?.value.trim();

  // Basic Validation
  let isValid = true;
  const nameInput = document.getElementById('product-name');
  const nameError = document.getElementById('name-error');
  const qtyInput = document.getElementById('product-quantity');
  const qtyError = document.getElementById('qty-error');

  if (!name) {
    nameInput.classList.add('is-invalid');
    nameError.classList.add('visible');
    isValid = false;
  } else {
    nameInput.classList.remove('is-invalid');
    nameError.classList.remove('visible');
  }

  if (isNaN(quantity) || quantity < 0) {
    qtyInput.classList.add('is-invalid');
    qtyError.classList.add('visible');
    isValid = false;
  } else {
    qtyInput.classList.remove('is-invalid');
    qtyError.classList.remove('visible');
  }

  if (!isValid) return;

  const payload = {
    name,
    sku,
    category,
    quantity,
    unit_price: unitPrice,
    low_stock_threshold: threshold,
    description,
  };

  const saveBtn = document.getElementById('save-product-btn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
  }

  try {
    if (id) {
      await api.put(`/products/${id}`, payload);
      notify.success('Product updated successfully.');
    } else {
      await api.post('/products', payload);
      notify.success('Product created successfully.');
    }

    setTimeout(() => {
      window.location.href = '/pages/inventory.html';
    }, 600);
  } catch (err) {
    notify.error(`Failed to save product: ${err.message}`);
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Product';
    }
  }
}

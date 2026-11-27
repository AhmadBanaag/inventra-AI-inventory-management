const resultsMessage = document.querySelector('#results-message');
const resultsContainer = document.querySelector('#results-container');
const modelLabel = document.querySelector('#model-label');
const addProductButton = document.querySelector('#add-product-btn');
const saveResultsButton = document.querySelector('#save-results-btn');
const saveStatus = document.querySelector('#save-status');

let scanData;
let saved = false;

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('Verification');
  renderSidebar('scan');
  addProductButton.addEventListener('click', addMissingProduct);
  saveResultsButton.addEventListener('click', saveResults);

  try {
    scanData = JSON.parse(sessionStorage.getItem('inventra-scan-results') || 'null');
  } catch (error) {
    scanData = null;
  }

  if (!scanData || !Array.isArray(scanData.items)) {
    resultsMessage.textContent = 'There are no scan results to review. Start by uploading an inventory image.';
    addProductButton.disabled = true;
  } else {
    modelLabel.textContent = `Processed with ${scanData.model || 'Gemini'}`;
    renderItems(scanData.items);
  }
});

function renderItems(items) {
  if (items.length === 0) {
    resultsMessage.textContent = 'No product rows were detected. Add missing products manually or scan a clearer image.';
    resultsContainer.hidden = true;
    saveResultsButton.disabled = true;
    return;
  }

  const table = document.createElement('table');
  table.className = 'data-table results-table';
  const header = document.createElement('thead');
  const headingRow = document.createElement('tr');

  ['Product', 'Quantity', 'Unit', 'Unit price', 'Category', 'AI estimate', 'Verification', 'Action'].forEach((label) => {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = label;
    headingRow.append(cell);
  });
  header.append(headingRow);

  const body = document.createElement('tbody');
  items.forEach((item, index) => {
    const row = document.createElement('tr');
    if (item.needsReview) row.classList.add('needs-review');

    row.append(
      createTextCell(item.name, `Product name for item ${index + 1}`, 'text', (value) => {
        item.name = value;
      }),
      createTextCell(item.quantity, `Quantity for item ${index + 1}`, 'number', (value) => {
        item.quantity = value === '' ? null : Number(value);
      }, '1'),
      createTextCell(item.unit, `Unit for item ${index + 1}`, 'text', (value) => {
        item.unit = value;
      }),
      createTextCell(item.unit_price, `Unit price for item ${index + 1}`, 'number', (value) => {
        item.unit_price = value === '' ? null : Number(value);
      }, '0.01', 'Enter price'),
      createCategoryCell(item.category, index, item),
      createConfidenceCell(item.confidence),
      createReviewCell(item),
      createRemoveCell(index),
    );
    body.append(row);
  });

  table.append(header, body);
  resultsContainer.replaceChildren(table);
  resultsContainer.hidden = false;
  resultsMessage.textContent = `${items.length} item${items.length === 1 ? '' : 's'} to review. Correct each field against your original sheet.`;
  saveResultsButton.disabled = saved;
}

function createTextCell(value, label, type = 'text', onChange, step, placeholder = '') {
  const cell = document.createElement('td');
  const input = document.createElement('input');
  input.type = type;
  input.value = value === null || value === undefined ? '' : String(value);
  input.placeholder = placeholder;
  input.setAttribute('aria-label', label);
  if (label.startsWith('Unit price')) input.classList.add('price-input');
  if (type === 'number') {
    input.min = '0';
    input.step = step || 'any';
  }
  input.addEventListener('input', () => onChange(input.value));
  cell.append(input);
  return cell;
}

function createCategoryCell(category, index, item) {
  const cell = document.createElement('td');
  const select = document.createElement('select');
  select.setAttribute('aria-label', `Category for item ${index + 1}`);
  const categories = Array.isArray(scanData.categories) ? scanData.categories : [];

  categories.forEach((optionValue) => {
    const option = document.createElement('option');
    option.value = optionValue;
    option.textContent = optionValue;
    option.selected = optionValue === category;
    select.append(option);
  });

  select.addEventListener('change', () => {
    item.category = select.value;
  });
  cell.append(select);
  return cell;
}

function createRemoveCell(index) {
  const cell = document.createElement('td');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn-outline-danger btn-sm remove-row-btn';
  button.textContent = 'Remove';
  button.setAttribute('aria-label', `Remove item ${index + 1}`);
  button.addEventListener('click', () => {
    scanData.items.splice(index, 1);
    renderItems(scanData.items);
  });
  cell.append(button);
  return cell;
}

function addMissingProduct() {
  if (!scanData || saved) return;

  scanData.items.push({
    name: '',
    quantity: null,
    unit: '',
    unit_price: null,
    category: 'Other',
    confidence: 0,
    needsReview: true,
    reviewReason: 'Manually added product — verify all fields.',
  });
  renderItems(scanData.items);
  const nameInput = resultsContainer.querySelector('tbody tr:last-child input');
  if (nameInput) nameInput.focus();
}

async function saveResults() {
  if (!scanData || saved) return;

  const invalidIndex = scanData.items.findIndex((item) => (
    typeof item.name !== 'string'
    || !item.name.trim()
    || !Number.isInteger(item.quantity)
    || item.quantity < 0
    || !Number.isFinite(item.unit_price)
    || item.unit_price < 0
  ));
  if (scanData.items.length === 0 || invalidIndex !== -1) {
    if (scanData.items.length === 0) {
      saveStatus.textContent = 'Add at least one product before saving.';
      if (window.notify) window.notify.error(saveStatus.textContent);
      return;
    }

    saveStatus.textContent = `Complete the product name, whole-number quantity, and non-negative unit price for item ${invalidIndex + 1}.`;
    if (window.notify) window.notify.error(saveStatus.textContent);
    return;
  }

  saveResultsButton.disabled = true;
  saveResultsButton.textContent = 'Saving products...';
  saveStatus.textContent = '';

  try {
    const result = await window.InventraApi.saveVerifiedInventory(scanData.items);
    saved = true;
    saveResultsButton.textContent = 'Saved to inventory';
    addProductButton.disabled = true;
    resultsContainer.querySelectorAll('input, select, button').forEach((control) => {
      control.disabled = true;
    });

    let message = result.message;
    try {
      sessionStorage.removeItem('inventra-scan-results');
    } catch (error) {
      console.error('Could not clear saved scan results from this browser session:', error);
      message += ' Do not resubmit this scan after reloading the page.';
    }

    saveStatus.textContent = message;
    if (window.notify) window.notify.success(message);
  } catch (error) {
    saveResultsButton.disabled = false;
    saveResultsButton.textContent = 'Save verified products to inventory';
    saveStatus.textContent = error.message;
    if (window.notify) window.notify.error(error.message);
  }
}

function createConfidenceCell(confidence) {
  const cell = document.createElement('td');
  const percent = Number.isFinite(confidence) ? Math.round(confidence * 100) : 0;
  cell.textContent = `${percent}%`;
  cell.className = percent < 75 ? 'confidence-low' : 'confidence-high';
  return cell;
}

function createReviewCell(item) {
  const cell = document.createElement('td');
  const status = document.createElement('span');
  status.className = item.needsReview ? 'review-badge' : 'clear-badge';
  status.textContent = item.needsReview ? 'Review carefully' : 'Verify manually';
  cell.append(status);

  if (item.reviewReason) {
    const reason = document.createElement('small');
    reason.textContent = item.reviewReason;
    cell.append(reason);
  }

  return cell;
}

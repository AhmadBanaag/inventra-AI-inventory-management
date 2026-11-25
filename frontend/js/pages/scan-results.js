const resultsMessage = document.querySelector('#results-message');
const resultsContainer = document.querySelector('#results-container');
const modelLabel = document.querySelector('#model-label');

let scanData;

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('Verification');
  renderSidebar('scan');

  try {
    scanData = JSON.parse(sessionStorage.getItem('inventra-scan-results') || 'null');
  } catch (error) {
    scanData = null;
  }

  if (!scanData || !Array.isArray(scanData.items)) {
    resultsMessage.textContent = 'There are no scan results to review. Start by uploading an inventory image.';
  } else {
    modelLabel.textContent = `Processed with ${scanData.model || 'Gemini'}`;
    renderItems(scanData.items);
  }
});

function renderItems(items) {
  if (items.length === 0) {
    resultsMessage.textContent = 'No product rows were detected. Try a clearer, well-lit image with the full sheet in frame.';
    return;
  }

  const table = document.createElement('table');
  table.className = 'data-table results-table';
  const header = document.createElement('thead');
  const headingRow = document.createElement('tr');

  ['Product', 'Quantity', 'Unit', 'Category', 'AI estimate', 'Verification'].forEach((label) => {
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
      createTextCell(item.name, `Product name for item ${index + 1}`),
      createTextCell(item.quantity === null ? '' : String(item.quantity), `Quantity for item ${index + 1}`, 'number'),
      createTextCell(item.unit, `Unit for item ${index + 1}`),
      createCategoryCell(item.category, index),
      createConfidenceCell(item.confidence),
      createReviewCell(item),
    );
    body.append(row);
  });

  table.append(header, body);
  resultsContainer.replaceChildren(table);
  resultsContainer.hidden = false;
  resultsMessage.textContent = `${items.length} item${items.length === 1 ? '' : 's'} extracted. Review and correct each field against your original sheet.`;
}

function createTextCell(value, label, type = 'text') {
  const cell = document.createElement('td');
  const input = document.createElement('input');
  input.type = type;
  input.value = value === null || value === undefined ? '' : String(value);
  input.setAttribute('aria-label', label);
  if (type === 'number') {
    input.min = '0';
    input.step = 'any';
  }
  cell.append(input);
  return cell;
}

function createCategoryCell(category, index) {
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

  cell.append(select);
  return cell;
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
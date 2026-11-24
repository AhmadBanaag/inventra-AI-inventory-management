/**
 * INVENTRA SETTINGS CONTROLLER (settings.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  renderSidebar('settings');
  renderNavbar('Settings');

  loadSettings();

  const saveBtn = document.getElementById('save-settings-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveSettings);
  }

  const testBtn = document.getElementById('test-connection-btn');
  if (testBtn) {
    testBtn.addEventListener('click', runDiagnostics);
  }
});

function loadSettings() {
  const storeNameInput = document.getElementById('store-name');
  const currencySelect = document.getElementById('currency-symbol');
  const thresholdInput = document.getElementById('default-threshold');
  const categoryInput = document.getElementById('default-category');

  // Load from localStorage or defaults
  const saved = JSON.parse(localStorage.getItem('inventra_settings') || '{}');
  if (storeNameInput) storeNameInput.value = saved.storeName || 'Inventra Demo Store';
  if (currencySelect) currencySelect.value = saved.currency || '$';
  if (thresholdInput) thresholdInput.value = saved.defaultThreshold || 5;
  if (categoryInput) categoryInput.value = saved.defaultCategory || 'General';
}

function saveSettings() {
  const storeName = document.getElementById('store-name')?.value.trim();
  const currency = document.getElementById('currency-symbol')?.value;
  const defaultThreshold = Number(document.getElementById('default-threshold')?.value) || 5;
  const defaultCategory = document.getElementById('default-category')?.value.trim() || 'General';

  if (!storeName) {
    notify.error('Store name cannot be blank.');
    return;
  }

  const settings = {
    storeName,
    currency,
    defaultThreshold,
    defaultCategory,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem('inventra_settings', JSON.stringify(settings));
  notify.success('Settings saved successfully.');
}

async function runDiagnostics() {
  const resultsDiv = document.getElementById('diagnostic-results');
  if (!resultsDiv) return;

  resultsDiv.style.display = 'block';
  resultsDiv.innerHTML = '<span class="text-muted">Checking backend services...</span>';

  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    if (res.ok) {
      resultsDiv.innerHTML = `
        <div class="badge badge-success" style="padding: var(--space-2); width: 100%; display: block; text-align: left;">
          <strong>Server Status:</strong> ${data.status || 'OK'}<br>
          <strong>Database:</strong> ${data.database || 'Connected'}<br>
          <strong>Gemini Engine:</strong> ${data.gemini || 'Configured'}
        </div>
      `;
      notify.success('All backend checks passed.');
    } else {
      resultsDiv.innerHTML = `
        <div class="badge badge-warning" style="padding: var(--space-2); width: 100%; display: block; text-align: left;">
          <strong>Status:</strong> ${data.message || 'Degraded mode (Demo fallback active)'}
        </div>
      `;
    }
  } catch (err) {
    resultsDiv.innerHTML = `
      <div class="badge badge-info" style="padding: var(--space-2); width: 100%; display: block; text-align: left;">
        <strong>Local Mode:</strong> Running without backend server connection. Local storage demo active.
      </div>
    `;
  }
}

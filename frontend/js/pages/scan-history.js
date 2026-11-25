/**
 * INVENTRA SCAN HISTORY CONTROLLER (scan-history.js)
 */

let allScans = [];

document.addEventListener('DOMContentLoaded', async () => {
  renderSidebar('history');
  renderNavbar('Scan History');

  setupHistoryFilters();
  await loadScanHistory();
});

function setupHistoryFilters() {
  const searchInput = document.getElementById('history-search');
  const dateFilter = document.getElementById('history-date-filter');

  if (searchInput) {
    searchInput.addEventListener('input', () => applyFilters());
  }

  if (dateFilter) {
    dateFilter.addEventListener('change', () => applyFilters());
  }
}

function applyFilters() {
  const searchInput = document.getElementById('history-search');
  const dateFilter = document.getElementById('history-date-filter');

  const query = (searchInput?.value || '').toLowerCase().trim();
  const dateValue = dateFilter?.value || '';

  let filtered = allScans;

  // Filter by search query (scan ID or status)
  if (query) {
    filtered = filtered.filter(s => {
      const idStr = String(s.id).toLowerCase();
      const statusStr = (s.status || '').toLowerCase().replace(/_/g, ' ');
      return idStr.includes(query) || statusStr.includes(query);
    });
  }

  // Filter by date range
  if (dateValue) {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    let cutoff;

    if (dateValue === 'today') {
      cutoff = new Date(now);
      cutoff.setHours(0, 0, 0, 0);
    } else if (dateValue === '7days') {
      cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 7);
    } else if (dateValue === '30days') {
      cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 30);
    } else if (dateValue === '90days') {
      cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 90);
    }

    if (cutoff) {
      filtered = filtered.filter(s => {
        if (!s.created_at) return false;
        return new Date(s.created_at) >= cutoff;
      });
    }
  }

  renderHistory(filtered);
}

async function loadScanHistory() {
  const loading = document.getElementById('history-loading-state');

  try {
    const scans = await api.get('/scans');
    allScans = scans || [];
    renderHistory(allScans);
  } catch (err) {
    console.error('Failed to load scan history:', err);
    notify.error('Unable to load scan history.');
    allScans = [];
    renderHistory([]);
  } finally {
    if (loading) loading.style.display = 'none';
  }
}

function renderHistory(scans) {
  const empty = document.getElementById('history-empty-state');
  const table = document.getElementById('history-table');
  const tbody = document.getElementById('history-tbody');
  const countLabel = document.getElementById('history-count-label');

  if (countLabel) {
    countLabel.textContent = `${scans.length} scan${scans.length !== 1 ? 's' : ''}`;
  }

  if (scans.length === 0) {
    if (table) table.style.display = 'none';
    if (empty) empty.style.display = 'flex';
    return;
  }

  if (empty) empty.style.display = 'none';
  if (table) table.style.display = 'table';

  if (tbody) {
    tbody.innerHTML = scans.map(s => {
      let badge = '<span class="badge badge-success">Verified & Saved</span>';
      if (s.status === 'discarded') {
        badge = '<span class="badge badge-neutral">Discarded</span>';
      } else if (s.status === 'pending_verification') {
        badge = '<span class="badge badge-warning">Pending Review</span>';
      }

      return `
        <tr>
          <td>${formatDate(s.created_at)}</td>
          <td><code>#${s.id}</code></td>
          <td><strong>${s.total_items_detected || 0}</strong></td>
          <td>${s.total_items_saved || 0}</td>
          <td>${badge}</td>
          <td style="text-align: right;">
            <a href="/pages/scan-results.html?scanId=${s.id}" class="btn btn-secondary btn-sm">
              Inspect
            </a>
          </td>
        </tr>
      `;
    }).join('');
  }
}

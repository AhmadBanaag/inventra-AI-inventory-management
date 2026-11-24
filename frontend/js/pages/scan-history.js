/**
 * INVENTRA SCAN HISTORY CONTROLLER (scan-history.js)
 */

document.addEventListener('DOMContentLoaded', async () => {
  renderSidebar('history');
  renderNavbar('Scan History');

  await loadScanHistory();
});

async function loadScanHistory() {
  const loading = document.getElementById('history-loading-state');
  const empty = document.getElementById('history-empty-state');
  const table = document.getElementById('history-table');
  const tbody = document.getElementById('history-tbody');

  try {
    const scans = await api.get('/scans');
    renderHistory(scans || []);
  } catch (err) {
    console.error('Failed to load scan history:', err);
    notify.error('Unable to load scan history.');
    renderHistory([]);
  } finally {
    if (loading) loading.style.display = 'none';
  }
}

function renderHistory(scans) {
  const empty = document.getElementById('history-empty-state');
  const table = document.getElementById('history-table');
  const tbody = document.getElementById('history-tbody');

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

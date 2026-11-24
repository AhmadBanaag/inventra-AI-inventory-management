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
    console.warn('API error, using demo scan logs:', err);
    // Demo history
    const demoScans = [
      { id: 'scan-001', created_at: new Date(Date.now() - 3600000 * 2).toISOString(), total_items_detected: 14, total_items_saved: 14, status: 'completed' },
      { id: 'scan-002', created_at: new Date(Date.now() - 3600000 * 24).toISOString(), total_items_detected: 8, total_items_saved: 8, status: 'completed' },
      { id: 'scan-003', created_at: new Date(Date.now() - 3600000 * 48).toISOString(), total_items_detected: 10, total_items_saved: 0, status: 'discarded' },
    ];
    renderHistory(demoScans);
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

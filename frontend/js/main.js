/**
 * INVENTRA MAIN ENTRY POINT (main.js)
 * Shared utilities, formatting helpers, and initialization
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global Escape key handler to close mobile drawers or modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const sidebar = document.getElementById('app-sidebar');
      const backdrop = document.querySelector('.sidebar-backdrop');
      if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
      }
      if (backdrop && backdrop.classList.contains('active')) {
        backdrop.classList.remove('active');
      }
    }
  });
});

/**
 * Currency formatter helper
 */
function formatCurrency(amount = 0, currency = '$') {
  const num = Number(amount) || 0;
  return `${currency}${num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
}

/**
 * Standard date formatter
 */
function formatDate(dateInput) {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

window.formatCurrency = formatCurrency;
window.formatDate = formatDate;

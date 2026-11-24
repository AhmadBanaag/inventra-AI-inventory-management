/**
 * INVENTRA NAVBAR COMPONENT (navbar.js)
 * Standardizes top application header, breadcrumb navigation, and status indicator
 */

function renderNavbar(sectionTitle = 'Dashboard') {
  const container = document.getElementById('app-navbar');
  if (!container) return;

  const html = `
    <div class="navbar-left">
      <button type="button" class="mobile-nav-toggle" aria-label="Toggle Navigation Menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
      </button>

      <nav class="navbar-breadcrumbs" aria-label="Breadcrumb">
        <span>Inventra</span>
        <span>/</span>
        <span class="current">${sectionTitle}</span>
      </nav>
    </div>

    <div class="navbar-right">
      <div class="system-status-indicator" title="Backend API & Storage Status">
        <span class="status-dot" id="system-status-dot"></span>
        <span id="system-status-text">System Online</span>
      </div>

      <a href="/pages/print-template.html" target="_blank" class="btn btn-secondary btn-sm" title="Print standardized handwriting template">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
        </svg>
        <span>Print Sheet</span>
      </a>
    </div>
  `;

  container.innerHTML = html;

  // Check backend health quietly in background
  checkHealth();
}

async function checkHealth() {
  const dot = document.getElementById('system-status-dot');
  const text = document.getElementById('system-status-text');
  if (!dot || !text) return;

  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      dot.className = 'status-dot';
      text.textContent = 'System Online';
    } else {
      dot.className = 'status-dot offline';
      text.textContent = 'API Degraded';
    }
  } catch (err) {
    // If running frontend standalone or offline
    dot.className = 'status-dot offline';
    text.textContent = 'Offline / Demo';
  }
}

window.renderNavbar = renderNavbar;

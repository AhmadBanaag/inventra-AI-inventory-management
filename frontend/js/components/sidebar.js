/**
 * INVENTRA SIDEBAR COMPONENT (sidebar.js)
 * Standardizes navigation links and responsive mobile drawer
 */

function renderSidebar(activeKey = '') {
  const container = document.getElementById('app-sidebar');
  if (!container) return;

  const currentPath = window.location.pathname.toLowerCase();

  // Navigation items definition
  const navItems = [
    { key: 'dashboard', label: 'Dashboard', href: '/pages/dashboard.html', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
    { key: 'inventory', label: 'My Inventory', href: '/pages/inventory.html', icon: 'M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z' },
    { key: 'scan', label: 'Scan Inventory', href: '/pages/scan-inventory.html', icon: 'M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm14 0h-4v2h2v4h2v-4h2v-2h-2zm-4 4h2v2h-2z' },
    { key: 'history', label: 'Scan History', href: '/pages/scan-history.html', icon: 'M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z' },
    { key: 'settings', label: 'Settings', href: '/pages/settings.html', icon: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z' },
  ];

  const html = `
    <div class="sidebar-header">
      <a href="/pages/dashboard.html" class="sidebar-brand">
        <div class="brand-icon">I</div>
        <div>
          <span class="brand-title">Inventra</span>
          <span class="brand-tagline">Write. Snap. Sort.</span>
        </div>
      </a>
    </div>

    <div class="sidebar-content">
      <div class="nav-section-title">Navigation</div>
      <ul class="nav-list">
        ${navItems.map(item => {
          const isActive = activeKey === item.key || currentPath.includes(item.href);
          return `
            <li class="nav-item">
              <a href="${item.href}" class="nav-link ${isActive ? 'active' : ''}">
                <span class="nav-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="${item.icon}" />
                  </svg>
                </span>
                <span>${item.label}</span>
              </a>
            </li>
          `;
        }).join('')}
      </ul>

      <div class="nav-section-title">Resources</div>
      <ul class="nav-list">
        <li class="nav-item">
          <a href="/pages/print-template.html" class="nav-link" target="_blank" rel="noopener">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
              </svg>
            </span>
            <span>Print Template</span>
          </a>
        </li>
      </ul>
    </div>

    <div class="sidebar-footer">
      <a href="/pages/scan-inventory.html" class="btn btn-primary sidebar-quick-action">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        <span>Snap & Scan</span>
      </a>
    </div>
  `;

  container.innerHTML = html;

  // Setup mobile drawer listener
  setupMobileDrawer();
}

function setupMobileDrawer() {
  const toggleBtn = document.querySelector('.mobile-nav-toggle');
  const sidebar = document.getElementById('app-sidebar');
  let backdrop = document.querySelector('.sidebar-backdrop');

  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);
  }

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      backdrop.classList.toggle('active');
    });

    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('open');
      backdrop.classList.remove('active');
    });
  }
}

window.renderSidebar = renderSidebar;

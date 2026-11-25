/**
 * INVENTRA SIDEBAR COMPONENT (sidebar.js)
 * Standardizes navigation links and responsive mobile drawer
 */

function renderSidebar(activeKey = '') {
  const container = document.getElementById('app-sidebar');
  if (!container) return;

  const navItems = [
    { key: 'scan', label: 'Scan Inventory', href: '/pages/scan-inventory.html', icon: 'M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm14 0h-4v2h2v4h2v-4h2v-2h-2zm-4 4h2v2h-2z' },
  ];

  const html = `
    <div class="sidebar-header">
      <a href="/" class="sidebar-brand">
        <span class="brand-title">Inventra</span>
      </a>
    </div>

    <div class="sidebar-content">
      <div class="nav-section-title">Navigation</div>
      <ul class="nav-list">
        ${navItems.map(item => {
          const isActive = activeKey === item.key;
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
          <a href="/pages/inventory-template.html" class="nav-link" target="_blank" rel="noopener">
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

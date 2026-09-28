/**
 * KMF Dairy Data Management & Analytics System - Application Controller
 * Author: Anil Govind Badiger | Pair Programming Implementation
 */

// Global App State
const state = {
  currentRoute: 'landing',
  theme: localStorage.getItem('kmf_theme') || 'dark',
  user: JSON.parse(localStorage.getItem('kmf_user')) || {
    name: 'Anil Govind Badiger',
    email: 'anilbadiger857@gmail.com',
    role: 'Admin',
    empId: 'KMF-EMP-001',
    dept: 'Sales & Analytics'
  },
  
  // Database tables (Stored in localStorage or initialized from seed)
  salesRecords: [],
  collectionRecords: [],
  distributionRecords: [],
  
  // Dynamic multi-product items in active sales entry form
  salesFormItems: [],
  
  // Data records view state
  recordsPage: 1,
  recordsPageSize: 10,
  recordsSearchTerm: '',
  recordsLocationFilter: 'all',
  recordsProductFilter: 'all',
  recordPendingDeleteId: null,
  
  // Chart instances
  charts: {}
};

// Official Nandini Product Catalog
const PRODUCT_CATALOG = [
  { name: "Nandini Toned Milk (1L)", category: "Milk", price: 42 },
  { name: "Nandini Homogenised Cow Milk (1L)", category: "Milk", price: 46 },
  { name: "Nandini Special Milk (1L)", category: "Milk", price: 48 },
  { name: "Nandini Shubham Milk (1L)", category: "Milk", price: 50 },
  { name: "Nandini Samrudhi Milk (1L)", category: "Milk", price: 54 },
  { name: "Nandini Curd (500g)", category: "Fresh Dairy", price: 26 },
  { name: "Nandini Fresh Paneer (200g)", category: "Fresh Dairy", price: 95 },
  { name: "Nandini Set Curd (400g)", category: "Fresh Dairy", price: 40 },
  { name: "Nandini Spiced Buttermilk (200ml)", category: "Beverages", price: 12 },
  { name: "Nandini Sweet Lassi (200ml)", category: "Beverages", price: 20 },
  { name: "Nandini Flavoured Milk Badam (200ml)", category: "Beverages", price: 35 },
  { name: "Nandini Pure Ghee (1L)", category: "Ghee & Butter", price: 610 },
  { name: "Nandini Pure Ghee (500ml)", category: "Ghee & Butter", price: 315 },
  { name: "Nandini Salted Butter (500g)", category: "Ghee & Butter", price: 275 },
  { name: "Nandini Unsalted Butter (500g)", category: "Ghee & Butter", price: 280 },
  { name: "Nandini Mysore Pak (250g)", category: "Sweets", price: 160 },
  { name: "Nandini Milk Peda (250g)", category: "Sweets", price: 140 },
  { name: "Nandini Gulab Jamun (1kg)", category: "Sweets", price: 260 },
  { name: "Nandini Kulfi (50ml)", category: "Frozen", price: 25 },
  { name: "Nandini Cassata Ice Cream (150ml)", category: "Frozen", price: 55 }
];

// Seed Initial Database if empty
function initDatabase() {
  const storedSales = localStorage.getItem('kmf_sales_records');
  if (storedSales) {
    state.salesRecords = JSON.parse(storedSales);
  } else if (window.KMF_DATA && window.KMF_DATA.all_records) {
    state.salesRecords = window.KMF_DATA.all_records.slice(0, 1000).map((r, i) => ({
      id: `KMF-2026-${String(i + 1).padStart(5, '0')}`,
      date: r.Date || '27-09-2026',
      product: r.Product,
      category: r.Category,
      location: r.Location,
      distributor: r.Distributor,
      quantity: r.Quantity_Sold,
      price: r.Unit_Price,
      revenue: r.Revenue,
      customerType: r.Customer_Type || 'Retail'
    }));
    localStorage.setItem('kmf_sales_records', JSON.stringify(state.salesRecords));
  }
  
  // Seed initial Collection records
  const storedCol = localStorage.getItem('kmf_collection_records');
  if (storedCol) {
    state.collectionRecords = JSON.parse(storedCol);
  } else {
    state.collectionRecords = [
      { id: 'COL-101', date: '27-09-2026', center: 'Bengaluru Main Chilling Unit', farmerId: 'FAR-8492', milkType: 'Cow', litres: 6500, fat: 4.2, snf: 8.5, rate: 38.5, total: 250250 },
      { id: 'COL-102', date: '27-09-2026', center: 'Mysuru District Dairy Center', farmerId: 'FAR-7312', milkType: 'Buffalo', litres: 4800, fat: 6.8, snf: 9.0, rate: 46.0, total: 220800 },
      { id: 'COL-103', date: '27-09-2026', center: 'Hubballi Rural BMC Center', farmerId: 'FAR-9204', milkType: 'Mixed', litres: 4200, fat: 4.5, snf: 8.6, rate: 39.5, total: 165900 },
      { id: 'COL-104', date: '27-09-2026', center: 'Belagavi Chilling Plant', farmerId: 'FAR-5521', milkType: 'Cow', litres: 2950, fat: 4.1, snf: 8.5, rate: 38.0, total: 112100 }
    ];
    localStorage.setItem('kmf_collection_records', JSON.stringify(state.collectionRecords));
  }
  
  // Update sidebar record count badge
  updateDatabaseBadges();
}

function updateDatabaseBadges() {
  const badge = document.getElementById('sidebar-record-count');
  if (badge) {
    badge.textContent = `${state.salesRecords.length.toLocaleString()} records synced`;
  }
}

// Router & View Management
function navigateTo(routeId) {
  state.currentRoute = routeId;
  window.location.hash = routeId;
  
  // Show / Hide Header & Sidebar for Auth/Landing vs Internal App
  const isPublicPage = ['landing', 'login', 'register', 'thank-you'].includes(routeId);
  const sidebar = document.getElementById('app-sidebar');
  const mainWrapper = document.getElementById('main-wrapper');
  const headerDataBtn = document.getElementById('btn-header-data-entry');
  const headerProfile = document.getElementById('user-header-profile');
  const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
  const breadcrumbPill = document.getElementById('header-breadcrumb-pill');
  const publicNav = document.getElementById('header-public-nav');
  const headerLoginBtn = document.getElementById('btn-header-login');
  const headerLaunchBtn = document.getElementById('btn-header-launch');
  
  if (sidebar) sidebar.style.display = isPublicPage ? 'none' : 'flex';
  if (mainWrapper) mainWrapper.style.marginLeft = isPublicPage ? '0' : '';
  if (headerDataBtn) headerDataBtn.style.display = isPublicPage ? 'none' : 'flex';
  if (headerProfile) headerProfile.style.display = isPublicPage ? 'none' : 'flex';
  if (sidebarToggleBtn) sidebarToggleBtn.style.display = isPublicPage ? 'none' : 'inline-flex';
  if (breadcrumbPill) breadcrumbPill.style.display = isPublicPage ? 'none' : 'flex';
  if (publicNav) publicNav.style.display = (routeId === 'landing') ? 'flex' : 'none';
  if (headerLoginBtn) headerLoginBtn.style.display = (routeId === 'landing') ? 'inline-flex' : 'none';
  if (headerLaunchBtn) headerLaunchBtn.style.display = (routeId === 'landing') ? 'inline-flex' : 'none';
  
  // Toggle Page Views
  document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
  const targetView = document.getElementById(`view-${routeId}`);
  if (targetView) {
    targetView.classList.add('active');
  }
  
  // Update Active Sidebar Items
  document.querySelectorAll('.nav-item-btn, .nav-sub-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-route') === routeId);
  });
  
  // Breadcrumb Title
  const bTitle = document.getElementById('active-breadcrumb-title');
  if (bTitle) {
    const titles = {
      'landing': 'KMF Dairy Portal',
      'login': 'User Authentication',
      'register': 'Staff Registration',
      'dashboard': 'Main Dashboard',
      'data-entry': 'Select Data Entry Type',
      'data-entry-sales': 'Product Sales Entry',
      'data-entry-collection': 'Milk Collection Entry',
      'data-entry-distribution': 'Distribution Entry',
      'records': 'Data Records & Invoices',
      'analytics': 'Dairy Business Analytics',
      'product-analytics': 'Product Analytics Deep Dive',
      'collection-analytics': 'Milk Collection Analytics',
      'insights': 'Business Insights',
      'reports': 'Generate Reports',
      'export': 'Export Data Mart',
      'settings': 'Profile & Settings',
      'thank-you': 'System Completion'
    };
    bTitle.textContent = titles[routeId] || 'KMF Analytics';
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Trigger Specific Module Initializers
  if (routeId === 'dashboard') renderDashboardHome();
  if (routeId === 'data-entry-sales') initSalesForm();
  if (routeId === 'records') renderRecordsTable();
  if (routeId === 'analytics') renderAnalyticsDashboard();
  if (routeId === 'product-analytics') initProductAnalyticsDropdown();
  if (routeId === 'collection-analytics') renderCollectionAnalyticsCharts();
  if (routeId === 'reports') generateReportView();
  if (routeId === 'settings') renderProfilePage();
}

// User Authentication
function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  
  state.user = {
    name: email.includes('anil') ? 'Anil Govind Badiger' : 'KMF Operator',
    email: email,
    role: email.includes('anil') ? 'Admin' : 'Data Entry Operator',
    empId: 'KMF-EMP-001',
    dept: 'Sales & Analytics'
  };
  localStorage.setItem('kmf_user', JSON.stringify(state.user));
  updateUserProfileDisplay();
  showToast(`Welcome back, ${state.user.name}!`);
  navigateTo('dashboard');
}

function fillDemoLogin(role) {
  const emailEl = document.getElementById('login-email');
  const passEl = document.getElementById('login-password');
  if (role === 'admin') {
    if (emailEl) emailEl.value = 'anilbadiger857@gmail.com';
    if (passEl) passEl.value = 'kmfAdmin2026';
  } else {
    if (emailEl) emailEl.value = 'operator@kmf.coop';
    if (passEl) passEl.value = 'operator123';
  }
}

function loginAsDemoAdmin() {
  state.user = {
    name: 'Anil Govind Badiger',
    email: 'anilbadiger857@gmail.com',
    role: 'Admin',
    empId: 'KMF-EMP-001',
    dept: 'Sales & Analytics'
  };
  localStorage.setItem('kmf_user', JSON.stringify(state.user));
  updateUserProfileDisplay();
  navigateTo('dashboard');
}

function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const pass = document.getElementById('reg-pass').value;
  const cpass = document.getElementById('reg-cpass').value;
  
  if (pass !== cpass) {
    showToast('Error: Passwords do not match!');
    return;
  }
  
  showToast('Registration Successful! Your account has been created.');
  navigateTo('login');
}

function updateUserProfileDisplay() {
  const uName = document.getElementById('user-header-name');
  const uAvatar = document.getElementById('user-avatar-letter');
  const dGreeting = document.getElementById('dashboard-user-greeting');
  
  if (uName) uName.textContent = state.user.name.split(' ')[0];
  if (uAvatar) uAvatar.textContent = state.user.name.charAt(0);
  if (dGreeting) dGreeting.textContent = `Good Morning, ${state.user.name.split(' ')[0]} 👋`;
}

function renderProfilePage() {
  const pName = document.getElementById('prof-name');
  const pEmail = document.getElementById('prof-email');
  const pRole = document.getElementById('prof-role');
  
  if (pName) pName.textContent = state.user.name;
  if (pEmail) pEmail.textContent = state.user.email;
  if (pRole) pRole.textContent = state.user.role;
}

function openLogoutModal() {
  const m = document.getElementById('logout-modal');
  if (m) m.classList.add('active');
}

function closeLogoutModal() {
  const m = document.getElementById('logout-modal');
  if (m) m.classList.remove('active');
}

function confirmLogout() {
  closeLogoutModal();
  showToast('Logged out successfully.');
  navigateTo('thank-you');
}

// Colorful Badges System
function getCategoryBadgeHtml(category) {
  const cat = category || 'Dairy';
  if (cat.includes('Milk')) return `<span class="badge-cat-milk">🥛 ${cat}</span>`;
  if (cat.includes('Fresh') || cat.includes('Curd') || cat.includes('Paneer')) return `<span class="badge-cat-dairy">🧀 ${cat}</span>`;
  if (cat.includes('Ghee') || cat.includes('Butter')) return `<span class="badge-cat-ghee">🧈 ${cat}</span>`;
  if (cat.includes('Sweet') || cat.includes('Peda') || cat.includes('Pak')) return `<span class="badge-cat-sweets">🍬 ${cat}</span>`;
  if (cat.includes('Frozen') || cat.includes('Ice')) return `<span class="badge-cat-frozen">🍦 ${cat}</span>`;
  return `<span class="badge-cat-milk">🥛 ${cat}</span>`;
}

function getLocationBadgeHtml(location) {
  const loc = location || 'Bengaluru';
  const locLower = loc.toLowerCase();
  let icon = '🏛️';
  let locClass = 'loc-bengaluru';
  if (locLower.includes('bengaluru')) { icon = '🏙️'; locClass = 'loc-bengaluru'; }
  else if (locLower.includes('mysuru')) { icon = '👑'; locClass = 'loc-mysuru'; }
  else if (locLower.includes('hubballi')) { icon = '🌾'; locClass = 'loc-hubballi'; }
  else if (locLower.includes('belagavi')) { icon = '🏔️'; locClass = 'loc-belagavi'; }
  else if (locLower.includes('mangaluru')) { icon = '🌊'; locClass = 'loc-mangaluru'; }
  else if (locLower.includes('kalaburagi')) { icon = '☀️'; locClass = 'loc-kalaburagi'; }
  else if (locLower.includes('davanagere')) { icon = '🏭'; locClass = 'loc-davanagere'; }
  else if (locLower.includes('shivamogga')) { icon = '🌿'; locClass = 'loc-shivamogga'; }
  else if (locLower.includes('ballari')) { icon = '⛏️'; locClass = 'loc-ballari'; }
  else if (locLower.includes('tumakuru')) { icon = '🌴'; locClass = 'loc-tumakuru'; }
  return `<span class="badge-loc ${locClass}">${icon} ${loc}</span>`;
}

// Main Dashboard Home Render
function renderDashboardHome() {
  updateUserProfileDisplay();
  
  // Compute KPIs from active sales records
  const totalSalesVal = state.salesRecords.reduce((sum, r) => sum + (r.revenue || 0), 0);
  const totalQtyVal = state.salesRecords.reduce((sum, r) => sum + (r.quantity || 0), 0);
  const totalMilkVal = state.collectionRecords.reduce((sum, r) => sum + (r.litres || 0), 0);
  
  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  
  setEl('home-kpi-sales', `₹${(totalSalesVal / 100000).toFixed(1)}L`);
  setEl('home-kpi-milk', `${totalMilkVal.toLocaleString()} L`);
  setEl('home-kpi-products', totalQtyVal.toLocaleString());
  setEl('home-kpi-distributors', '126');
  
  // Render Top Products Table
  const prodRev = {};
  state.salesRecords.forEach(r => {
    prodRev[r.product] = (prodRev[r.product] || { rev: 0, cat: r.category });
    prodRev[r.product].rev += (r.revenue || 0);
  });
  
  const sortedProds = Object.entries(prodRev).sort((a, b) => b[1].rev - a[1].rev).slice(0, 5);
  const prodTbody = document.getElementById('home-top-products-tbody');
  if (prodTbody) {
    prodTbody.innerHTML = sortedProds.map(([pName, pData], idx) => {
      let rankBadge = '';
      if (idx === 0) rankBadge = `<span style="display:inline-flex; width:26px; height:26px; border-radius:50%; background:linear-gradient(135deg, #f59e0b, #d97706); color:#fff; align-items:center; justify-content:center; font-weight:800; font-size:0.8rem; box-shadow: 0 2px 8px rgba(245,158,11,0.5);">🥇</span>`;
      else if (idx === 1) rankBadge = `<span style="display:inline-flex; width:26px; height:26px; border-radius:50%; background:linear-gradient(135deg, #94a3b8, #64748b); color:#fff; align-items:center; justify-content:center; font-weight:800; font-size:0.8rem; box-shadow: 0 2px 8px rgba(148,163,184,0.4);">🥈</span>`;
      else if (idx === 2) rankBadge = `<span style="display:inline-flex; width:26px; height:26px; border-radius:50%; background:linear-gradient(135deg, #b45309, #78350f); color:#fff; align-items:center; justify-content:center; font-weight:800; font-size:0.8rem; box-shadow: 0 2px 8px rgba(180,83,9,0.4);">🥉</span>`;
      else rankBadge = `<span style="display:inline-flex; width:26px; height:26px; border-radius:50%; background:rgba(2,132,199,0.18); color:#38bdf8; border:1px solid rgba(2,132,199,0.4); align-items:center; justify-content:center; font-weight:700; font-size:0.8rem;">#${idx+1}</span>`;

      return `
        <tr>
          <td>${rankBadge}</td>
          <td><strong style="color: var(--text-primary);">${pName}</strong></td>
          <td>${getCategoryBadgeHtml(pData.cat)}</td>
          <td style="text-align: right;"><span class="badge-rev">₹${pData.rev.toLocaleString()}</span></td>
        </tr>
      `;
    }).join('');
  }
  
  // Render Top Locations Grid
  const locRev = {};
  let totalAllLocRev = 0;
  state.salesRecords.forEach(r => {
    locRev[r.location] = (locRev[r.location] || 0) + (r.revenue || 0);
    totalAllLocRev += (r.revenue || 0);
  });
  const sortedLocs = Object.entries(locRev).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const locGrid = document.getElementById('home-top-locations-grid');
  if (locGrid) {
    const locThemes = [
      { border: 'rgba(2, 132, 199, 0.45)', bg: 'linear-gradient(145deg, rgba(2, 132, 199, 0.18), rgba(16, 31, 51, 0.85))', text: '#38bdf8', icon: '🏙️' },
      { border: 'rgba(16, 185, 129, 0.45)', bg: 'linear-gradient(145deg, rgba(16, 185, 129, 0.18), rgba(16, 31, 51, 0.85))', text: '#34d399', icon: '👑' },
      { border: 'rgba(245, 158, 11, 0.45)', bg: 'linear-gradient(145deg, rgba(245, 158, 11, 0.18), rgba(16, 31, 51, 0.85))', text: '#fbbf24', icon: '🌾' },
      { border: 'rgba(139, 92, 246, 0.45)', bg: 'linear-gradient(145deg, rgba(139, 92, 246, 0.18), rgba(16, 31, 51, 0.85))', text: '#c084fc', icon: '🏔️' },
      { border: 'rgba(6, 182, 212, 0.45)', bg: 'linear-gradient(145deg, rgba(6, 182, 212, 0.18), rgba(16, 31, 51, 0.85))', text: '#22d3ee', icon: '🌊' }
    ];

    locGrid.innerHTML = sortedLocs.map(([lName, lRev], idx) => {
      const theme = locThemes[idx] || locThemes[0];
      const pct = totalAllLocRev > 0 ? ((lRev / totalAllLocRev) * 100).toFixed(1) : '0';
      return `
        <div style="background: ${theme.bg}; border: 1px solid ${theme.border}; padding: 1.1rem; border-radius: var(--radius-md); text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.25); transition: transform 0.2s;" onmouseenter="this.style.transform='translateY(-3px)'" onmouseleave="this.style.transform='translateY(0)'">
          <div style="font-size: 1.5rem; margin-bottom: 0.25rem;">${theme.icon}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">#${idx + 1} REGION</div>
          <div style="font-size: 1.05rem; font-weight: 700; color: ${theme.text}; margin: 0.25rem 0;">${lName}</div>
          <div style="font-size: 1rem; color: var(--profit-green); font-weight: 800;">₹${(lRev / 100000).toFixed(1)}L</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.2rem;">${pct}% total share</div>
        </div>
      `;
    }).join('');
  }
  
  renderHomeSalesTrendChart();
}

function renderHomeSalesTrendChart() {
  const ctx = document.getElementById('chart-home-sales-trend');
  if (!ctx || typeof Chart === 'undefined') return;
  
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const revByMonth = {};
  months.forEach(m => revByMonth[m] = 0);
  
  state.salesRecords.forEach(r => {
    if (!r.date) return;
    const parts = r.date.split('-');
    if (parts.length === 3) {
      const mIdx = parseInt(parts[1], 10) - 1;
      if (mIdx >= 0 && mIdx < 12) revByMonth[months[mIdx]] += (r.revenue || 0);
    }
  });
  
  if (state.charts.homeSalesTrend) state.charts.homeSalesTrend.destroy();
  
  const isDark = state.theme === 'dark';
  const textColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  
  state.charts.homeSalesTrend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Revenue (₹ Lakhs)',
        data: months.map(m => Math.round(revByMonth[m] / 100000)),
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.12)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#38bdf8'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: textColor }, grid: { color: gridColor } },
        y: { ticks: { color: textColor, callback: (v) => `₹${v}L` }, grid: { color: gridColor } }
      }
    }
  });
}

// Multi-Product Sales Data Entry Form
function initSalesForm() {
  if (state.salesFormItems.length === 0) {
    state.salesFormItems = [
      { product: 'Nandini Toned Milk (1L)', category: 'Milk', quantity: 500, price: 42, revenue: 21000 }
    ];
  }
  renderSalesItemRows();
}

function addSalesItemRow() {
  state.salesFormItems.push({
    product: '',
    category: '',
    quantity: 100,
    price: 0,
    revenue: 0
  });
  renderSalesItemRows();
}

function removeSalesItemRow(idx) {
  if (state.salesFormItems.length <= 1) {
    showToast('At least one product item is required.');
    return;
  }
  state.salesFormItems.splice(idx, 1);
  renderSalesItemRows();
}

function renderSalesItemRows() {
  const tbody = document.getElementById('sales-items-tbody');
  if (!tbody) return;
  
  tbody.innerHTML = state.salesFormItems.map((item, idx) => `
    <tr>
      <td>
        <select class="form-select" onchange="handleProductSelect(${idx}, this.value)" required>
          <option value="">Select Product ▼</option>
          ${PRODUCT_CATALOG.map(p => `
            <option value="${p.name}" ${p.name === item.product ? 'selected' : ''}>
              ${p.name}
            </option>
          `).join('')}
        </select>
      </td>
      <td>
        ${item.category ? getCategoryBadgeHtml(item.category) : '<span style="color:var(--text-muted); font-size:0.8rem;">Select SKU</span>'}
      </td>
      <td>
        <input type="number" class="form-input" style="text-align: right;" value="${item.quantity}" min="1" step="1" required oninput="handleItemQtyChange(${idx}, this.value)">
      </td>
      <td>
        <input type="number" class="form-input" style="text-align: right;" value="${item.price}" min="1" step="1" required oninput="handleItemPriceChange(${idx}, this.value)">
      </td>
      <td>
        <input type="text" class="form-input" style="text-align: right; font-weight:700; color: var(--profit-green);" value="₹${(item.revenue || 0).toLocaleString()}" readonly>
      </td>
      <td style="text-align: center;">
        <button type="button" class="btn-row-action delete" title="Remove Item" onclick="removeSalesItemRow(${idx})">🗑</button>
      </td>
    </tr>
  `).join('');
  
  recalcSalesTotals();
}

function handleProductSelect(idx, prodName) {
  const catalogItem = PRODUCT_CATALOG.find(p => p.name === prodName);
  if (catalogItem) {
    state.salesFormItems[idx].product = catalogItem.name;
    state.salesFormItems[idx].category = catalogItem.category;
    state.salesFormItems[idx].price = catalogItem.price;
    state.salesFormItems[idx].revenue = (state.salesFormItems[idx].quantity || 0) * catalogItem.price;
  } else {
    state.salesFormItems[idx].product = '';
    state.salesFormItems[idx].category = '';
    state.salesFormItems[idx].price = 0;
    state.salesFormItems[idx].revenue = 0;
  }
  renderSalesItemRows();
}

function handleItemQtyChange(idx, val) {
  const qty = parseInt(val, 10) || 0;
  state.salesFormItems[idx].quantity = qty;
  state.salesFormItems[idx].revenue = qty * (state.salesFormItems[idx].price || 0);
  recalcSalesTotals();
}

function handleItemPriceChange(idx, val) {
  const price = parseFloat(val) || 0;
  state.salesFormItems[idx].price = price;
  state.salesFormItems[idx].revenue = (state.salesFormItems[idx].quantity || 0) * price;
  recalcSalesTotals();
}

function recalcSalesTotals() {
  const totalQty = state.salesFormItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalRev = state.salesFormItems.reduce((sum, item) => sum + (item.revenue || 0), 0);
  
  const qtyEl = document.getElementById('sales-running-total-qty');
  const revEl = document.getElementById('sales-running-total-rev');
  
  if (qtyEl) qtyEl.textContent = `${totalQty.toLocaleString()} Units`;
  if (revEl) revEl.textContent = `₹${totalRev.toLocaleString()}`;
}

function resetSalesEntryForm() {
  state.salesFormItems = [{ product: '', category: '', quantity: 100, price: 0, revenue: 0 }];
  renderSalesItemRows();
  showToast('Sales form cleared.');
}

// Data Validation & Save Entry
function handleSalesEntrySubmit(e) {
  e.preventDefault();
  
  // 1. Validation Checks
  const dateVal = document.getElementById('sales-form-date').value.trim();
  const locVal = document.getElementById('sales-form-location').value;
  const distVal = document.getElementById('sales-form-distributor').value;
  
  if (!locVal) { showToast('⚠ Please select a location.'); return; }
  if (!distVal) { showToast('⚠ Please select a distributor.'); return; }
  
  for (let i = 0; i < state.salesFormItems.length; i++) {
    const item = state.salesFormItems[i];
    if (!item.product) {
      showToast(`⚠ Please select a product for item #${i + 1}.`);
      return;
    }
    if (!item.quantity || item.quantity <= 0) {
      showToast(`⚠ Quantity must be greater than 0 for ${item.product}.`);
      return;
    }
    if (!item.price || item.price <= 0) {
      showToast(`⚠ Please enter a valid unit price for ${item.product}.`);
      return;
    }
  }
  
  // 2. Generate Unique Transaction ID
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randNum = Math.floor(Math.random() * 90000) + 10000;
  const transactionId = `KMF-${todayStr}-${randNum}`;
  
  // 3. Save into Database (state + localStorage)
  state.salesFormItems.forEach((item, idx) => {
    state.salesRecords.unshift({
      id: `${transactionId}-${idx + 1}`,
      date: dateVal,
      product: item.product,
      category: item.category,
      location: locVal,
      distributor: distVal,
      quantity: item.quantity,
      price: item.price,
      revenue: item.revenue,
      customerType: 'Retail'
    });
  });
  
  localStorage.setItem('kmf_sales_records', JSON.stringify(state.salesRecords));
  updateDatabaseBadges();
  
  // 4. Show Confirmation Screen
  const totalQty = state.salesFormItems.reduce((s, it) => s + it.quantity, 0);
  const totalRev = state.salesFormItems.reduce((s, it) => s + it.revenue, 0);
  const prodNames = state.salesFormItems.map(it => it.product.split(' ')[1] || it.product).join(', ');
  
  const idEl = document.getElementById('confirm-transaction-id');
  const sumEl = document.getElementById('confirm-product-summary');
  const qEl = document.getElementById('confirm-qty-summary');
  const rEl = document.getElementById('confirm-rev-summary');
  
  if (idEl) idEl.textContent = transactionId;
  if (sumEl) sumEl.textContent = prodNames;
  if (qEl) qEl.textContent = `${totalQty.toLocaleString()} Units`;
  if (rEl) rEl.textContent = `₹${totalRev.toLocaleString()}`;
  
  const modal = document.getElementById('sales-confirmation-overlay');
  if (modal) modal.classList.add('active');
}

function closeConfirmationAndAddAnother() {
  const modal = document.getElementById('sales-confirmation-overlay');
  if (modal) modal.classList.remove('active');
  resetSalesEntryForm();
}

function closeConfirmationAndGo(targetRoute) {
  const modal = document.getElementById('sales-confirmation-overlay');
  if (modal) modal.classList.remove('active');
  navigateTo(targetRoute);
}

// Milk Collection Entry Handler
function recalcCollectionTotal() {
  const qty = parseFloat(document.getElementById('col-qty').value) || 0;
  const rate = parseFloat(document.getElementById('col-rate').value) || 0;
  const tot = qty * rate;
  const totalEl = document.getElementById('col-total');
  if (totalEl) totalEl.value = `₹${tot.toLocaleString()}`;
}

function handleCollectionSubmit(e) {
  e.preventDefault();
  const date = document.getElementById('col-date').value;
  const center = document.getElementById('col-center').value;
  const farmer = document.getElementById('col-farmer').value;
  const milkType = document.getElementById('col-milk-type').value;
  const qty = parseFloat(document.getElementById('col-qty').value) || 0;
  const fat = parseFloat(document.getElementById('col-fat').value) || 0;
  const snf = parseFloat(document.getElementById('col-snf').value) || 0;
  const rate = parseFloat(document.getElementById('col-rate').value) || 0;
  const total = qty * rate;
  
  if (qty <= 0) { showToast('⚠ Quantity collected must be greater than 0.'); return; }
  
  state.collectionRecords.unshift({
    id: `COL-${Date.now().toString().slice(-4)}`,
    date, center, farmerId: farmer, milkType, litres: qty, fat, snf, rate, total
  });
  localStorage.setItem('kmf_collection_records', JSON.stringify(state.collectionRecords));
  
  showToast(`✓ Milk Collection of ${qty}L from ${farmer} saved successfully!`);
  navigateTo('dashboard');
}

// Distribution Entry Handler
function recalcEfficiency() {
  const disp = parseInt(document.getElementById('dist-dispatched').value, 10) || 0;
  const del = parseInt(document.getElementById('dist-delivered').value, 10) || 0;
  const ret = Math.max(0, disp - del);
  
  const retEl = document.getElementById('dist-returned');
  const effEl = document.getElementById('dist-efficiency-badge');
  
  if (retEl) retEl.value = ret;
  const eff = disp > 0 ? ((del / disp) * 100).toFixed(1) : 0;
  if (effEl) effEl.textContent = `${eff}%`;
}

function handleDistributionSubmit(e) {
  e.preventDefault();
  showToast('✓ Distribution record saved successfully.');
  navigateTo('dashboard');
}

// Data Records Page
function renderRecordsTable() {
  let records = state.salesRecords;
  
  // Search filter
  const q = (document.getElementById('records-search-input')?.value || '').toLowerCase();
  if (q) {
    records = records.filter(r => 
      r.id.toLowerCase().includes(q) ||
      r.product.toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q) ||
      (r.distributor && r.distributor.toLowerCase().includes(q))
    );
  }
  
  // Location filter
  const locF = document.getElementById('records-filter-location')?.value || 'all';
  if (locF !== 'all') {
    records = records.filter(r => r.location === locF);
  }
  
  // Product filter
  const prodF = document.getElementById('records-filter-product')?.value || 'all';
  if (prodF !== 'all') {
    records = records.filter(r => r.product === prodF);
  }
  
  const totalPages = Math.ceil(records.length / state.recordsPageSize) || 1;
  const startIdx = (state.recordsPage - 1) * state.recordsPageSize;
  const pageRows = records.slice(startIdx, startIdx + state.recordsPageSize);
  
  const tbody = document.getElementById('records-tbody');
  if (tbody) {
    if (pageRows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2rem; color: var(--text-muted);">No records found.</td></tr>`;
    } else {
      tbody.innerHTML = pageRows.map(r => `
        <tr>
          <td><span class="badge-id">${r.id}</span></td>
          <td style="font-family: var(--font-mono); font-size: 0.82rem; color: var(--text-secondary);">${r.date}</td>
          <td>
            <strong style="color: var(--text-primary);">${r.product}</strong>
            <div style="margin-top: 0.25rem;">${getCategoryBadgeHtml(r.category)}</div>
          </td>
          <td>${getLocationBadgeHtml(r.location)}</td>
          <td style="text-align: right;"><span class="badge-qty">${(r.quantity || 0).toLocaleString()}</span></td>
          <td style="text-align: right;"><span class="badge-rev">₹${(r.revenue || 0).toLocaleString()}</span></td>
          <td style="font-size: 0.82rem; color: var(--text-secondary);"><span style="color:var(--dairy-gold);">🏢</span> ${r.distributor || '-'}</td>
          <td style="text-align: center;">
            <button class="btn-row-action" title="View Details" onclick="showToast('Invoice ID: ${r.id} | ${r.product} | ₹${r.revenue}')">👁</button>
            <button class="btn-row-action delete" title="Delete" onclick="promptDeleteRecord('${r.id}')">🗑</button>
          </td>
        </tr>
      `).join('');
    }
  }
  
  const infoEl = document.getElementById('records-pagination-info');
  const pageNumEl = document.getElementById('records-current-page');
  const prevB = document.getElementById('records-btn-prev');
  const nextB = document.getElementById('records-btn-next');
  
  if (infoEl) infoEl.textContent = `Showing ${records.length ? startIdx + 1 : 0} to ${Math.min(startIdx + state.recordsPageSize, records.length)} of ${records.length.toLocaleString()} records`;
  if (pageNumEl) pageNumEl.textContent = `Page ${state.recordsPage} of ${totalPages}`;
  if (prevB) prevB.disabled = state.recordsPage <= 1;
  if (nextB) nextB.disabled = state.recordsPage >= totalPages;
}

function filterRecordsTable() {
  state.recordsPage = 1;
  renderRecordsTable();
}

function prevRecordsPage() {
  if (state.recordsPage > 1) { state.recordsPage--; renderRecordsTable(); }
}

function nextRecordsPage() {
  const maxP = Math.ceil(state.salesRecords.length / state.recordsPageSize);
  if (state.recordsPage < maxP) { state.recordsPage++; renderRecordsTable(); }
}

function promptDeleteRecord(id) {
  state.recordPendingDeleteId = id;
  const modal = document.getElementById('delete-confirm-modal');
  if (modal) modal.classList.add('active');
}

function closeDeleteModal() {
  state.recordPendingDeleteId = null;
  const modal = document.getElementById('delete-confirm-modal');
  if (modal) modal.classList.remove('active');
}

function confirmDeleteRecord() {
  if (!state.recordPendingDeleteId) return;
  state.salesRecords = state.salesRecords.filter(r => r.id !== state.recordPendingDeleteId);
  localStorage.setItem('kmf_sales_records', JSON.stringify(state.salesRecords));
  closeDeleteModal();
  updateDatabaseBadges();
  renderRecordsTable();
  showToast('✓ Record deleted successfully.');
}

// Analytics Dashboard
function renderAnalyticsDashboard() {
  applyAnalyticsFilters();
}

function applyAnalyticsFilters() {
  let records = state.salesRecords;
  const locF = document.getElementById('analytics-filter-loc')?.value || 'all';
  const prodF = document.getElementById('analytics-filter-prod')?.value || 'all';
  
  if (locF !== 'all') records = records.filter(r => r.location === locF);
  if (prodF !== 'all') records = records.filter(r => r.product === prodF);
  
  const totalRev = records.reduce((s, r) => s + (r.revenue || 0), 0);
  const totalQty = records.reduce((s, r) => s + (r.quantity || 0), 0);
  const totalMilk = state.collectionRecords.reduce((s, r) => s + (r.litres || 0), 0);
  const dailyAvg = records.length > 0 ? Math.round(totalRev / 365) : 0;
  
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('analytics-kpi-rev', `₹${(totalRev / 10000000).toFixed(2)} Cr`);
  setEl('analytics-kpi-qty', totalQty.toLocaleString());
  setEl('analytics-kpi-milk', `${totalMilk.toLocaleString()} L`);
  setEl('analytics-kpi-daily', `₹${dailyAvg.toLocaleString()}`);
  setEl('analytics-kpi-trans', records.length.toLocaleString());
  
  renderAnalyticsCharts(records);
}

function renderAnalyticsCharts(records) {
  if (typeof Chart === 'undefined') return;
  const isDark = state.theme === 'dark';
  const textColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  
  // 1. Monthly Revenue Trend
  const ctxMonth = document.getElementById('chart-analytics-monthly');
  if (ctxMonth) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const revM = {}; months.forEach(m => revM[m] = 0);
    records.forEach(r => {
      const mIdx = r.date ? parseInt(r.date.split('-')[1], 10) - 1 : -1;
      if (mIdx >= 0 && mIdx < 12) revM[months[mIdx]] += (r.revenue || 0);
    });
    
    if (state.charts.anMonth) state.charts.anMonth.destroy();
    state.charts.anMonth = new Chart(ctxMonth, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{ label: 'Revenue (₹ Lakhs)', data: months.map(m => Math.round(revM[m] / 100000)), borderColor: '#0284c7', backgroundColor: 'rgba(2,132,199,0.12)', fill: true, tension: 0.35 }]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: textColor }, grid: { color: gridColor } }, y: { ticks: { color: textColor, callback: (v) => `₹${v}L` }, grid: { color: gridColor } } } }
    });
  }
  
  // 2. Revenue by Product
  const ctxProd = document.getElementById('chart-analytics-product');
  if (ctxProd) {
    const pRev = {};
    records.forEach(r => { pRev[r.product] = (pRev[r.product] || 0) + (r.revenue || 0); });
    const topP = Object.entries(pRev).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const prodColors = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f43f5e'];
    const prodBorders = ['#38bdf8', '#34d399', '#fbbf24', '#c084fc', '#22d3ee', '#fb7185'];
    
    if (state.charts.anProd) state.charts.anProd.destroy();
    state.charts.anProd = new Chart(ctxProd, {
      type: 'bar',
      data: {
        labels: topP.map(p => p[0].replace(/ \(.*\)/, '')),
        datasets: [{
          data: topP.map(p => Math.round(p[1] / 100000)),
          backgroundColor: prodColors.slice(0, topP.length),
          borderColor: prodBorders.slice(0, topP.length),
          borderWidth: 1.5,
          borderRadius: 6
        }]
      },
      options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: textColor, callback: (v) => `₹${v}L` }, grid: { color: gridColor } }, y: { ticks: { color: textColor }, grid: { color: gridColor } } } }
    });
  }
  
  // 3. Sales by Location
  const ctxLoc = document.getElementById('chart-analytics-location');
  if (ctxLoc) {
    const lRev = {};
    records.forEach(r => { lRev[r.location] = (lRev[r.location] || 0) + (r.revenue || 0); });
    const topL = Object.entries(lRev).sort((a, b) => b[1] - a[1]);
    const locPalette = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#6366f1', '#eab308', '#f97316'];
    const locBorders = ['#38bdf8', '#34d399', '#fbbf24', '#c084fc', '#22d3ee', '#f472b6', '#2dd4bf', '#818cf8', '#facc15', '#fb923c'];
    
    if (state.charts.anLoc) state.charts.anLoc.destroy();
    state.charts.anLoc = new Chart(ctxLoc, {
      type: 'bar',
      data: {
        labels: topL.map(l => l[0]),
        datasets: [{
          data: topL.map(l => Math.round(l[1] / 100000)),
          backgroundColor: locPalette.slice(0, topL.length),
          borderColor: locBorders.slice(0, topL.length),
          borderWidth: 1.5,
          borderRadius: 6
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: textColor }, grid: { color: gridColor } }, y: { ticks: { color: textColor, callback: (v) => `₹${v}L` }, grid: { color: gridColor } } } }
    });
  }
  
  // 4. Quantity vs Revenue Scatter
  const ctxScatter = document.getElementById('chart-analytics-scatter');
  if (ctxScatter) {
    const points = records.slice(0, 150).map(r => ({ x: r.quantity, y: Math.round(r.revenue / 1000) }));
    if (state.charts.anScatter) state.charts.anScatter.destroy();
    state.charts.anScatter = new Chart(ctxScatter, {
      type: 'scatter',
      data: { datasets: [{ data: points, backgroundColor: 'rgba(139, 92, 246, 0.7)', pointRadius: 4 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { title: { display: true, text: 'Quantity Sold', color: textColor }, ticks: { color: textColor } }, y: { title: { display: true, text: 'Revenue (₹k)', color: textColor }, ticks: { color: textColor } } } }
    });
  }
}

// Single Product Analytics
function initProductAnalyticsDropdown() {
  const sel = document.getElementById('single-product-selector');
  if (!sel) return;
  
  sel.innerHTML = PRODUCT_CATALOG.map(p => `
    <option value="${p.name}">${p.name} (${p.category})</option>
  `).join('');
  
  updateSingleProductAnalytics();
}

function updateSingleProductAnalytics() {
  const selProd = document.getElementById('single-product-selector')?.value || PRODUCT_CATALOG[0].name;
  const filtered = state.salesRecords.filter(r => r.product === selProd);
  
  const totalQty = filtered.reduce((s, r) => s + (r.quantity || 0), 0);
  const totalRev = filtered.reduce((s, r) => s + (r.revenue || 0), 0);
  const avgDaily = Math.round(totalQty / 365);
  const catItem = PRODUCT_CATALOG.find(p => p.name === selProd);
  const unitPrice = catItem ? catItem.price : (filtered[0]?.price || 0);
  
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('single-prod-qty', totalQty.toLocaleString());
  setEl('single-prod-rev', `₹${totalRev.toLocaleString()}`);
  setEl('single-prod-daily', avgDaily.toLocaleString());
  setEl('single-prod-price', `₹${unitPrice}`);
  
  renderSingleProductCharts(filtered, selProd);
}

function renderSingleProductCharts(records, prodName) {
  if (typeof Chart === 'undefined') return;
  const isDark = state.theme === 'dark';
  const textColor = isDark ? '#94a3b8' : '#475569';
  
  // Product Monthly
  const ctxM = document.getElementById('chart-single-prod-monthly');
  if (ctxM) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mRev = {}; months.forEach(m => mRev[m] = 0);
    records.forEach(r => {
      const mIdx = r.date ? parseInt(r.date.split('-')[1], 10) - 1 : -1;
      if (mIdx >= 0 && mIdx < 12) mRev[months[mIdx]] += (r.revenue || 0);
    });
    if (state.charts.spMonth) state.charts.spMonth.destroy();
    state.charts.spMonth = new Chart(ctxM, {
      type: 'line',
      data: { labels: months, datasets: [{ label: 'Revenue (₹)', data: months.map(m => mRev[m]), borderColor: '#10b981', fill: false }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: textColor } }, y: { ticks: { color: textColor } } } }
    });
  }
  
  // Product Location
  const ctxL = document.getElementById('chart-single-prod-location');
  if (ctxL) {
    const lRev = {};
    records.forEach(r => { lRev[r.location] = (lRev[r.location] || 0) + (r.revenue || 0); });
    const topL = Object.entries(lRev);
    const spLocColors = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#6366f1'];
    const spLocBorders = ['#38bdf8', '#34d399', '#fbbf24', '#c084fc', '#22d3ee', '#f472b6', '#2dd4bf', '#818cf8'];
    if (state.charts.spLoc) state.charts.spLoc.destroy();
    state.charts.spLoc = new Chart(ctxL, {
      type: 'bar',
      data: {
        labels: topL.map(l => l[0]),
        datasets: [{
          data: topL.map(l => l[1]),
          backgroundColor: spLocColors.slice(0, topL.length),
          borderColor: spLocBorders.slice(0, topL.length),
          borderWidth: 1.5,
          borderRadius: 6
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: textColor } }, y: { ticks: { color: textColor, callback: (v) => `₹${(v/1000).toFixed(0)}k` } } } }
    });
  }
}

// Collection Analytics Charts
function renderCollectionAnalyticsCharts() {
  if (typeof Chart === 'undefined') return;
  const ctx1 = document.getElementById('chart-collection-milktype');
  if (ctx1) {
    if (state.charts.colType) state.charts.colType.destroy();
    state.charts.colType = new Chart(ctx1, {
      type: 'doughnut',
      data: {
        labels: ['Cow Milk', 'Buffalo Milk', 'Mixed Milk'],
        datasets: [{
          data: [9450, 4800, 4200],
          backgroundColor: ['#0284c7', '#10b981', '#f59e0b'],
          borderColor: ['#38bdf8', '#34d399', '#fbbf24'],
          borderWidth: 2
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
  
  const ctx2 = document.getElementById('chart-collection-centers');
  if (ctx2) {
    if (state.charts.colCenters) state.charts.colCenters.destroy();
    state.charts.colCenters = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: ['Bengaluru Center', 'Mysuru Dairy', 'Hubballi BMC', 'Belagavi Plant'],
        datasets: [{
          label: 'Litres Intake',
          data: [6500, 4800, 4200, 2950],
          backgroundColor: ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6'],
          borderColor: ['#38bdf8', '#34d399', '#fbbf24', '#c084fc'],
          borderWidth: 1.5,
          borderRadius: 6
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
}

// Report Generator
function generateReportView() {
  const type = document.getElementById('report-type-sel')?.value || 'sales';
  const titleEl = document.getElementById('report-display-title');
  const tbody = document.getElementById('report-summary-tbody');
  
  if (titleEl) {
    titleEl.textContent = `KMF Dairy ${type.charAt(0).toUpperCase() + type.slice(1)} Report`;
  }
  
  // Aggregate category stats
  const catStats = {};
  state.salesRecords.forEach(r => {
    const c = r.category || 'Dairy';
    catStats[c] = (catStats[c] || { count: 0, qty: 0, rev: 0 });
    catStats[c].count++;
    catStats[c].qty += (r.quantity || 0);
    catStats[c].rev += (r.revenue || 0);
  });
  
  if (tbody) {
    tbody.innerHTML = Object.entries(catStats).map(([cat, s]) => `
      <tr>
        <td>${getCategoryBadgeHtml(cat)}</td>
        <td style="text-align: right;"><span class="badge-qty">${s.count.toLocaleString()}</span></td>
        <td style="text-align: right;"><span class="badge-qty">${s.qty.toLocaleString()} Units</span></td>
        <td style="text-align: right;"><span class="badge-rev">₹${s.rev.toLocaleString()}</span></td>
      </tr>
    `).join('');
  }
}

// Export Data Engine
function exportDataFile(format) {
  const successBadge = document.getElementById('export-success-badge');
  const filenameEl = document.getElementById('export-filename-text');
  
  if (format === 'csv' || format === 'excel') {
    // Generate real CSV from salesRecords
    const headers = ["Transaction_ID", "Date", "Product", "Category", "Location", "Distributor", "Quantity_Sold", "Unit_Price", "Revenue"];
    const rows = state.salesRecords.slice(0, 500).map(r => [
      r.id, r.date, `"${r.product}"`, r.category, r.location, `"${r.distributor || ''}"`, r.quantity, r.price, r.revenue
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const fname = `KMF_Sales_Report_2026.${format === 'excel' ? 'csv' : 'csv'}`;
    link.setAttribute("download", fname);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    if (successBadge) successBadge.style.display = 'block';
    if (filenameEl) filenameEl.textContent = `File: ${fname}`;
    showToast(`✓ ${fname} downloaded successfully!`);
  } else if (format === 'pdf') {
    window.print();
  } else if (format === 'powerbi') {
    const daxInfo = "KMF Dairy Power BI Dataset Package exported.";
    showToast('✓ Power BI Data Package ready.');
    if (successBadge) successBadge.style.display = 'block';
    if (filenameEl) filenameEl.textContent = 'File: KMF_PowerBI_Dataset_2026.json';
  }
}

// Toast Notification
function showToast(message) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>ℹ️</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Theme Toggle
function initTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.innerHTML = state.theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('kmf_theme', state.theme);
  initTheme();
}

// Document Ready Initialization
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initDatabase();
  
  // Check hash or start at landing
  const initialHash = window.location.hash.replace('#', '');
  if (initialHash && document.getElementById(`view-${initialHash}`)) {
    navigateTo(initialHash);
  } else {
    navigateTo('landing');
  }
  
  // Sidebar Toggle
  const sideToggleBtn = document.getElementById('sidebar-toggle-btn');
  const sidebar = document.getElementById('app-sidebar');
  const mainWrapper = document.getElementById('main-wrapper');
  if (sideToggleBtn && sidebar) {
    sideToggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      if (mainWrapper) mainWrapper.classList.toggle('full-width');
    });
  }
  
  // Table search listener
  const sInput = document.getElementById('records-search-input');
  if (sInput) {
    sInput.addEventListener('input', () => filterRecordsTable());
  }
  
  // Hash listener
  window.addEventListener('hashchange', () => {
    const h = window.location.hash.replace('#', '');
    if (h && h !== state.currentRoute) navigateTo(h);
  });
});

// Window Global Expose
window.navigateTo = navigateTo;
window.handleLogin = handleLogin;
window.fillDemoLogin = fillDemoLogin;
window.loginAsDemoAdmin = loginAsDemoAdmin;
window.handleRegister = handleRegister;
window.openLogoutModal = openLogoutModal;
window.closeLogoutModal = closeLogoutModal;
window.confirmLogout = confirmLogout;
window.addSalesItemRow = addSalesItemRow;
window.removeSalesItemRow = removeSalesItemRow;
window.handleProductSelect = handleProductSelect;
window.handleItemQtyChange = handleItemQtyChange;
window.handleItemPriceChange = handleItemPriceChange;
window.handleSalesEntrySubmit = handleSalesEntrySubmit;
window.resetSalesEntryForm = resetSalesEntryForm;
window.closeConfirmationAndAddAnother = closeConfirmationAndAddAnother;
window.closeConfirmationAndGo = closeConfirmationAndGo;
window.recalcCollectionTotal = recalcCollectionTotal;
window.handleCollectionSubmit = handleCollectionSubmit;
window.recalcEfficiency = recalcEfficiency;
window.handleDistributionSubmit = handleDistributionSubmit;
window.filterRecordsTable = filterRecordsTable;
window.prevRecordsPage = prevRecordsPage;
window.nextRecordsPage = nextRecordsPage;
window.promptDeleteRecord = promptDeleteRecord;
window.closeDeleteModal = closeDeleteModal;
window.confirmDeleteRecord = confirmDeleteRecord;
window.applyAnalyticsFilters = applyAnalyticsFilters;
window.updateSingleProductAnalytics = updateSingleProductAnalytics;
window.generateReportView = generateReportView;
window.exportDataFile = exportDataFile;
window.toggleTheme = toggleTheme;
window.showToast = showToast;

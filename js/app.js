// ═══════════════════════════════════════════
//  SmartCampus — app.js  (v5 — responsive)
// ═══════════════════════════════════════════

const NAV_ITEMS = [
  { section: 'OVERVIEW', items: [
    { id: 'dashboard',             label: 'Dashboard',             icon: 'ti-dashboard',        roles: ['admin','faculty','student'] },
    { id: 'users',                 label: 'User Management',       icon: 'ti-users-group',      roles: ['admin'] },
    { id: 'rooms',                 label: 'Room Management',       icon: 'ti-building',         roles: ['admin'] },
  ]},
  { section: 'MANAGE', items: [
    { id: 'faculty-attendance',    label: 'Attendance Logs',       icon: 'ti-clipboard-list',   roles: ['faculty'] },
    { id: 'faculty-announcements', label: 'Announcements',         icon: 'ti-speakerphone',     roles: ['faculty'] },
    { id: 'csv',                   label: 'CSV Import',            icon: 'ti-file-spreadsheet', roles: ['admin'] },
  ]},
  { section: 'REQUESTS', items: [
    { id: 'faculty-requisitions',  label: 'Room Requisition',      icon: 'ti-door-enter',       roles: ['faculty'] },
    { id: 'requisitions',          label: 'Requisition Approvals', icon: 'ti-door-enter',       roles: ['admin'] },
  ]},
];

let currentPage  = 'dashboard';
let loggedInUser = null;

// ── Build sidebar nav ──
function buildNav(role) {
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = '';

  const merged = {};
  NAV_ITEMS.forEach(group => {
    const key = group.section;
    if (!merged[key]) merged[key] = [];
    group.items.filter(i => i.roles.includes(role)).forEach(i => merged[key].push(i));
  });

  Object.entries(merged).forEach(([section, items]) => {
    if (!items.length) return;
    const sectionEl = document.createElement('div');
    sectionEl.className = 'nav-group';
    sectionEl.innerHTML = `<div class="nav-section-label">${section}</div>`;
    items.forEach(item => {
      const a = document.createElement('a');
      a.className    = 'nav-item' + (item.id === currentPage ? ' active' : '');
      a.dataset.page = item.id;
      a.innerHTML    = `<i class="ti ${item.icon}"></i><span>${item.label}</span>`;
      a.onclick      = () => navigateTo(item.id);
      sectionEl.appendChild(a);
    });
    nav.appendChild(sectionEl);
  });
}

// ── Navigate to a page ──
function navigateTo(pageId) {
  currentPage = pageId;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === pageId);
  });

  const main = document.getElementById('main-content');
  const role = loggedInUser?.role;

  // Scroll to top
  main.scrollTo({ top: 0, behavior: 'smooth' });

  if      (pageId === 'dashboard')            { role === 'faculty' ? renderFacultyDashboard(main) : renderDashboard(main); }
  else if (pageId === 'users')                renderUsersPage(main);
  else if (pageId === 'rooms')                renderRoomsPage(main);
  else if (pageId === 'csv')                  renderCsvImportPage(main);
  else if (pageId === 'faculty-attendance')   renderFacultyAttendance(main);
  else if (pageId === 'faculty-announcements')renderFacultyAnnouncements(main);
  else if (pageId === 'faculty-requisitions') renderFacultyRequisitions(main);
  else if (pageId === 'requisitions')         renderRequisitionsPage(main);
  else                                        renderPlaceholder(main, pageId);
}

function renderPlaceholder(main, pageId) {
  main.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">${pageId.charAt(0).toUpperCase() + pageId.slice(1)}</h1>
        <p class="page-subtitle">Coming soon</p>
      </div>
    </div>
    <div class="empty-state">
      <i class="ti ti-tools"></i>
      <h3>Under Construction</h3>
      <p>This page is not yet implemented.</p>
    </div>`;
}

// ── Modal helpers ──
function openModal(id)  { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function modalBgClick(e, id) { if (e.target === e.currentTarget) closeModal(id); }

// ── Toast notification ──
function showToast(msg, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'success' ? 'ti-circle-check' : type === 'error' ? 'ti-circle-x' : 'ti-info-circle';
  toast.innerHTML = `<i class="ti ${icon}"></i><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3500);
}

// ── Logout ──
function logout() {
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  loggedInUser = null;
  currentPage  = 'dashboard';
}

// ── Init after login ──
window.addEventListener('DOMContentLoaded', () => {
  const origLogin = window.doLogin;
  window.doLogin  = async function () {
    await origLogin();
    const app = document.getElementById('app');
    if (app.style.display === 'flex') {
      loggedInUser = window._lastLoginUser || { role: currentRole };
      buildNav(loggedInUser.role);
      navigateTo('dashboard');
    }
  };
});

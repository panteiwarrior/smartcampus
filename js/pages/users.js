// ═══════════════════════════════════════════
//  users.js — User Management CRUD page
// ═══════════════════════════════════════════

let allUsers       = [];
let editingUserId  = null;
let deletingUserId = null;

// ── Render the page shell ──
async function renderUsersPage(main) {
  main.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">User Management</h1>
        <p class="page-subtitle">Create, manage, and monitor system users.</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openAddUser()">
          <i class="ti ti-user-plus"></i> Add User
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="filter-bar">
      <div class="search-wrap">
        <i class="ti ti-search search-icon"></i>
        <input type="text" id="user-search" class="search-input" placeholder="Search name, email, ID…" oninput="filterUsers()" />
      </div>
      <select id="filter-role" class="filter-select" onchange="filterUsers()">
        <option value="">All Roles</option>
        <option value="student">Student</option>
        <option value="faculty">Faculty</option>
        <option value="admin">Admin</option>
      </select>
      <select id="filter-status" class="filter-select" onchange="filterUsers()">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      <div class="filter-count" id="user-count">Loading…</div>
    </div>

    <!-- Table -->
    <div class="card">
      <div class="card-body p-0">
        <table class="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>ID Number</th>
              <th>Department</th>
              <th>Section</th>
              <th>NFC</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="users-tbody">
            <tr><td colspan="8" class="empty-row"><i class="ti ti-loader-2 spin"></i> Loading users…</td></tr>
          </tbody>
        </table>
      </div>
    </div>`;

  await loadUsers();
}

// ── Fetch all users from API ──
async function loadUsers() {
  try {
    const res  = await fetch('/api/users');
    const data = await res.json();
    if (data.success) {
      allUsers = data.data;
      filterUsers();
    }
  } catch (err) {
    document.getElementById('users-tbody').innerHTML =
      `<tr><td colspan="8" class="empty-row text-danger"><i class="ti ti-wifi-off"></i> Failed to load users.</td></tr>`;
  }
}

// ── Filter + render table ──
function filterUsers() {
  const search = (document.getElementById('user-search')?.value || '').toLowerCase();
  const role   = document.getElementById('filter-role')?.value   || '';
  const status = document.getElementById('filter-status')?.value || '';

  const filtered = allUsers.filter(u => {
    const matchSearch = !search ||
      `${u.first_name} ${u.last_name} ${u.email} ${u.id_number}`.toLowerCase().includes(search);
    const matchRole   = !role   || u.role   === role;
    const matchStatus = !status || u.status === status;
    return matchSearch && matchRole && matchStatus;
  });

  document.getElementById('user-count').textContent =
    `${filtered.length} of ${allUsers.length} user${allUsers.length !== 1 ? 's' : ''}`;

  const tbody = document.getElementById('users-tbody');
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-row"><i class="ti ti-mood-empty"></i> No users found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(u => `
    <tr>
      <td>
        <div class="user-cell">
          <div class="avatar-sm avatar-${u.role}">${(u.first_name[0] + u.last_name[0]).toUpperCase()}</div>
          <div>
            <div class="cell-name">${u.first_name} ${u.last_name}</div>
            <div class="cell-sub">${u.email}</div>
          </div>
        </div>
      </td>
      <td><span class="badge badge-${u.role}">${u.role}</span></td>
      <td><code>${u.id_number}</code></td>
      <td>${u.department || '—'}</td>
      <td>${u.section || '—'}</td>
      <td>
        ${u.nfc_uid
          ? `<span class="nfc-tag"><i class="ti ti-wifi"></i> ${u.nfc_uid}</span>`
          : `<span class="text-muted">—</span>`}
      </td>
      <td>
        <button class="status-toggle ${u.status === 'active' ? 'toggle-active' : 'toggle-inactive'}"
          onclick="toggleStatus('${u._id}','${u.first_name} ${u.last_name}','${u.status}')">
          <span class="status-dot ${u.status === 'active' ? 'dot-active' : 'dot-inactive'}"></span>
          ${u.status}
        </button>
      </td>
      <td>
        <div class="action-btns">
          <button class="btn-icon btn-view"   title="View"   onclick="openViewUser('${u._id}')"><i class="ti ti-eye"></i></button>
          <button class="btn-icon btn-edit"   title="Edit"   onclick="openEditUser('${u._id}')"><i class="ti ti-edit"></i></button>
          <button class="btn-icon btn-delete" title="Delete" onclick="openDeleteUser('${u._id}','${u.first_name} ${u.last_name}')"><i class="ti ti-trash"></i></button>
        </div>
      </td>
    </tr>`).join('');
}

// ══════════════════════════════════════
//  ADD USER
// ══════════════════════════════════════
function openAddUser() {
  editingUserId = null;
  clearUserForm();
  document.getElementById('modal-user-title').textContent = 'Add New User';
  document.getElementById('pw-hint').style.display = 'none';
  document.getElementById('f-password').placeholder  = 'Min. 6 characters';
  document.getElementById('modal-error').style.display = 'none';
  openModal('modal-user');
}

// ══════════════════════════════════════
//  EDIT USER
// ══════════════════════════════════════
function openEditUser(id) {
  const user = allUsers.find(u => u._id === id);
  if (!user) return;
  editingUserId = id;
  clearUserForm();

  document.getElementById('modal-user-title').textContent  = 'Edit User';
  document.getElementById('pw-hint').style.display         = 'inline';
  document.getElementById('f-password').placeholder        = 'Leave blank to keep current';
  document.getElementById('modal-error').style.display     = 'none';

  document.getElementById('f-first-name').value     = user.first_name     || '';
  document.getElementById('f-last-name').value      = user.last_name      || '';
  document.getElementById('f-id-number').value      = user.id_number      || '';
  document.getElementById('f-email').value          = user.email          || '';
  document.getElementById('f-role').value           = user.role           || 'student';
  document.getElementById('f-department').value     = user.department     || 'BSCS';
  document.getElementById('f-section').value        = user.section        || '';
  document.getElementById('f-nfc-uid').value        = user.nfc_uid        || '';
  document.getElementById('f-fingerprint-id').value = user.fingerprint_id != null ? user.fingerprint_id : '';

  toggleSectionField();
  openModal('modal-user');
}

// ══════════════════════════════════════
//  SAVE USER (Create or Update)
// ══════════════════════════════════════
async function saveUser() {
  const errBox = document.getElementById('modal-error');
  errBox.style.display = 'none';

  const payload = {
    first_name:     document.getElementById('f-first-name').value.trim(),
    last_name:      document.getElementById('f-last-name').value.trim(),
    id_number:      document.getElementById('f-id-number').value.trim(),
    email:          document.getElementById('f-email').value.trim(),
    role:           document.getElementById('f-role').value,
    department:     document.getElementById('f-department').value,
    section:        document.getElementById('f-section').value.trim(),
    nfc_uid:        document.getElementById('f-nfc-uid').value.trim(),
    fingerprint_id: document.getElementById('f-fingerprint-id').value || null,
  };

  const pw = document.getElementById('f-password').value;
  if (pw) payload.password = pw;

  // ── FIX: Frontend validation with specific messages ──
  if (!payload.first_name || !payload.last_name || !payload.id_number || !payload.email) {
    showError(errBox, 'Please fill in all required fields.');
    return;
  }
  if (!payload.email.match(/^\S+@\S+\.\S+$/)) {
    showError(errBox, 'Please enter a valid email address.');
    return;
  }
  if (!editingUserId && !pw) {
    showError(errBox, 'Password is required for new users.');
    return;
  }
  if (pw && pw.length < 6) {
    showError(errBox, 'Password must be at least 6 characters.');
    return;
  }

  const btn = document.getElementById('modal-save-btn');
  btn.disabled  = true;
  btn.innerHTML = '<i class="ti ti-loader-2 spin"></i> Saving…';

  try {
    const url    = editingUserId ? `/api/users/${editingUserId}` : '/api/users';
    const method = editingUserId ? 'PUT' : 'POST';

    const res  = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!data.success) {
      // ── FIX: Handle both { message } and { errors: [...] } server responses ──
      const msg = data.message
        || (data.errors?.map(e => e.msg).join(', '))
        || 'An error occurred.';
      showError(errBox, msg);
      return;
    }

    closeModal('modal-user');
    showToast(editingUserId ? 'User updated successfully!' : 'User created successfully!', 'success');
    await loadUsers();

  } catch (err) {
    showError(errBox, 'Network error. Please try again.');
  } finally {
    btn.disabled  = false;
    btn.innerHTML = '<i class="ti ti-device-floppy"></i> Save User';
  }
}

// ── Helper: show error in modal error box ──
function showError(errBox, message) {
  errBox.textContent   = message;
  errBox.style.display = 'block';
}

// ══════════════════════════════════════
//  DELETE USER
// ══════════════════════════════════════
function openDeleteUser(id, name) {
  deletingUserId = id;
  document.getElementById('delete-user-name').textContent = name;
  openModal('modal-delete');
}

async function confirmDelete() {
  if (!deletingUserId) return;
  const btn = document.getElementById('confirm-delete-btn');
  btn.disabled  = true;
  btn.innerHTML = '<i class="ti ti-loader-2 spin"></i> Deleting…';

  try {
    const res  = await fetch(`/api/users/${deletingUserId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      closeModal('modal-delete');
      showToast('User deleted successfully.', 'success');
      await loadUsers();
    } else {
      showToast(data.message || 'Delete failed.', 'error');
    }
  } catch (err) {
    showToast('Network error.', 'error');
  } finally {
    btn.disabled  = false;
    btn.innerHTML = '<i class="ti ti-trash"></i> Yes, Delete';
    deletingUserId = null;
  }
}

// ══════════════════════════════════════
//  VIEW USER
// ══════════════════════════════════════
function openViewUser(id) {
  const u = allUsers.find(u => u._id === id);
  if (!u) return;

  document.getElementById('modal-view-content').innerHTML = `
    <div class="view-profile">
      <div class="view-avatar avatar-${u.role}">${(u.first_name[0] + u.last_name[0]).toUpperCase()}</div>
      <div class="view-name">${u.first_name} ${u.last_name}</div>
      <div class="view-badges">
        <span class="badge badge-${u.role}">${u.role}</span>
        <span class="status-dot ${u.status === 'active' ? 'dot-active' : 'dot-inactive'}"></span>
        <span>${u.status}</span>
      </div>
    </div>
    <div class="view-grid">
      <div class="view-field"><span class="view-label">ID Number</span><span class="view-value"><code>${u.id_number}</code></span></div>
      <div class="view-field"><span class="view-label">Email</span><span class="view-value">${u.email}</span></div>
      <div class="view-field"><span class="view-label">Department</span><span class="view-value">${u.department || '—'}</span></div>
      <div class="view-field"><span class="view-label">Section</span><span class="view-value">${u.section || '—'}</span></div>
      <div class="view-field"><span class="view-label">NFC UID</span><span class="view-value">${u.nfc_uid || '—'}</span></div>
      <div class="view-field"><span class="view-label">Fingerprint ID</span><span class="view-value">${u.fingerprint_id != null ? u.fingerprint_id : '—'}</span></div>
      <div class="view-field"><span class="view-label">Created</span><span class="view-value">${new Date(u.createdAt).toLocaleString('en-PH')}</span></div>
      <div class="view-field"><span class="view-label">Last Updated</span><span class="view-value">${new Date(u.updatedAt).toLocaleString('en-PH')}</span></div>
    </div>`;

  document.getElementById('view-edit-btn').onclick = () => {
    closeModal('modal-view');
    openEditUser(id);
  };

  openModal('modal-view');
}

// ══════════════════════════════════════
//  TOGGLE STATUS
// ══════════════════════════════════════
async function toggleStatus(id, name, currentStatus) {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  try {
    const res  = await fetch(`/api/users/${id}/status`, { method: 'PATCH' });
    const data = await res.json();
    if (data.success) {
      showToast(`${name} set to ${newStatus}.`, 'success');
      await loadUsers();
    }
  } catch (err) {
    showToast('Failed to update status.', 'error');
  }
}

// ══════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════
function clearUserForm() {
  ['f-first-name','f-last-name','f-id-number','f-email',
   'f-section','f-nfc-uid','f-fingerprint-id','f-password'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('f-role').value       = 'student';
  document.getElementById('f-department').value = 'BSCS';
  toggleSectionField();
}

function toggleSectionField() {
  const role    = document.getElementById('f-role')?.value;
  const section = document.getElementById('section-field');
  if (section) section.style.display = role === 'student' ? '' : 'none';
}
// ═══════════════════════════════════════════
//  admin-requisitions.js — Requisition Approvals (Admin)
// ═══════════════════════════════════════════

let adminAllReqs = [];
let actioningReqId = null;
let actioningReqAction = null;

async function renderRequisitionsPage(main) {
  main.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Requisition Approvals</h1>
        <p class="page-subtitle">Review and manage room requests from faculty members.</p>
      </div>
      <div class="page-actions">
        <div class="live-badge"><span class="live-dot"></span> Live</div>
      </div>
    </div>

    <!-- Stats row -->
    <div class="att-summary-row mb-2" style="grid-template-columns:repeat(3,1fr)">
      <div class="att-summary-card">
        <div class="att-summary-icon" style="color:var(--warning)"><i class="ti ti-clock"></i></div>
        <div class="att-summary-value" id="rstat-pending">—</div>
        <div class="att-summary-label">Pending</div>
      </div>
      <div class="att-summary-card">
        <div class="att-summary-icon" style="color:var(--success)"><i class="ti ti-circle-check"></i></div>
        <div class="att-summary-value" id="rstat-approved">—</div>
        <div class="att-summary-label">Approved</div>
      </div>
      <div class="att-summary-card">
        <div class="att-summary-icon" style="color:var(--danger)"><i class="ti ti-circle-x"></i></div>
        <div class="att-summary-value" id="rstat-denied">—</div>
        <div class="att-summary-label">Denied</div>
      </div>
    </div>

    <!-- Action modal -->
    <div class="modal-overlay" id="modal-req-action" onclick="if(event.target===this)closeModal('modal-req-action')">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h3 id="req-action-title">Approve Request</h3>
          <button class="modal-close" onclick="closeModal('modal-req-action')"><i class="ti ti-x"></i></button>
        </div>
        <div id="req-action-summary" style="background:var(--surface2);border-radius:var(--radius);padding:.875rem 1rem;margin-bottom:1rem;font-size:13px;color:var(--text2)"></div>
        <div class="form-group">
          <label>Remarks <span style="color:var(--text3)">(optional)</span></label>
          <input type="text" id="req-action-remarks" placeholder="Leave a note for the faculty…" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" onclick="closeModal('modal-req-action')">Cancel</button>
          <button class="btn" id="req-action-confirm-btn" onclick="confirmReqAction()">Confirm</button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card mb-2">
      <div class="card-body" style="padding:.875rem 1.25rem">
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label">Status</label>
            <select class="filter-select" id="admin-req-filter" onchange="applyAdminReqFilter()">
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
            </select>
          </div>
          <div class="filter-group" style="align-self:flex-end">
            <button class="btn btn-ghost btn-sm" onclick="document.getElementById('admin-req-filter').value='';applyAdminReqFilter()">
              <i class="ti ti-refresh"></i> Reset
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title"><i class="ti ti-door-enter"></i> All Requests</h3>
      </div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead>
            <tr>
              <th>Faculty</th>
              <th>Room</th>
              <th>Purpose</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="admin-req-table">
            <tr><td colspan="7" class="empty-row"><i class="ti ti-loader-2 spin"></i> Loading…</td></tr>
          </tbody>
        </table>
      </div>
    </div>`;

  await loadAdminReqs();
}

async function loadAdminReqs() {
  try {
    const res  = await fetch('/api/requisitions');
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    adminAllReqs = data.data;
    updateReqStats(adminAllReqs);
    renderAdminReqTable(adminAllReqs);
  } catch (err) {
    const tbody = document.getElementById('admin-req-table');
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="empty-row">${err.message}</td></tr>`;
  }
}

function updateReqStats(data) {
  const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  set('rstat-pending',  data.filter(r => r.status === 'pending').length);
  set('rstat-approved', data.filter(r => r.status === 'approved').length);
  set('rstat-denied',   data.filter(r => r.status === 'denied').length);
}

function applyAdminReqFilter() {
  const status = document.getElementById('admin-req-filter')?.value || '';
  const filtered = status ? adminAllReqs.filter(r => r.status === status) : adminAllReqs;
  renderAdminReqTable(filtered);
}

function renderAdminReqTable(list) {
  const tbody = document.getElementById('admin-req-table');
  if (!tbody) return;
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-row">No requests found.</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(r => `
    <tr>
      <td>
        <div class="user-cell">
          <div class="avatar-sm">${r.faculty_name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}</div>
          <div>
            <div class="cell-name">${r.faculty_name}</div>
            <div class="cell-sub">${r.department || 'Faculty'}</div>
          </div>
        </div>
      </td>
      <td><strong>${r.room_name}</strong></td>
      <td>${r.purpose}</td>
      <td>${r.date_needed}</td>
      <td>${r.time_start} – ${r.time_end}</td>
      <td><span class="badge badge-status-${r.status}">${r.status}</span></td>
      <td>
        ${r.status === 'pending' ? `
          <div style="display:flex;gap:.35rem">
            <button class="btn btn-sm" style="background:rgba(29,158,117,.15);border:1px solid rgba(29,158,117,.3);color:var(--success);cursor:pointer;border-radius:7px;padding:6px 10px;font-size:12px;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:4px;transition:all .2s" onmouseover="this.style.background='rgba(29,158,117,.25)'" onmouseout="this.style.background='rgba(29,158,117,.15)'" onclick="openReqActionModal('${r._id}','approved','${r.room_name}','${r.faculty_name}','${r.date_needed}')">
              <i class="ti ti-check"></i> Approve
            </button>
            <button class="btn btn-sm btn-danger" onclick="openReqActionModal('${r._id}','denied','${r.room_name}','${r.faculty_name}','${r.date_needed}')">
              <i class="ti ti-x"></i> Deny
            </button>
          </div>` : `<span style="font-size:12px;color:var(--text3)">—</span>`}
      </td>
    </tr>`).join('');
}

function openReqActionModal(id, action, room, faculty, date) {
  actioningReqId     = id;
  actioningReqAction = action;

  document.getElementById('req-action-title').textContent = action === 'approved' ? 'Approve Request' : 'Deny Request';
  document.getElementById('req-action-summary').innerHTML = `
    <strong>${faculty}</strong> is requesting <strong>${room}</strong> on <strong>${date}</strong>.`;
  document.getElementById('req-action-remarks').value = '';

  const confirmBtn = document.getElementById('req-action-confirm-btn');
  if (action === 'approved') {
    confirmBtn.style.cssText = 'background:rgba(29,158,117,.2);border:1px solid rgba(29,158,117,.4);color:var(--success);cursor:pointer;font-family:"DM Sans",sans-serif;padding:10px 20px;border-radius:var(--radius);font-size:14px;font-weight:600';
    confirmBtn.innerHTML = '<i class="ti ti-circle-check"></i> Approve';
  } else {
    confirmBtn.style.cssText = 'background:rgba(226,75,74,.15);border:1px solid rgba(226,75,74,.35);color:var(--danger);cursor:pointer;font-family:"DM Sans",sans-serif;padding:10px 20px;border-radius:var(--radius);font-size:14px;font-weight:600';
    confirmBtn.innerHTML = '<i class="ti ti-circle-x"></i> Deny';
  }

  openModal('modal-req-action');
}

async function confirmReqAction() {
  if (!actioningReqId || !actioningReqAction) return;
  const remarks = document.getElementById('req-action-remarks').value.trim();
  const btn     = document.getElementById('req-action-confirm-btn');
  btn.disabled  = true;

  try {
    const res  = await fetch(`/api/requisitions/${actioningReqId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: actioningReqAction, admin_remarks: remarks }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    closeModal('modal-req-action');
    showToast(`Request ${actioningReqAction}!`, actioningReqAction === 'approved' ? 'success' : 'error');
    await loadAdminReqs();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    actioningReqId = actioningReqAction = null;
  }
}

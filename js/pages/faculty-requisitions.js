// ═══════════════════════════════════════════
//  faculty-requisitions.js — Room Requisitions
// ═══════════════════════════════════════════

let allReqs = [];
let deletingReqId = null;

async function renderFacultyRequisitions(main) {
  const user = window.loggedInUser || {};

  main.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Room Requisition</h1>
        <p class="page-subtitle">Request a room for classes, events, or activities.</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openReqModal()">
          <i class="ti ti-plus"></i> New Request
        </button>
      </div>
    </div>

    <!-- Modal: Create Request -->
    <div class="modal-overlay" id="modal-req" onclick="if(event.target===this)closeReqModal()">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>New Room Request</h3>
          <button class="modal-close" onclick="closeReqModal()"><i class="ti ti-x"></i></button>
        </div>
        <div id="req-modal-error" class="alert alert-danger" style="display:none;margin-bottom:1rem"></div>
        <div class="form-row mb-1">
          <div class="field">
            <label>Room *</label>
            <select id="req-room">
              <option value="">— Select Room —</option>
              <option>Room 101</option>
              <option>Room 102</option>
              <option>Room 201</option>
              <option>Room 202</option>
              <option>Lab A</option>
              <option>Lab B</option>
              <option>Auditorium</option>
              <option>Conference Room</option>
            </select>
          </div>
          <div class="field">
            <label>Purpose *</label>
            <input type="text" id="req-purpose" placeholder="e.g. Midterm Examination" />
          </div>
        </div>
        <div class="form-row mb-1">
          <div class="field">
            <label>Date Needed *</label>
            <input type="date" id="req-date" min="${new Date().toISOString().split('T')[0]}" />
          </div>
          <div class="field">
            <label>Time Start *</label>
            <input type="time" id="req-time-start" />
          </div>
          <div class="field">
            <label>Time End *</label>
            <input type="time" id="req-time-end" />
          </div>
        </div>
        <div class="form-group">
          <label>Additional Notes</label>
          <textarea id="req-notes" rows="3" placeholder="Any special requirements or notes…" style="width:100%;background:var(--surface2);border:1px solid var(--surface3);border-radius:var(--radius);padding:11px 14px;color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;resize:vertical;transition:border .2s" onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--surface3)'"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" onclick="closeReqModal()">Cancel</button>
          <button class="btn btn-primary" id="req-save-btn" onclick="submitRequisition()">
            <i class="ti ti-send"></i> Submit Request
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm delete modal -->
    <div class="modal-overlay" id="modal-req-delete" onclick="if(event.target===this)closeModal('modal-req-delete')">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h3>Cancel Request</h3>
          <button class="modal-close" onclick="closeModal('modal-req-delete')"><i class="ti ti-x"></i></button>
        </div>
        <div class="alert alert-danger"><i class="ti ti-alert-triangle"></i> This cannot be undone.</div>
        <p style="font-size:14px;color:var(--text2);margin-bottom:1.5rem">Are you sure you want to cancel this room request?</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" onclick="closeModal('modal-req-delete')">No, Keep It</button>
          <button class="btn btn-danger" id="req-confirm-delete" onclick="confirmDeleteReq()">
            <i class="ti ti-trash"></i> Yes, Cancel It
          </button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card mb-2">
      <div class="card-body" style="padding:.875rem 1.25rem">
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label">Status</label>
            <select class="filter-select" id="req-filter-status" onchange="applyReqFilter()">
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
            </select>
          </div>
          <div class="filter-group" style="align-self:flex-end">
            <button class="btn btn-ghost btn-sm" onclick="document.getElementById('req-filter-status').value='';applyReqFilter()">
              <i class="ti ti-refresh"></i> Reset
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Request cards -->
    <div id="req-list-container">
      <div class="empty-row"><i class="ti ti-loader-2 spin"></i> Loading...</div>
    </div>`;

  await loadRequisitions(user);
}

function openReqModal() {
  document.getElementById('req-room').value       = '';
  document.getElementById('req-purpose').value    = '';
  document.getElementById('req-date').value       = '';
  document.getElementById('req-time-start').value = '';
  document.getElementById('req-time-end').value   = '';
  document.getElementById('req-notes').value      = '';
  document.getElementById('req-modal-error').style.display = 'none';
  document.getElementById('modal-req').classList.add('active');
}

function closeReqModal() {
  document.getElementById('modal-req').classList.remove('active');
}

async function submitRequisition() {
  const user      = window.loggedInUser || {};
  const room      = document.getElementById('req-room').value.trim();
  const purpose   = document.getElementById('req-purpose').value.trim();
  const date      = document.getElementById('req-date').value;
  const timeStart = document.getElementById('req-time-start').value;
  const timeEnd   = document.getElementById('req-time-end').value;
  const notes     = document.getElementById('req-notes').value.trim();
  const errBox    = document.getElementById('req-modal-error');

  if (!room || !purpose || !date || !timeStart || !timeEnd) {
    errBox.style.display = 'block';
    errBox.textContent   = 'Please fill in all required fields.';
    return;
  }
  if (timeEnd <= timeStart) {
    errBox.style.display = 'block';
    errBox.textContent   = 'End time must be after start time.';
    return;
  }

  const btn = document.getElementById('req-save-btn');
  btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader-2 spin"></i> Submitting…';

  try {
    const payload = {
      requested_by: user.username || user.name || 'faculty',
      faculty_name: user.name     || 'Faculty Member',
      department:   user.department || '',
      room_name:    room,
      purpose,
      date_needed:  date,
      time_start:   timeStart,
      time_end:     timeEnd,
      notes,
    };
    const res  = await fetch('/api/requisitions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to submit request.');
    closeReqModal();
    showToast('Room request submitted!', 'success');
    await loadRequisitions(user);
  } catch (err) {
    errBox.style.display = 'block';
    errBox.textContent   = err.message;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="ti ti-send"></i> Submit Request';
  }
}

async function loadRequisitions(user) {
  const container = document.getElementById('req-list-container');
  if (!container) return;
  try {
    const res  = await fetch('/api/requisitions');
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    allReqs = data.data.filter(r => r.requested_by === (user.username || user.name));
    renderReqList(allReqs);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
}

function applyReqFilter() {
  const status = document.getElementById('req-filter-status')?.value || '';
  const filtered = status ? allReqs.filter(r => r.status === status) : allReqs;
  renderReqList(filtered);
}

function renderReqList(list) {
  const container = document.getElementById('req-list-container');
  if (!container) return;
  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="ti ti-door-enter"></i></div>
        <h3>No Requests Yet</h3>
        <p>You haven't made any room requests. Click <strong>New Request</strong> to get started.</p>
      </div>`;
    return;
  }

  const statusIcon = { pending: 'ti-clock', approved: 'ti-circle-check', denied: 'ti-circle-x' };
  const statusColor = { pending: 'var(--warning)', approved: 'var(--success)', denied: 'var(--danger)' };

  container.innerHTML = `
    <div class="req-list">
      ${list.map(r => `
        <div class="req-card">
          <div class="req-card-status-bar" style="background:${statusColor[r.status]}"></div>
          <div class="req-card-body">
            <div class="req-card-head">
              <div>
                <div class="req-card-room"><i class="ti ti-building"></i> ${r.room_name}</div>
                <div class="req-card-purpose">${r.purpose}</div>
              </div>
              <div style="display:flex;align-items:center;gap:.5rem">
                <span class="badge badge-status-${r.status}">
                  <i class="ti ${statusIcon[r.status]}"></i> ${r.status}
                </span>
                ${r.status === 'pending' ? `
                  <button class="btn btn-sm btn-danger" title="Cancel request" onclick="promptDeleteReq('${r._id}')">
                    <i class="ti ti-x"></i>
                  </button>` : ''}
              </div>
            </div>
            <div class="req-card-details">
              <span><i class="ti ti-calendar"></i> ${r.date_needed}</span>
              <span><i class="ti ti-clock"></i> ${r.time_start} – ${r.time_end}</span>
              <span><i class="ti ti-building-community"></i> ${r.department || 'Faculty'}</span>
            </div>
            ${r.notes ? `<p class="req-card-notes"><i class="ti ti-notes"></i> ${r.notes}</p>` : ''}
            ${r.admin_remarks ? `
              <div class="req-admin-remark">
                <i class="ti ti-message-2"></i>
                <span><strong>Admin:</strong> ${r.admin_remarks}</span>
              </div>` : ''}
            <div class="req-card-footer">
              <span class="req-card-date">Submitted ${new Date(r.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>`).join('')}
    </div>`;
}

function promptDeleteReq(id) {
  deletingReqId = id;
  openModal('modal-req-delete');
}

async function confirmDeleteReq() {
  if (!deletingReqId) return;
  const btn = document.getElementById('req-confirm-delete');
  btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader-2 spin"></i>';
  try {
    const res  = await fetch(`/api/requisitions/${deletingReqId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    closeModal('modal-req-delete');
    showToast('Request cancelled.', 'success');
    const user = window.loggedInUser || {};
    await loadRequisitions(user);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="ti ti-trash"></i> Yes, Cancel It';
    deletingReqId = null;
  }
}

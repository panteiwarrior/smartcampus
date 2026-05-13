// ═══════════════════════════════════════════
//  rooms.js — Room Management (Admin)
// ═══════════════════════════════════════════

let allRooms      = [];
let editingRoomId = null;
let deletingRoomId= null;

async function renderRoomsPage(main) {
  main.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Room Management</h1>
        <p class="page-subtitle">Add, edit, and manage campus rooms and facilities.</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openAddRoom()">
          <i class="ti ti-plus"></i> Add Room
        </button>
      </div>
    </div>

    <!-- ── ADD / EDIT MODAL ── -->
    <div class="modal-overlay" id="modal-room" onclick="if(event.target===this)closeRoomModal()">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3 id="room-modal-title">Add New Room</h3>
          <button class="modal-close" onclick="closeRoomModal()"><i class="ti ti-x"></i></button>
        </div>
        <div id="room-modal-error" class="alert alert-danger" style="display:none;margin-bottom:1rem"></div>
        <div class="form-row mb-1">
          <div class="field">
            <label>Room Code *</label>
            <input type="text" id="r-code" placeholder="e.g. LB-101" style="text-transform:uppercase" oninput="this.value=this.value.toUpperCase()" />
          </div>
          <div class="field">
            <label>Room Name *</label>
            <input type="text" id="r-name" placeholder="e.g. Computer Lab A" />
          </div>
        </div>
        <div class="form-row mb-1">
          <div class="field">
            <label>Type *</label>
            <select id="r-type">
              <option value="Lecture">Lecture Room</option>
              <option value="Laboratory">Laboratory</option>
              <option value="Seminar">Seminar Room</option>
              <option value="Auditorium">Auditorium</option>
              <option value="Conference">Conference Room</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="field">
            <label>Capacity</label>
            <input type="number" id="r-capacity" placeholder="e.g. 40" min="0" />
          </div>
        </div>
        <div class="form-row mb-1">
          <div class="field">
            <label>Building</label>
            <input type="text" id="r-building" placeholder="e.g. Main Building" />
          </div>
          <div class="field">
            <label>Floor</label>
            <input type="text" id="r-floor" placeholder="e.g. 2nd Floor" />
          </div>
        </div>
        <div class="field mb-1">
          <label>Amenities <span style="color:var(--text3);text-transform:none;font-weight:400">(comma-separated)</span></label>
          <input type="text" id="r-amenities" placeholder="e.g. Projector, AC, Whiteboard, HDMI" />
        </div>
        <div class="field mb-1">
          <label>Notes</label>
          <textarea id="r-notes" rows="2" placeholder="Any additional remarks…"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" onclick="closeRoomModal()">Cancel</button>
          <button class="btn btn-primary" id="room-save-btn" onclick="saveRoom()">
            <i class="ti ti-device-floppy"></i> Save Room
          </button>
        </div>
      </div>
    </div>

    <!-- ── VIEW MODAL ── -->
    <div class="modal-overlay" id="modal-room-view" onclick="if(event.target===this)closeModal('modal-room-view')">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>Room Details</h3>
          <button class="modal-close" onclick="closeModal('modal-room-view')"><i class="ti ti-x"></i></button>
        </div>
        <div id="room-view-content"></div>
        <div class="modal-actions">
          <button class="btn btn-ghost" onclick="closeModal('modal-room-view')">Close</button>
          <button class="btn btn-primary" id="room-view-edit-btn"><i class="ti ti-edit"></i> Edit Room</button>
        </div>
      </div>
    </div>

    <!-- ── DELETE MODAL ── -->
    <div class="modal-overlay" id="modal-room-delete" onclick="if(event.target===this)closeModal('modal-room-delete')">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h3>Delete Room</h3>
          <button class="modal-close" onclick="closeModal('modal-room-delete')"><i class="ti ti-x"></i></button>
        </div>
        <div class="alert alert-danger"><i class="ti ti-alert-triangle"></i> This action cannot be undone.</div>
        <p style="font-size:14px;color:var(--text2);margin-bottom:1.5rem">
          Delete room <strong id="room-delete-label" style="color:var(--text)"></strong>? All associated records may be affected.
        </p>
        <div class="modal-actions">
          <button class="btn btn-ghost" onclick="closeModal('modal-room-delete')">Cancel</button>
          <button class="btn btn-danger" id="room-confirm-delete-btn" onclick="confirmDeleteRoom()"><i class="ti ti-trash"></i> Yes, Delete</button>
        </div>
      </div>
    </div>

    <!-- ── Filters ── -->
    <div class="filter-bar">
      <div class="search-wrap">
        <i class="ti ti-search search-icon"></i>
        <input type="text" id="room-search" class="search-input" placeholder="Search code, name, building…" oninput="filterRooms()" />
      </div>
      <select id="filter-room-type" class="filter-select" onchange="filterRooms()">
        <option value="">All Types</option>
        <option>Lecture</option>
        <option>Laboratory</option>
        <option>Seminar</option>
        <option>Auditorium</option>
        <option>Conference</option>
        <option>Other</option>
      </select>
      <select id="filter-room-status" class="filter-select" onchange="filterRooms()">
        <option value="">All Status</option>
        <option value="available">Available</option>
        <option value="unavailable">Unavailable</option>
      </select>
      <div class="filter-count" id="room-count">Loading…</div>
    </div>

    <!-- ── Table ── -->
    <div class="card">
      <div class="card-body" style="padding:0;overflow-x:auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Room</th>
              <th>Type</th>
              <th>Building / Floor</th>
              <th>Capacity</th>
              <th>Amenities</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="rooms-tbody">
            <tr><td colspan="7" class="empty-row"><i class="ti ti-loader-2 spin"></i> Loading rooms…</td></tr>
          </tbody>
        </table>
      </div>
    </div>`;

  await loadRooms();
}

// ── LOAD ──
async function loadRooms() {
  try {
    const res  = await fetch('/api/rooms');
    const data = await res.json();
    if (data.success) { allRooms = data.data; filterRooms(); }
  } catch {
    document.getElementById('rooms-tbody').innerHTML =
      `<tr><td colspan="7" class="empty-row"><i class="ti ti-wifi-off"></i> Failed to load rooms.</td></tr>`;
  }
}

// ── FILTER ──
function filterRooms() {
  const search = (document.getElementById('room-search')?.value || '').toLowerCase();
  const type   = document.getElementById('filter-room-type')?.value   || '';
  const status = document.getElementById('filter-room-status')?.value || '';

  const filtered = allRooms.filter(r => {
    const matchSearch = !search || `${r.room_code} ${r.room_name} ${r.building}`.toLowerCase().includes(search);
    const matchType   = !type   || r.type   === type;
    const matchStatus = !status || r.status === status;
    return matchSearch && matchType && matchStatus;
  });

  document.getElementById('room-count').textContent =
    `${filtered.length} of ${allRooms.length} room${allRooms.length !== 1 ? 's' : ''}`;

  const tbody = document.getElementById('rooms-tbody');
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-row"><i class="ti ti-mood-empty"></i> No rooms found.</td></tr>`;
    return;
  }

  const typeIcon = { Lecture:'ti-school', Laboratory:'ti-flask', Seminar:'ti-users', Auditorium:'ti-building', Conference:'ti-presentation', Other:'ti-door' };
  const typeColor = { Lecture:'var(--accent)', Laboratory:'var(--success)', Seminar:'#c084fc', Auditorium:'var(--gold)', Conference:'var(--warning)', Other:'var(--text3)' };

  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td>
        <div class="user-cell">
          <div class="avatar-sm" style="background:rgba(201,168,76,.12);color:var(--gold);font-size:11px;border-radius:8px">${r.room_code}</div>
          <div>
            <div class="cell-name">${r.room_name}</div>
            <div class="cell-sub">${r.notes || '—'}</div>
          </div>
        </div>
      </td>
      <td>
        <span style="display:inline-flex;align-items:center;gap:5px;font-size:12px;color:${typeColor[r.type]||'var(--text3)'}">
          <i class="ti ${typeIcon[r.type]||'ti-door'}"></i> ${r.type}
        </span>
      </td>
      <td>
        <div class="cell-name">${r.building || '—'}</div>
        <div class="cell-sub">${r.floor || ''}</div>
      </td>
      <td>
        ${r.capacity ? `<span style="font-weight:600;color:var(--text)">${r.capacity}</span><span style="font-size:11px;color:var(--text3)"> seats</span>` : '<span style="color:var(--text3)">—</span>'}
      </td>
      <td>
        <div style="display:flex;flex-wrap:wrap;gap:4px;max-width:200px">
          ${(r.amenities||[]).slice(0,3).map(a => `<span style="font-size:10px;padding:2px 6px;border-radius:4px;background:var(--surface2);border:1px solid var(--surface3);color:var(--text3)">${a}</span>`).join('')}
          ${(r.amenities||[]).length > 3 ? `<span style="font-size:10px;color:var(--text3)">+${r.amenities.length-3}</span>` : ''}
          ${(r.amenities||[]).length === 0 ? '<span style="color:var(--text3);font-size:12px">—</span>' : ''}
        </div>
      </td>
      <td>
        <button class="status-toggle ${r.status === 'available' ? 'toggle-active' : 'toggle-inactive'}"
          onclick="toggleRoomStatus('${r._id}','${r.room_name}','${r.status}')">
          <span class="status-dot ${r.status === 'available' ? 'dot-active' : 'dot-inactive'}"></span>
          ${r.status}
        </button>
      </td>
      <td>
        <div class="action-btns">
          <button class="btn-icon btn-view"   title="View"   onclick="openViewRoom('${r._id}')"><i class="ti ti-eye"></i></button>
          <button class="btn-icon btn-edit"   title="Edit"   onclick="openEditRoom('${r._id}')"><i class="ti ti-edit"></i></button>
          <button class="btn-icon btn-delete" title="Delete" onclick="openDeleteRoom('${r._id}','${r.room_code}')"><i class="ti ti-trash"></i></button>
        </div>
      </td>
    </tr>`).join('');
}

// ── ADD ──
function openAddRoom() {
  editingRoomId = null;
  clearRoomForm();
  document.getElementById('room-modal-title').textContent = 'Add New Room';
  document.getElementById('room-modal-error').style.display = 'none';
  openModal('modal-room');
}

// ── EDIT ──
function openEditRoom(id) {
  const r = allRooms.find(r => r._id === id);
  if (!r) return;
  editingRoomId = id;
  document.getElementById('room-modal-title').textContent = 'Edit Room';
  document.getElementById('room-modal-error').style.display = 'none';
  document.getElementById('r-code').value      = r.room_code     || '';
  document.getElementById('r-name').value      = r.room_name     || '';
  document.getElementById('r-type').value      = r.type          || 'Lecture';
  document.getElementById('r-capacity').value  = r.capacity > 0  ? r.capacity : '';
  document.getElementById('r-building').value  = r.building      || '';
  document.getElementById('r-floor').value     = r.floor         || '';
  document.getElementById('r-amenities').value = (r.amenities||[]).join(', ');
  document.getElementById('r-notes').value     = r.notes         || '';
  openModal('modal-room');
}

// ── SAVE ──
async function saveRoom() {
  const errBox = document.getElementById('room-modal-error');
  errBox.style.display = 'none';

  const code     = document.getElementById('r-code').value.trim().toUpperCase();
  const name     = document.getElementById('r-name').value.trim();
  const type     = document.getElementById('r-type').value;
  const capacity = parseInt(document.getElementById('r-capacity').value) || 0;
  const building = document.getElementById('r-building').value.trim();
  const floor    = document.getElementById('r-floor').value.trim();
  const amenRaw  = document.getElementById('r-amenities').value.trim();
  const amenities= amenRaw ? amenRaw.split(',').map(a => a.trim()).filter(Boolean) : [];
  const notes    = document.getElementById('r-notes').value.trim();

  if (!code || !name) {
    errBox.style.display = 'block';
    errBox.textContent   = 'Room code and room name are required.';
    return;
  }

  const btn = document.getElementById('room-save-btn');
  btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader-2 spin"></i> Saving…';

  try {
    const payload = { room_code: code, room_name: name, type, capacity, building, floor, amenities, notes };
    const url     = editingRoomId ? `/api/rooms/${editingRoomId}` : '/api/rooms';
    const method  = editingRoomId ? 'PUT' : 'POST';
    const res     = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data    = await res.json();
    if (!data.success) { errBox.style.display = 'block'; errBox.textContent = data.message; return; }
    closeRoomModal();
    showToast(editingRoomId ? 'Room updated!' : 'Room added!', 'success');
    await loadRooms();
  } catch {
    errBox.style.display = 'block'; errBox.textContent = 'Network error.';
  } finally {
    btn.disabled = false; btn.innerHTML = '<i class="ti ti-device-floppy"></i> Save Room';
  }
}

function closeRoomModal() { closeModal('modal-room'); editingRoomId = null; }

// ── VIEW ──
function openViewRoom(id) {
  const r = allRooms.find(r => r._id === id);
  if (!r) return;

  const typeIcon = { Lecture:'ti-school', Laboratory:'ti-flask', Seminar:'ti-users', Auditorium:'ti-building', Conference:'ti-presentation', Other:'ti-door' };

  document.getElementById('room-view-content').innerHTML = `
    <div class="view-profile">
      <div class="view-avatar" style="background:rgba(201,168,76,.12);color:var(--gold);font-size:16px;font-weight:800;border-radius:14px">
        <i class="ti ${typeIcon[r.type]||'ti-door'}" style="font-size:28px"></i>
      </div>
      <div class="view-name">${r.room_name}</div>
      <div class="view-badges">
        <code>${r.room_code}</code>
        <span class="status-dot ${r.status==='available'?'dot-active':'dot-inactive'}"></span>
        <span style="font-size:12px;color:var(--text3)">${r.status}</span>
      </div>
    </div>
    <div class="view-grid">
      <div class="view-field"><span class="view-label">Type</span><span class="view-value">${r.type}</span></div>
      <div class="view-field"><span class="view-label">Capacity</span><span class="view-value">${r.capacity || '—'} seats</span></div>
      <div class="view-field"><span class="view-label">Building</span><span class="view-value">${r.building || '—'}</span></div>
      <div class="view-field"><span class="view-label">Floor</span><span class="view-value">${r.floor || '—'}</span></div>
      <div class="view-field" style="grid-column:1/-1">
        <span class="view-label">Amenities</span>
        <span class="view-value">${(r.amenities||[]).length ? r.amenities.join(', ') : '—'}</span>
      </div>
      <div class="view-field" style="grid-column:1/-1">
        <span class="view-label">Notes</span>
        <span class="view-value">${r.notes || '—'}</span>
      </div>
      <div class="view-field"><span class="view-label">Created</span><span class="view-value">${new Date(r.createdAt).toLocaleString('en-PH')}</span></div>
      <div class="view-field"><span class="view-label">Updated</span><span class="view-value">${new Date(r.updatedAt).toLocaleString('en-PH')}</span></div>
    </div>`;

  document.getElementById('room-view-edit-btn').onclick = () => { closeModal('modal-room-view'); openEditRoom(id); };
  openModal('modal-room-view');
}

// ── DELETE ──
function openDeleteRoom(id, code) {
  deletingRoomId = id;
  document.getElementById('room-delete-label').textContent = code;
  openModal('modal-room-delete');
}

async function confirmDeleteRoom() {
  if (!deletingRoomId) return;
  const btn = document.getElementById('room-confirm-delete-btn');
  btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader-2 spin"></i>';
  try {
    const res = await fetch(`/api/rooms/${deletingRoomId}`, { method: 'DELETE' });
    const data= await res.json();
    if (data.success) { closeModal('modal-room-delete'); showToast('Room deleted.', 'success'); await loadRooms(); }
    else showToast(data.message, 'error');
  } catch { showToast('Network error.', 'error'); }
  finally { btn.disabled=false; btn.innerHTML='<i class="ti ti-trash"></i> Yes, Delete'; deletingRoomId=null; }
}

// ── TOGGLE STATUS ──
async function toggleRoomStatus(id, name, currentStatus) {
  try {
    const res  = await fetch(`/api/rooms/${id}/status`, { method: 'PATCH' });
    const data = await res.json();
    if (data.success) { showToast(`${name} set to ${data.data.status}.`, 'success'); await loadRooms(); }
  } catch { showToast('Failed to update status.', 'error'); }
}

function clearRoomForm() {
  ['r-code','r-name','r-capacity','r-building','r-floor','r-amenities','r-notes'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('r-type').value = 'Lecture';
}

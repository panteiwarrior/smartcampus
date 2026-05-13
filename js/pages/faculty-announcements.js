// ═══════════════════════════════════════════
//  faculty-announcements.js
// ═══════════════════════════════════════════

let allAnnouncements = [];

async function renderFacultyAnnouncements(main) {
  const user = window.loggedInUser || {};

  main.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Announcements</h1>
        <p class="page-subtitle">Create and manage announcements for students.</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openAnnModal()">
          <i class="ti ti-plus"></i> New Announcement
        </button>
      </div>
    </div>

    <!-- Modal: Create / Edit Announcement -->
    <div class="modal-overlay" id="modal-ann" onclick="if(event.target===this)closeAnnModal()">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3 id="ann-modal-title">New Announcement</h3>
          <button class="modal-close" onclick="closeAnnModal()"><i class="ti ti-x"></i></button>
        </div>
        <div id="ann-modal-error" class="alert alert-danger" style="display:none;margin-bottom:1rem"></div>
        <div class="form-group">
          <label>Title *</label>
          <input type="text" id="ann-title" placeholder="Announcement title…" />
        </div>
        <div class="form-group">
          <label>Body *</label>
          <textarea id="ann-body" rows="5" placeholder="Write your announcement here…" style="width:100%;background:var(--surface2);border:1px solid var(--surface3);border-radius:var(--radius);padding:11px 14px;color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;resize:vertical;transition:border .2s" onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--surface3)'"></textarea>
        </div>
        <div class="form-row mb-1">
          <div class="field">
            <label>Target Audience</label>
            <select id="ann-audience">
              <option value="students">Students</option>
              <option value="faculty">Faculty</option>
              <option value="all">Everyone</option>
            </select>
          </div>
          <div class="field" style="display:flex;align-items:center;gap:.5rem;padding-top:1.4rem">
            <input type="checkbox" id="ann-pinned" style="width:16px;height:16px;accent-color:var(--gold);cursor:pointer" />
            <label for="ann-pinned" style="text-transform:none;letter-spacing:0;font-size:13px;cursor:pointer">Pin this announcement</label>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" onclick="closeAnnModal()">Cancel</button>
          <button class="btn btn-primary" id="ann-save-btn" onclick="saveAnnouncement()">
            <i class="ti ti-send"></i> Post Announcement
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm delete modal -->
    <div class="modal-overlay" id="modal-ann-delete" onclick="if(event.target===this)closeModal('modal-ann-delete')">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h3>Delete Announcement</h3>
          <button class="modal-close" onclick="closeModal('modal-ann-delete')"><i class="ti ti-x"></i></button>
        </div>
        <div class="alert alert-danger"><i class="ti ti-alert-triangle"></i> This cannot be undone.</div>
        <p style="font-size:14px;color:var(--text2);margin-bottom:1.5rem">
          Are you sure you want to delete <strong id="ann-delete-title"></strong>?
        </p>
        <div class="modal-actions">
          <button class="btn btn-ghost" onclick="closeModal('modal-ann-delete')">Cancel</button>
          <button class="btn btn-danger" id="ann-confirm-delete" onclick="confirmDeleteAnn()">
            <i class="ti ti-trash"></i> Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Announcements list -->
    <div id="ann-list-container">
      <div class="empty-row"><i class="ti ti-loader-2 spin"></i> Loading...</div>
    </div>`;

  await loadAnnouncements(user);
}

let editingAnnId  = null;
let deletingAnnId = null;

function openAnnModal(ann = null) {
  editingAnnId = ann ? ann._id : null;
  document.getElementById('ann-modal-title').textContent = ann ? 'Edit Announcement' : 'New Announcement';
  document.getElementById('ann-title').value    = ann?.title   || '';
  document.getElementById('ann-body').value     = ann?.body    || '';
  document.getElementById('ann-audience').value = ann?.target_audience || 'students';
  document.getElementById('ann-pinned').checked = ann?.pinned  || false;
  document.getElementById('ann-modal-error').style.display = 'none';
  document.getElementById('modal-ann').classList.add('active');
}

function closeAnnModal() {
  document.getElementById('modal-ann').classList.remove('active');
  editingAnnId = null;
}

async function saveAnnouncement() {
  const user    = window.loggedInUser || {};
  const title   = document.getElementById('ann-title').value.trim();
  const body    = document.getElementById('ann-body').value.trim();
  const audience= document.getElementById('ann-audience').value;
  const pinned  = document.getElementById('ann-pinned').checked;
  const errBox  = document.getElementById('ann-modal-error');

  if (!title || !body) {
    errBox.style.display = 'block';
    errBox.textContent = 'Title and body are required.';
    return;
  }

  const btn = document.getElementById('ann-save-btn');
  btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader-2 spin"></i> Saving…';

  try {
    const payload = {
      title, body,
      posted_by:       user.username || user.name || 'faculty',
      faculty_name:    user.name     || 'Faculty Member',
      target_audience: audience,
      pinned,
    };

    const url    = editingAnnId ? `/api/announcements/${editingAnnId}` : '/api/announcements';
    const method = editingAnnId ? 'PUT' : 'POST';

    const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();

    if (!data.success) throw new Error(data.message || 'Failed to save.');

    closeAnnModal();
    showToast(editingAnnId ? 'Announcement updated!' : 'Announcement posted!', 'success');
    await loadAnnouncements(user);
  } catch (err) {
    errBox.style.display = 'block';
    errBox.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="ti ti-send"></i> Post Announcement';
  }
}

async function loadAnnouncements(user) {
  const container = document.getElementById('ann-list-container');
  if (!container) return;
  try {
    const res  = await fetch('/api/announcements');
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    allAnnouncements = data.data;
    // Faculty see only their own
    const myAnn = allAnnouncements.filter(a => a.posted_by === (user.username || user.name));
    renderAnnList(myAnn);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
}

function renderAnnList(list) {
  const container = document.getElementById('ann-list-container');
  if (!container) return;
  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="ti ti-speakerphone"></i></div>
        <h3>No Announcements</h3>
        <p>You haven't posted any announcements yet. Click <strong>New Announcement</strong> to get started.</p>
      </div>`;
    return;
  }
  container.innerHTML = list.map(a => `
    <div class="ann-card ${a.pinned ? 'ann-pinned' : ''}">
      <div class="ann-card-left">
        <div class="ann-card-icon ${a.pinned ? 'icon-gold' : 'icon-blue'}">
          <i class="ti ${a.pinned ? 'ti-pin' : 'ti-speakerphone'}"></i>
        </div>
      </div>
      <div class="ann-card-body">
        <div class="ann-card-head">
          <div class="ann-card-title">${a.title}</div>
          <div class="ann-card-badges">
            ${a.pinned ? '<span class="badge badge-gold">📌 Pinned</span>' : ''}
            <span class="badge badge-${a.target_audience}">${a.target_audience}</span>
          </div>
        </div>
        <p class="ann-card-text">${a.body}</p>
        <div class="ann-card-meta">
          <span><i class="ti ti-clock" style="font-size:12px"></i> ${new Date(a.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
      <div class="ann-card-actions">
        <button class="btn btn-sm btn-ghost" onclick='openAnnModal(${JSON.stringify(a).replace(/'/g, "&#39;")})'>
          <i class="ti ti-edit"></i>
        </button>
        <button class="btn btn-sm btn-danger" onclick="promptDeleteAnn('${a._id}', '${a.title.replace(/'/g, "&#39;")}')">
          <i class="ti ti-trash"></i>
        </button>
      </div>
    </div>`).join('');
}

function promptDeleteAnn(id, title) {
  deletingAnnId = id;
  document.getElementById('ann-delete-title').textContent = title;
  openModal('modal-ann-delete');
}

async function confirmDeleteAnn() {
  if (!deletingAnnId) return;
  const btn = document.getElementById('ann-confirm-delete');
  btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader-2 spin"></i>';
  try {
    const res = await fetch(`/api/announcements/${deletingAnnId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    closeModal('modal-ann-delete');
    showToast('Announcement deleted.', 'success');
    const user = window.loggedInUser || {};
    await loadAnnouncements(user);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="ti ti-trash"></i> Delete';
    deletingAnnId = null;
  }
}

// ═══════════════════════════════════════════
//  faculty-attendance.js — Attendance Logs (UI)
// ═══════════════════════════════════════════

function renderFacultyAttendance(main) {
  main.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Attendance Logs</h1>
        <p class="page-subtitle">View attendance records for your assigned rooms.</p>
      </div>
      <div class="page-actions">
        <div class="live-badge"><span class="live-dot"></span> Live</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card mb-2">
      <div class="card-body" style="padding:1rem 1.25rem">
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label">Room</label>
            <select class="filter-select" id="att-filter-room">
              <option value="">All Rooms</option>
              <option value="Room 101">Room 101</option>
              <option value="Room 102">Room 102</option>
              <option value="Room 201">Room 201</option>
              <option value="Lab A">Lab A</option>
              <option value="Lab B">Lab B</option>
              <option value="Auditorium">Auditorium</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Date</label>
            <input type="date" class="filter-input" id="att-filter-date" value="${new Date().toISOString().split('T')[0]}" />
          </div>
          <div class="filter-group">
            <label class="filter-label">Status</label>
            <select class="filter-select" id="att-filter-status">
              <option value="">All</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
            </select>
          </div>
          <div class="filter-group" style="align-self:flex-end">
            <button class="btn btn-primary" onclick="applyAttFilters()">
              <i class="ti ti-filter"></i> Filter
            </button>
            <button class="btn btn-ghost" onclick="resetAttFilters()" style="margin-left:8px">
              <i class="ti ti-refresh"></i> Reset
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary mini-cards -->
    <div class="att-summary-row mb-2">
      <div class="att-summary-card">
        <div class="att-summary-icon" style="color:var(--success)"><i class="ti ti-user-check"></i></div>
        <div class="att-summary-value" id="att-count-present">—</div>
        <div class="att-summary-label">Present</div>
      </div>
      <div class="att-summary-card">
        <div class="att-summary-icon" style="color:var(--warning)"><i class="ti ti-clock"></i></div>
        <div class="att-summary-value" id="att-count-late">—</div>
        <div class="att-summary-label">Late</div>
      </div>
      <div class="att-summary-card">
        <div class="att-summary-icon" style="color:var(--danger)"><i class="ti ti-user-off"></i></div>
        <div class="att-summary-value" id="att-count-absent">—</div>
        <div class="att-summary-label">Absent</div>
      </div>
      <div class="att-summary-card">
        <div class="att-summary-icon" style="color:var(--accent)"><i class="ti ti-users"></i></div>
        <div class="att-summary-value" id="att-count-total">—</div>
        <div class="att-summary-label">Total Records</div>
      </div>
    </div>

    <!-- Table -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title"><i class="ti ti-clipboard-list"></i> Attendance Records</h3>
        <button class="btn btn-sm btn-ghost" onclick="exportAttendanceCSV()">
          <i class="ti ti-file-spreadsheet"></i> Export CSV
        </button>
      </div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Student</th>
              <th>ID Number</th>
              <th>Room</th>
              <th>Date</th>
              <th>Time In</th>
              <th>Time Out</th>
              <th>Status</th>
              <th>Method</th>
            </tr>
          </thead>
          <tbody id="att-table-body">
            ${generatePlaceholderRows()}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination placeholder -->
    <div class="pagination-row mt-1" id="att-pagination">
      <button class="btn btn-sm btn-ghost" disabled><i class="ti ti-chevron-left"></i> Prev</button>
      <span class="pagination-info">Page 1 of 1</span>
      <button class="btn btn-sm btn-ghost" disabled>Next <i class="ti ti-chevron-right"></i></button>
    </div>

    <div class="att-notice card mt-2">
      <div class="card-body" style="display:flex;align-items:center;gap:.75rem;padding:1rem 1.25rem">
        <i class="ti ti-info-circle" style="color:var(--accent);font-size:20px;flex-shrink:0"></i>
        <p style="color:var(--text2);font-size:13px;margin:0">
          Attendance records are synced from NFC card taps and fingerprint scans. 
          Real-time data will appear here once the hardware integration is live. 
          This view is currently showing sample data.
        </p>
      </div>
    </div>`;

  // Load mock data
  loadMockAttendance();
}

// ── Mock data for UI preview ──
const MOCK_ATTENDANCE = [
  { name: 'Juan dela Cruz',    id: '2024-0001', room: 'Room 101', date: today(), time_in: '07:58', time_out: '09:00', status: 'present', method: 'NFC' },
  { name: 'Maria Santos',      id: '2024-0002', room: 'Room 101', date: today(), time_in: '08:12', time_out: '09:00', status: 'late',    method: 'NFC' },
  { name: 'Pedro Reyes',       id: '2024-0003', room: 'Lab A',    date: today(), time_in: '08:00', time_out: '10:00', status: 'present', method: 'Fingerprint' },
  { name: 'Ana Gomez',         id: '2024-0004', room: 'Lab A',    date: today(), time_in: '',       time_out: '',      status: 'absent',  method: '—' },
  { name: 'Carlos Villanueva', id: '2024-0005', room: 'Room 201', date: today(), time_in: '09:00', time_out: '11:00', status: 'present', method: 'NFC' },
  { name: 'Luisa Ferrer',      id: '2024-0006', room: 'Room 102', date: today(), time_in: '10:05', time_out: '12:00', status: 'late',    method: 'Fingerprint' },
];

function today() {
  return new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

let filteredAttendance = [...MOCK_ATTENDANCE];

function loadMockAttendance() {
  renderAttTable(MOCK_ATTENDANCE);
  updateAttSummary(MOCK_ATTENDANCE);
}

function renderAttTable(data) {
  const tbody = document.getElementById('att-table-body');
  if (!tbody) return;
  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="empty-row">No records found for the selected filters.</td></tr>`;
    return;
  }
  tbody.innerHTML = data.map((r, i) => `
    <tr>
      <td style="color:var(--text3)">${i + 1}</td>
      <td>
        <div class="user-cell">
          <div class="avatar-sm">${r.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}</div>
          <span class="cell-name">${r.name}</span>
        </div>
      </td>
      <td><code>${r.id}</code></td>
      <td>${r.room}</td>
      <td>${r.date}</td>
      <td>${r.time_in || '—'}</td>
      <td>${r.time_out || '—'}</td>
      <td><span class="badge badge-att-${r.status}">${r.status}</span></td>
      <td>
        <span class="method-tag">
          <i class="ti ${r.method === 'NFC' ? 'ti-nfc' : r.method === 'Fingerprint' ? 'ti-fingerprint' : 'ti-minus'}"></i>
          ${r.method}
        </span>
      </td>
    </tr>`).join('');
}

function updateAttSummary(data) {
  const present = data.filter(r => r.status === 'present').length;
  const late    = data.filter(r => r.status === 'late').length;
  const absent  = data.filter(r => r.status === 'absent').length;
  const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  el('att-count-present', present);
  el('att-count-late',    late);
  el('att-count-absent',  absent);
  el('att-count-total',   data.length);
}

function applyAttFilters() {
  const room   = document.getElementById('att-filter-room')?.value   || '';
  const status = document.getElementById('att-filter-status')?.value || '';
  filteredAttendance = MOCK_ATTENDANCE.filter(r => {
    return (!room   || r.room   === room) &&
           (!status || r.status === status);
  });
  renderAttTable(filteredAttendance);
  updateAttSummary(filteredAttendance);
}

function resetAttFilters() {
  const roomSel   = document.getElementById('att-filter-room');
  const statusSel = document.getElementById('att-filter-status');
  const dateSel   = document.getElementById('att-filter-date');
  if (roomSel)   roomSel.value   = '';
  if (statusSel) statusSel.value = '';
  if (dateSel)   dateSel.value   = new Date().toISOString().split('T')[0];
  filteredAttendance = [...MOCK_ATTENDANCE];
  renderAttTable(filteredAttendance);
  updateAttSummary(filteredAttendance);
}

function exportAttendanceCSV() {
  const headers = ['#','Student','ID Number','Room','Date','Time In','Time Out','Status','Method'];
  const rows    = filteredAttendance.map((r, i) =>
    [i+1, r.name, r.id, r.room, r.date, r.time_in || '', r.time_out || '', r.status, r.method].join(',')
  );
  const csv  = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = 'attendance_logs.csv'; a.click();
  URL.revokeObjectURL(url);
  showToast('Attendance exported as CSV!', 'success');
}

function generatePlaceholderRows() {
  return Array.from({ length: 6 }, (_, i) => `
    <tr class="skeleton-row">
      <td>${i + 1}</td>
      <td><div class="skel skel-line" style="width:140px"></div></td>
      <td><div class="skel skel-line" style="width:80px"></div></td>
      <td><div class="skel skel-line" style="width:80px"></div></td>
      <td><div class="skel skel-line" style="width:90px"></div></td>
      <td><div class="skel skel-line" style="width:50px"></div></td>
      <td><div class="skel skel-line" style="width:50px"></div></td>
      <td><div class="skel skel-pill" style="width:60px"></div></td>
      <td><div class="skel skel-line" style="width:70px"></div></td>
    </tr>`).join('');
}

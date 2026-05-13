// ═══════════════════════════════════════════
//  faculty-dashboard.js — Faculty Dashboard
// ═══════════════════════════════════════════

async function renderFacultyDashboard(main) {
  const user = window.loggedInUser || {};

  main.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Faculty Dashboard</h1>
        <p class="page-subtitle">Welcome back, ${user.name || 'Faculty Member'} — here's your overview.</p>
      </div>
      <div class="page-actions">
        <div class="live-badge"><span class="live-dot"></span> Live</div>
      </div>
    </div>

    <!-- Stat cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon icon-blue"><i class="ti ti-users"></i></div>
        <div class="stat-info">
          <div class="stat-value" id="fstat-students">—</div>
          <div class="stat-label">Total Students</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon icon-green"><i class="ti ti-calendar-check"></i></div>
        <div class="stat-info">
          <div class="stat-value" id="fstat-attendance">—</div>
          <div class="stat-label">Attendances Today</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon icon-gold"><i class="ti ti-speakerphone"></i></div>
        <div class="stat-info">
          <div class="stat-value" id="fstat-announcements">—</div>
          <div class="stat-label">My Announcements</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon icon-purple"><i class="ti ti-door-enter"></i></div>
        <div class="stat-info">
          <div class="stat-value" id="fstat-requisitions">—</div>
          <div class="stat-label">Room Requests</div>
        </div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="card mt-2 mb-2">
      <div class="card-header">
        <h3 class="card-title"><i class="ti ti-bolt"></i> Quick Actions</h3>
      </div>
      <div class="card-body">
        <div class="quick-actions-grid">
          <button class="quick-action-btn" onclick="navigateTo('faculty-announcements')">
            <i class="ti ti-speakerphone"></i>
            <span>Post Announcement</span>
          </button>
          <button class="quick-action-btn" onclick="navigateTo('faculty-requisitions')">
            <i class="ti ti-door-enter"></i>
            <span>Request a Room</span>
          </button>
          <button class="quick-action-btn" onclick="navigateTo('faculty-attendance')">
            <i class="ti ti-clipboard-list"></i>
            <span>View Attendance</span>
          </button>
        </div>
      </div>
    </div>

    <!-- My Recent Announcements -->
    <div class="card mt-2">
      <div class="card-header">
        <h3 class="card-title"><i class="ti ti-speakerphone"></i> My Recent Announcements</h3>
        <button class="btn btn-sm btn-ghost" onclick="navigateTo('faculty-announcements')">View All</button>
      </div>
      <div class="card-body">
        <div id="fdash-announcements">
          <div class="empty-row"><i class="ti ti-loader-2 spin"></i> Loading...</div>
        </div>
      </div>
    </div>

    <!-- My Room Requests -->
    <div class="card mt-2">
      <div class="card-header">
        <h3 class="card-title"><i class="ti ti-door-enter"></i> My Room Requests</h3>
        <button class="btn btn-sm btn-ghost" onclick="navigateTo('faculty-requisitions')">View All</button>
      </div>
      <div class="card-body">
        <table class="data-table">
          <thead>
            <tr>
              <th>Room</th>
              <th>Date</th>
              <th>Time</th>
              <th>Purpose</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="fdash-requisitions">
            <tr><td colspan="5" class="empty-row"><i class="ti ti-loader-2 spin"></i> Loading...</td></tr>
          </tbody>
        </table>
      </div>
    </div>`;

  // Load stats & data
  try {
    // Students
    const userRes = await fetch('/api/users');
    const userData = await userRes.json();
    if (userData.success) {
      const students = userData.data.filter(u => u.role === 'student').length;
      document.getElementById('fstat-students').textContent = students;
    }

    // Announcements
    const annRes = await fetch('/api/announcements');
    const annData = await annRes.json();
    if (annData.success) {
      const myAnn = annData.data.filter(a => a.posted_by === (user.username || user.name));
      document.getElementById('fstat-announcements').textContent = myAnn.length;

      const annContainer = document.getElementById('fdash-announcements');
      if (myAnn.length === 0) {
        annContainer.innerHTML = `<p class="empty-row" style="padding:1rem 0">No announcements posted yet. <a href="#" onclick="navigateTo('faculty-announcements')">Create one →</a></p>`;
      } else {
        annContainer.innerHTML = myAnn.slice(0, 3).map(a => `
          <div class="announcement-item">
            <div class="ann-dot ${a.pinned ? 'dot-gold' : 'dot-blue'}"></div>
            <div class="ann-body">
              <div class="ann-title">${a.title}</div>
              <div class="ann-meta">
                <span class="badge badge-${a.target_audience}">${a.target_audience}</span>
                <span>${new Date(a.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          </div>`).join('');
      }
    }

    // Requisitions
    const reqRes = await fetch('/api/requisitions');
    const reqData = await reqRes.json();
    if (reqData.success) {
      const myReqs = reqData.data.filter(r => r.requested_by === (user.username || user.name));
      document.getElementById('fstat-requisitions').textContent = myReqs.length;
      document.getElementById('fstat-attendance').textContent = '—';

      const tbody = document.getElementById('fdash-requisitions');
      if (myReqs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-row">No room requests yet.</td></tr>`;
      } else {
        tbody.innerHTML = myReqs.slice(0, 5).map(r => `
          <tr>
            <td><strong>${r.room_name}</strong></td>
            <td>${r.date_needed}</td>
            <td>${r.time_start} – ${r.time_end}</td>
            <td>${r.purpose}</td>
            <td><span class="badge badge-status-${r.status}">${r.status}</span></td>
          </tr>`).join('');
      }
    }
  } catch (err) {
    console.error('Faculty dashboard error:', err);
  }
}

// ═══════════════════════════════════════════
//  dashboard.js — Dashboard page renderer
// ═══════════════════════════════════════════

async function renderDashboard(main) {
  main.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Welcome back — here's what's happening today.</p>
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
          <div class="stat-value" id="stat-total-users">—</div>
          <div class="stat-label">Total Users</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon icon-green"><i class="ti ti-school"></i></div>
        <div class="stat-info">
          <div class="stat-value" id="stat-students">—</div>
          <div class="stat-label">Students</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon icon-purple"><i class="ti ti-chalkboard"></i></div>
        <div class="stat-info">
          <div class="stat-value" id="stat-faculty">—</div>
          <div class="stat-label">Faculty</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon icon-orange"><i class="ti ti-calendar-check"></i></div>
        <div class="stat-info">
          <div class="stat-value" id="stat-attendance">—</div>
          <div class="stat-label">Attendances Today</div>
        </div>
      </div>
    </div>

    <!-- Recent logins -->
    <div class="card mt-2">
      <div class="card-header">
        <h3 class="card-title"><i class="ti ti-clock-hour-4"></i> Recent Logins</h3>
      </div>
      <div class="card-body">
        <table class="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>ID Number</th>
              <th>Status</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody id="recent-logins-body">
            <tr><td colspan="5" class="empty-row"><i class="ti ti-loader-2 spin"></i> Loading...</td></tr>
          </tbody>
        </table>
      </div>
    </div>`;

  // Fetch stats from users API
  try {
    const res = await fetch('/api/users');
    const data = await res.json();
    if (data.success) {
      const users = data.data;
      const students = users.filter(u => u.role === 'student').length;
      const faculty  = users.filter(u => u.role === 'faculty').length;

      document.getElementById('stat-total-users').textContent = users.length;
      document.getElementById('stat-students').textContent    = students;
      document.getElementById('stat-faculty').textContent     = faculty;
      document.getElementById('stat-attendance').textContent  = '—';

      // Recent 5 users
      const tbody = document.getElementById('recent-logins-body');
      if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-row">No users found.</td></tr>`;
      } else {
        tbody.innerHTML = users.slice(0, 5).map(u => `
          <tr>
            <td>
              <div class="user-cell">
                <div class="avatar-sm">${(u.first_name[0] + u.last_name[0]).toUpperCase()}</div>
                <div>
                  <div class="cell-name">${u.first_name} ${u.last_name}</div>
                  <div class="cell-sub">${u.email}</div>
                </div>
              </div>
            </td>
            <td><span class="badge badge-${u.role}">${u.role}</span></td>
            <td><code>${u.id_number}</code></td>
            <td><span class="status-dot ${u.status === 'active' ? 'dot-active' : 'dot-inactive'}"></span>${u.status}</td>
            <td>${new Date(u.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
          </tr>`).join('');
      }
    }
  } catch (err) {
    console.error('Dashboard fetch error:', err);
  }
}

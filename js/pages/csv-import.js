// ═══════════════════════════════════════════
//  csv-import.js — CSV Schedule Import (Admin)
// ═══════════════════════════════════════════

let csvParsedRows    = [];
let csvFilename      = '';
let csvPreviewActive = false;

function renderCsvImportPage(main) {
  main.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">CSV Import</h1>
        <p class="page-subtitle">Upload a spreadsheet to bulk-import class schedules.</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-ghost" onclick="downloadCsvTemplate()">
          <i class="ti ti-download"></i> Download Template
        </button>
      </div>
    </div>

    <!-- Step indicators -->
    <div class="csv-steps mb-2">
      <div class="csv-step active" id="step-1"><span class="csv-step-num">1</span><span class="csv-step-label">Upload File</span></div>
      <div class="csv-step-line"></div>
      <div class="csv-step" id="step-2"><span class="csv-step-num">2</span><span class="csv-step-label">Preview & Validate</span></div>
      <div class="csv-step-line"></div>
      <div class="csv-step" id="step-3"><span class="csv-step-num">3</span><span class="csv-step-label">Confirm</span></div>
    </div>

    <!-- ── STEP 1: Upload ── -->
    <div id="csv-step-upload">
      <div class="card mb-2">
        <div class="card-header">
          <h3 class="card-title"><i class="ti ti-file-spreadsheet"></i> Upload Schedule CSV</h3>
        </div>
        <div class="card-body">
          <div class="upload-zone" id="csv-drop-zone"
            onclick="document.getElementById('csv-file-input').click()"
            ondragover="event.preventDefault();this.style.borderColor='var(--gold)'"
            ondragleave="this.style.borderColor='var(--surface3)'"
            ondrop="handleCsvDrop(event)">
            <i class="ti ti-file-spreadsheet"></i>
            <p><strong>Click to browse</strong> or drag &amp; drop your CSV file here</p>
            <p style="margin-top:6px;font-size:12px">Accepts .csv files only</p>
            <input type="file" id="csv-file-input" accept=".csv" style="display:none" onchange="handleCsvFile(this.files[0])" />
          </div>

          <div class="form-row mt-2">
            <div class="field">
              <label>Semester <span style="color:var(--text3);text-transform:none;font-weight:400">(optional)</span></label>
              <select id="csv-semester">
                <option value="">— Not specified —</option>
                <option>1st Semester</option>
                <option>2nd Semester</option>
                <option>Summer</option>
              </select>
            </div>
            <div class="field">
              <label>School Year <span style="color:var(--text3);text-transform:none;font-weight:400">(optional)</span></label>
              <input type="text" id="csv-school-year" placeholder="e.g. 2025-2026" />
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i class="ti ti-list-check"></i> Expected CSV Format</h3>
        </div>
        <div class="card-body" style="padding:0;overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Column</th>
                <th>Required</th>
                <th>Example</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${[
                ['room_code',    'Yes', 'LB-101',           'Must match an existing room code'],
                ['subject',      'Yes', 'CS 101 - Data Structures', 'Full subject name'],
                ['faculty_name', 'Yes', 'Prof. Juan dela Cruz', 'Instructor name'],
                ['section',      'Yes', 'BSCS 2-A',         'Class section'],
                ['day_of_week',  'Yes', 'Monday',           'Monday–Sunday'],
                ['time_start',   'Yes', '08:00',            '24-hour format'],
                ['time_end',     'Yes', '10:00',            '24-hour format'],
                ['semester',     'No',  '1st Semester',     'Overridden by the field above if set'],
                ['school_year',  'No',  '2025-2026',        'Overridden by the field above if set'],
                ['notes',        'No',  'Lab coat required','Any remarks'],
              ].map(([col, req, ex, note]) => `
                <tr>
                  <td><code>${col}</code></td>
                  <td>${req === 'Yes' ? '<span style="color:var(--danger);font-weight:600">Required</span>' : '<span style="color:var(--text3)">Optional</span>'}</td>
                  <td style="color:var(--text3)">${ex}</td>
                  <td style="color:var(--text3);font-size:12px">${note}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ── STEP 2: Preview ── -->
    <div id="csv-step-preview" style="display:none">
      <div class="card mb-2">
        <div class="card-header">
          <h3 class="card-title"><i class="ti ti-table"></i> Preview — <span id="csv-preview-filename"></span></h3>
          <div style="display:flex;gap:.5rem">
            <span id="csv-valid-badge" class="badge" style="background:rgba(29,158,117,.15);color:var(--success)"></span>
            <span id="csv-error-badge" class="badge" style="background:rgba(226,75,74,.15);color:var(--danger);display:none"></span>
          </div>
        </div>
        <div class="card-body" style="padding:0;overflow-x:auto">
          <table class="data-table" id="csv-preview-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Room Code</th>
                <th>Subject</th>
                <th>Faculty</th>
                <th>Section</th>
                <th>Day</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="csv-preview-body"></tbody>
          </table>
        </div>
      </div>

      <div id="csv-errors-box" class="card mb-2" style="display:none">
        <div class="card-header">
          <h3 class="card-title" style="color:var(--danger)"><i class="ti ti-alert-triangle"></i> Validation Errors</h3>
        </div>
        <div class="card-body" id="csv-errors-list" style="font-size:13px;color:var(--danger)"></div>
      </div>

      <div style="display:flex;gap:.75rem;justify-content:flex-end">
        <button class="btn btn-ghost" onclick="resetCsvImport()"><i class="ti ti-arrow-left"></i> Back</button>
        <button class="btn btn-primary" id="csv-confirm-btn" onclick="confirmCsvImport()">
          <i class="ti ti-circle-check"></i> Confirm Import
        </button>
      </div>
    </div>

    <!-- ── STEP 3: Result ── -->
    <div id="csv-step-result" style="display:none">
      <div class="card mb-2" id="csv-result-card">
        <div class="card-body" style="text-align:center;padding:2.5rem 2rem" id="csv-result-content"></div>
      </div>
      <div style="display:flex;gap:.75rem;justify-content:center">
        <button class="btn btn-ghost" onclick="resetCsvImport()"><i class="ti ti-plus"></i> Import Another</button>
        <button class="btn btn-primary" onclick="navigateTo('csv');loadImportHistory()">
          <i class="ti ti-history"></i> View Import History
        </button>
      </div>
    </div>

    <!-- ── Import History ── -->
    <div class="card mt-2" id="csv-history-card">
      <div class="card-header">
        <h3 class="card-title"><i class="ti ti-history"></i> Import History</h3>
        <button class="btn btn-sm btn-ghost" onclick="loadImportHistory()"><i class="ti ti-refresh"></i></button>
      </div>
      <div class="card-body" style="padding:0;overflow-x:auto">
        <table class="data-table">
          <thead>
            <tr><th>File</th><th>Uploaded By</th><th>Semester</th><th>Imported</th><th>Failed</th><th>Status</th><th>Date</th><th>Actions</th></tr>
          </thead>
          <tbody id="import-history-body">
            <tr><td colspan="8" class="empty-row"><i class="ti ti-loader-2 spin"></i> Loading…</td></tr>
          </tbody>
        </table>
      </div>
    </div>`;

  loadImportHistory();
}

// ── Parse CSV text into rows ──
function parseCsv(text) {
  const lines  = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,''));
  const rows    = lines.slice(1).map(line => {
    const vals = line.split(',');
    const obj  = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] || '').trim(); });
    return obj;
  }).filter(r => Object.values(r).some(v => v !== ''));
  return { headers, rows };
}

// ── Handle file drop ──
function handleCsvDrop(e) {
  e.preventDefault();
  document.getElementById('csv-drop-zone').style.borderColor = 'var(--surface3)';
  const file = e.dataTransfer.files[0];
  if (file) handleCsvFile(file);
}

// ── Handle file selection ──
function handleCsvFile(file) {
  if (!file || !file.name.endsWith('.csv')) {
    showToast('Please select a valid .csv file.', 'error');
    return;
  }
  csvFilename = file.name;

  const reader = new FileReader();
  reader.onload = e => {
    const { rows } = parseCsv(e.target.result);
    if (!rows.length) { showToast('CSV is empty or has no data rows.', 'error'); return; }
    csvParsedRows = rows;
    showCsvPreview(rows);
  };
  reader.readAsText(file);
}

// ── Show preview ──
function showCsvPreview(rows) {
  csvPreviewActive = true;

  // Switch steps
  document.getElementById('csv-step-upload').style.display  = 'none';
  document.getElementById('csv-step-preview').style.display = 'block';
  document.getElementById('csv-step-result').style.display  = 'none';
  setStep(2);

  document.getElementById('csv-preview-filename').textContent = csvFilename;

  const REQUIRED = ['room_code','subject','faculty_name','section','day_of_week','time_start','time_end'];
  const validRows  = [];
  const errorRows  = [];
  const errorMsgs  = [];

  rows.forEach((row, idx) => {
    const missing = REQUIRED.filter(f => !row[f]);
    if (missing.length) {
      errorRows.push(idx);
      errorMsgs.push(`Row ${idx+2}: missing ${missing.join(', ')}`);
    } else {
      validRows.push(idx);
    }
  });

  // Badges
  document.getElementById('csv-valid-badge').textContent = `${validRows.length} valid`;
  const errBadge = document.getElementById('csv-error-badge');
  if (errorRows.length) {
    errBadge.textContent = `${errorRows.length} errors`;
    errBadge.style.display = 'inline-block';
  } else {
    errBadge.style.display = 'none';
  }

  // Table rows
  const tbody = document.getElementById('csv-preview-body');
  tbody.innerHTML = rows.slice(0, 100).map((r, idx) => {
    const hasErr = errorRows.includes(idx);
    return `<tr style="${hasErr ? 'background:rgba(226,75,74,.06)' : ''}">
      <td style="color:var(--text3)">${idx + 2}</td>
      <td><code>${r.room_code || '<span style="color:var(--danger)">missing</span>'}</code></td>
      <td>${r.subject || '<span style="color:var(--danger)">missing</span>'}</td>
      <td>${r.faculty_name || '<span style="color:var(--danger)">missing</span>'}</td>
      <td>${r.section || '—'}</td>
      <td>${r.day_of_week || '<span style="color:var(--danger)">missing</span>'}</td>
      <td>${r.time_start && r.time_end ? `${r.time_start} – ${r.time_end}` : '<span style="color:var(--danger)">missing</span>'}</td>
      <td>${hasErr
        ? '<span style="color:var(--danger);font-size:12px"><i class="ti ti-x"></i> Error</span>'
        : '<span style="color:var(--success);font-size:12px"><i class="ti ti-check"></i> OK</span>'
      }</td>
    </tr>`;
  }).join('');

  if (rows.length > 100) {
    tbody.innerHTML += `<tr><td colspan="8" class="empty-row" style="padding:1rem">Showing first 100 of ${rows.length} rows</td></tr>`;
  }

  // Errors box
  const errBox = document.getElementById('csv-errors-box');
  const errList = document.getElementById('csv-errors-list');
  if (errorMsgs.length) {
    errBox.style.display = 'block';
    errList.innerHTML = errorMsgs.slice(0, 20).map(e => `<div style="padding:4px 0;border-bottom:1px solid var(--surface3)"><i class="ti ti-alert-circle" style="margin-right:6px"></i>${e}</div>`).join('');
    if (errorMsgs.length > 20) errList.innerHTML += `<div style="padding-top:8px;color:var(--text3)">…and ${errorMsgs.length - 20} more errors</div>`;
  } else {
    errBox.style.display = 'none';
  }

  // Disable confirm if ALL rows have errors
  const confirmBtn = document.getElementById('csv-confirm-btn');
  if (validRows.length === 0) {
    confirmBtn.disabled = true;
    confirmBtn.title = 'No valid rows to import';
  } else {
    confirmBtn.disabled = false;
    confirmBtn.title = '';
    confirmBtn.innerHTML = `<i class="ti ti-circle-check"></i> Confirm Import (${validRows.length} rows)`;
  }
}

// ── Confirm & send to API ──
async function confirmCsvImport() {
  const user       = window.loggedInUser || {};
  const semester   = document.getElementById('csv-semester')?.value    || '';
  const schoolYear = document.getElementById('csv-school-year')?.value || '';

  const btn = document.getElementById('csv-confirm-btn');
  btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader-2 spin"></i> Importing…';

  try {
    const res  = await fetch('/api/csv/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rows:        csvParsedRows,
        filename:    csvFilename,
        uploaded_by: user.username || user.name || 'admin',
        semester, school_year: schoolYear,
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    // Show result
    document.getElementById('csv-step-preview').style.display = 'none';
    document.getElementById('csv-step-result').style.display  = 'block';
    setStep(3);

    const { rows_imported, rows_failed, status } = data.data;
    const resultContent = document.getElementById('csv-result-content');
    if (status === 'failed') {
      resultContent.innerHTML = `
        <div style="font-size:48px;margin-bottom:1rem;color:var(--danger)"><i class="ti ti-circle-x"></i></div>
        <h2 style="color:var(--danger);margin-bottom:.5rem">Import Failed</h2>
        <p style="color:var(--text3)">No rows were imported. Please check your file and try again.</p>`;
    } else {
      resultContent.innerHTML = `
        <div style="font-size:48px;margin-bottom:1rem;color:var(--success)"><i class="ti ti-circle-check"></i></div>
        <h2 style="color:var(--success);margin-bottom:.5rem">${status === 'partial' ? 'Partial Import' : 'Import Successful'}</h2>
        <p style="color:var(--text2);margin-bottom:1.5rem">
          <strong style="color:var(--text)">${rows_imported}</strong> schedules imported successfully.
          ${rows_failed ? `<span style="color:var(--danger)"> ${rows_failed} rows failed.</span>` : ''}
        </p>`;
    }

    await loadImportHistory();

  } catch (err) {
    showToast(err.message || 'Import failed.', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-circle-check"></i> Confirm Import'; }
  }
}

// ── Reset ──
function resetCsvImport() {
  csvParsedRows    = [];
  csvFilename      = '';
  csvPreviewActive = false;
  document.getElementById('csv-step-upload').style.display  = 'block';
  document.getElementById('csv-step-preview').style.display = 'none';
  document.getElementById('csv-step-result').style.display  = 'none';
  const fi = document.getElementById('csv-file-input');
  if (fi) fi.value = '';
  setStep(1);
}

// ── Step UI ──
function setStep(n) {
  [1,2,3].forEach(i => {
    const el = document.getElementById(`step-${i}`);
    if (el) el.className = `csv-step${i <= n ? ' active' : ''}${i === n ? ' current' : ''}`;
  });
}

// ── Load history ──
async function loadImportHistory() {
  const tbody = document.getElementById('import-history-body');
  if (!tbody) return;
  try {
    const res  = await fetch('/api/csv/history');
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    if (!data.data.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-row">No imports yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = data.data.map(imp => `
      <tr>
        <td><div class="user-cell">
          <div class="avatar-sm" style="background:rgba(45,156,219,.12);color:var(--accent);border-radius:8px;font-size:16px">
            <i class="ti ti-file-spreadsheet"></i>
          </div>
          <div>
            <div class="cell-name">${imp.filename}</div>
            <div class="cell-sub">${imp.rows_total} total rows</div>
          </div>
        </div></td>
        <td>${imp.uploaded_by}</td>
        <td>${imp.semester || imp.school_year ? `${imp.semester} ${imp.school_year}`.trim() : '—'}</td>
        <td style="color:var(--success);font-weight:600">${imp.rows_imported}</td>
        <td style="color:${imp.rows_failed ? 'var(--danger)' : 'var(--text3)'};font-weight:${imp.rows_failed?'600':'400'}">${imp.rows_failed || '0'}</td>
        <td><span class="badge ${imp.status === 'success' ? 'badge-approved' : imp.status === 'partial' ? 'badge-late' : 'badge-rejected'}">${imp.status}</span></td>
        <td style="color:var(--text3);font-size:12px">${new Date(imp.createdAt).toLocaleString('en-PH',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'})}</td>
        <td>
          <button class="btn-icon btn-delete" title="Revert this import" onclick="revertImport('${imp._id}','${imp.filename}')">
            <i class="ti ti-restore"></i>
          </button>
        </td>
      </tr>`).join('');
  } catch (err) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="empty-row">${err.message}</td></tr>`;
  }
}

// ── Revert import ──
async function revertImport(id, filename) {
  if (!confirm(`Revert import "${filename}"? This will delete all schedules from that batch.`)) return;
  try {
    const res  = await fetch(`/api/csv/import/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { showToast(`Reverted: ${data.deleted_schedules} schedules removed.`, 'success'); await loadImportHistory(); }
    else showToast(data.message, 'error');
  } catch { showToast('Network error.', 'error'); }
}

// ── Download template CSV ──
function downloadCsvTemplate() {
  const headers = 'room_code,subject,faculty_name,section,day_of_week,time_start,time_end,semester,school_year,notes';
  const sample  = 'LB-101,CS 101 - Data Structures,Prof. Juan dela Cruz,BSCS 2-A,Monday,08:00,10:00,1st Semester,2025-2026,Bring lab manuals';
  const blob    = new Blob([headers + '\n' + sample], { type: 'text/csv' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href = url; a.download = 'schedule_template.csv'; a.click();
  URL.revokeObjectURL(url);
  showToast('Template downloaded!', 'success');
}

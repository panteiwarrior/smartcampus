const mongoose = require('mongoose');

// ── Schedule (one row = one weekly time slot) ──
const ScheduleSchema = new mongoose.Schema({
  room_code:   { type: String, required: true, trim: true, uppercase: true },
  subject:     { type: String, required: true, trim: true },
  faculty_name:{ type: String, required: true, trim: true },
  section:     { type: String, required: true, trim: true },
  day_of_week: { type: String, required: true, trim: true },
  time_start:  { type: String, required: true },
  time_end:    { type: String, required: true },
  semester:    { type: String, trim: true, default: '' },
  school_year: { type: String, trim: true, default: '' },
  notes:       { type: String, trim: true, default: '' },
  import_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'CsvImport', default: null },
}, { timestamps: true, collection: 'schedules' });

// ── CsvImport (audit log per upload) ──
const CsvImportSchema = new mongoose.Schema({
  filename:      { type: String, required: true },
  uploaded_by:   { type: String, required: true },
  rows_total:    { type: Number, default: 0 },
  rows_imported: { type: Number, default: 0 },
  rows_failed:   { type: Number, default: 0 },
  status:        { type: String, enum: ['success', 'partial', 'failed'], default: 'success' },
  errors:        { type: [String], default: [] },
  semester:      { type: String, default: '' },
  school_year:   { type: String, default: '' },
}, { timestamps: true, collection: 'csv_imports' });

const Schedule  = mongoose.model('Schedule',  ScheduleSchema);
const CsvImport = mongoose.model('CsvImport', CsvImportSchema);

module.exports = { Schedule, CsvImport };

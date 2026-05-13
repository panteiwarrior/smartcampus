const express  = require('express');
const router   = express.Router();
const { Schedule, CsvImport } = require('../models/Schedule');
const Room = require('../models/Room');

// GET all import history
router.get('/history', async (req, res) => {
  try {
    const imports = await CsvImport.find().sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: imports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all schedules
router.get('/schedules', async (req, res) => {
  try {
    const { room_code, day, semester, school_year } = req.query;
    const filter = {};
    if (room_code)   filter.room_code   = room_code.toUpperCase();
    if (day)         filter.day_of_week = { $regex: day, $options: 'i' };
    if (semester)    filter.semester    = semester;
    if (school_year) filter.school_year = school_year;
    const schedules = await Schedule.find(filter).sort({ day_of_week: 1, time_start: 1 });
    res.json({ success: true, data: schedules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST import CSV rows (expects parsed JSON from frontend)
router.post('/import', async (req, res) => {
  try {
    const { rows, filename, uploaded_by, semester, school_year } = req.body;
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No rows provided.' });
    }

    const REQUIRED = ['room_code', 'subject', 'faculty_name', 'section', 'day_of_week', 'time_start', 'time_end'];
    const errors   = [];
    const valid    = [];

    // Get all known room codes
    const rooms     = await Room.find({}, 'room_code');
    const roomCodes = new Set(rooms.map(r => r.room_code.toUpperCase()));

    rows.forEach((row, idx) => {
      const rowNum = idx + 2; // spreadsheet row number (1-indexed header)
      const missing = REQUIRED.filter(f => !row[f] || String(row[f]).trim() === '');
      if (missing.length) {
        errors.push(`Row ${rowNum}: missing ${missing.join(', ')}`);
        return;
      }
      const code = String(row.room_code).trim().toUpperCase();
      if (!roomCodes.has(code)) {
        errors.push(`Row ${rowNum}: room code "${code}" not found in rooms collection`);
        return;
      }
      valid.push({
        room_code:    code,
        subject:      String(row.subject).trim(),
        faculty_name: String(row.faculty_name).trim(),
        section:      String(row.section).trim(),
        day_of_week:  String(row.day_of_week).trim(),
        time_start:   String(row.time_start).trim(),
        time_end:     String(row.time_end).trim(),
        semester:     semester || String(row.semester  || '').trim(),
        school_year:  school_year || String(row.school_year || '').trim(),
        notes:        String(row.notes || '').trim(),
      });
    });

    // Determine status
    const status = valid.length === 0 ? 'failed' : errors.length > 0 ? 'partial' : 'success';

    // Create import log
    const importLog = await CsvImport.create({
      filename:      filename || 'unknown.csv',
      uploaded_by:   uploaded_by || 'admin',
      rows_total:    rows.length,
      rows_imported: valid.length,
      rows_failed:   errors.length,
      status,
      errors:        errors.slice(0, 50),
      semester:      semester || '',
      school_year:   school_year || '',
    });

    // Insert valid rows with import_id reference
    if (valid.length > 0) {
      await Schedule.insertMany(valid.map(v => ({ ...v, import_id: importLog._id })));
    }

    res.json({
      success: true,
      data: {
        import_id:     importLog._id,
        rows_total:    rows.length,
        rows_imported: valid.length,
        rows_failed:   errors.length,
        status,
        errors,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE — revert an import (delete all schedules with that import_id)
router.delete('/import/:id', async (req, res) => {
  try {
    const deleted = await Schedule.deleteMany({ import_id: req.params.id });
    await CsvImport.findByIdAndDelete(req.params.id);
    res.json({ success: true, deleted_schedules: deleted.deletedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

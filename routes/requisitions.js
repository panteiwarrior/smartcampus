const express = require('express');
const router  = express.Router();
const RoomRequisition = require('../models/RoomRequisition');

// GET all requisitions
router.get('/', async (req, res) => {
  try {
    const reqs = await RoomRequisition.find().sort({ createdAt: -1 });
    res.json({ success: true, data: reqs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET requisitions by faculty username
router.get('/by-faculty/:username', async (req, res) => {
  try {
    const reqs = await RoomRequisition.find({ requested_by: req.params.username }).sort({ createdAt: -1 });
    res.json({ success: true, data: reqs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create new requisition (faculty only)
router.post('/', async (req, res) => {
  try {
    const { requested_by, faculty_name, department, room_name, purpose, date_needed, time_start, time_end, notes } = req.body;
    if (!requested_by || !faculty_name || !room_name || !purpose || !date_needed || !time_start || !time_end) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }
    const req2 = await RoomRequisition.create({ requested_by, faculty_name, department, room_name, purpose, date_needed, time_start, time_end, notes });
    res.status(201).json({ success: true, data: req2 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH update status (admin only action)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, admin_remarks } = req.body;
    if (!['approved', 'denied', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    const updated = await RoomRequisition.findByIdAndUpdate(
      req.params.id,
      { status, admin_remarks: admin_remarks || '' },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Request not found.' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE a requisition
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await RoomRequisition.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Request not found.' });
    res.json({ success: true, message: 'Deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

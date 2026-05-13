const express      = require('express');
const router       = express.Router();
const Announcement = require('../models/Announcement');

// GET all
router.get('/', async (req, res) => {
  try {
    const list = await Announcement.find().sort({ pinned: -1, createdAt: -1 });
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create
router.post('/', async (req, res) => {
  try {
    const { title, body, posted_by, faculty_name, target_audience, pinned, tags } = req.body;
    if (!title || !body || !posted_by || !faculty_name) {
      return res.status(400).json({ success: false, message: 'Title, body and poster are required.' });
    }
    const ann = await Announcement.create({ title, body, posted_by, faculty_name, target_audience, pinned, tags });
    res.status(201).json({ success: true, data: ann });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update
router.put('/:id', async (req, res) => {
  try {
    const updated = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Announcement.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true, message: 'Deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

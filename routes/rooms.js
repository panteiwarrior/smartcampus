const express = require('express');
const router  = express.Router();
const Room    = require('../models/Room');

// GET all
router.get('/', async (req, res) => {
  try {
    const { search, type, status } = req.query;
    const filter = {};
    if (type)   filter.type   = type;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { room_code: { $regex: search, $options: 'i' } },
        { room_name: { $regex: search, $options: 'i' } },
        { building:  { $regex: search, $options: 'i' } },
      ];
    }
    const rooms = await Room.find(filter).sort({ room_code: 1 });
    res.json({ success: true, count: rooms.length, data: rooms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, data: room });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create
router.post('/', async (req, res) => {
  try {
    const { room_code, room_name, type, building, floor, capacity, amenities, notes } = req.body;
    if (!room_code || !room_name) {
      return res.status(400).json({ success: false, message: 'Room code and name are required.' });
    }
    const existing = await Room.findOne({ room_code: room_code.toUpperCase() });
    if (existing) return res.status(400).json({ success: false, message: 'Room code already exists.' });

    const room = await Room.create({ room_code, room_name, type, building, floor, capacity, amenities, notes });
    res.status(201).json({ success: true, data: room });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Room code already exists.' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update
router.put('/:id', async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, data: room });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Room code already exists.' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, message: 'Room deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH toggle status
router.patch('/:id/status', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    room.status = room.status === 'available' ? 'unavailable' : 'available';
    await room.save();
    res.json({ success: true, data: { status: room.status } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

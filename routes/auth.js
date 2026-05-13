const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');

// ── DEBUG: view admin_cred ──
router.get('/debug', async (req, res) => {
  try {
    const db  = mongoose.connection.db;
    const all = await db.collection('admin_cred').find({}).toArray();
    res.json({ collection: 'admin_cred', documents: all });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DEBUG: view faculty_cred ──
router.get('/debug-faculty', async (req, res) => {
  try {
    const db  = mongoose.connection.db;
    const all = await db.collection('faculty_cred').find({}).toArray();
    res.json({ collection: 'faculty_cred', documents: all });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    console.log('LOGIN ATTEMPT:', { username, role });

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    // ADMIN
    if (role === 'admin') {
      const db        = mongoose.connection.db;
      const adminCred = await db.collection('admin_cred').findOne({ username });
      if (!adminCred || adminCred.password !== password) {
        return res.status(401).json({ success: false, message: 'Invalid username or password.' });
      }
      return res.json({ success: true, user: { id: adminCred._id, name: 'Administrator', role: 'admin', username: adminCred.username } });
    }

    // FACULTY — uses faculty_cred collection
    if (role === 'faculty') {
      const db          = mongoose.connection.db;
      const facultyCred = await db.collection('faculty_cred').findOne({ username });
      console.log('FOUND IN faculty_cred:', facultyCred ? facultyCred.username : 'none');
      if (!facultyCred || facultyCred.password !== password) {
        return res.status(401).json({ success: false, message: 'Invalid username or password.' });
      }
      return res.json({
        success: true,
        user: {
          id:         facultyCred._id,
          name:       facultyCred.name || 'Faculty Member',
          role:       'faculty',
          username:   facultyCred.username,
          department: facultyCred.department || 'Faculty',
          email:      facultyCred.email || '',
        },
      });
    }

    // STUDENT
    const User   = require('../models/User');
    const bcrypt = require('bcryptjs');
    const user   = await User.findOne({
      $and: [
        { role: 'student' },
        { $or: [{ email: username }, { id_number: username }] },
      ],
    });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    let isMatch = false;
    try { isMatch = await bcrypt.compare(password, user.password); } catch { isMatch = password === user.password; }
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    return res.json({ success: true, user: { id: user._id, name: `${user.first_name} ${user.last_name}`, role: user.role, email: user.email, section: user.section || '' } });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

module.exports = router;

const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { body, validationResult } = require('express-validator');

// ═══════════════════════════════════════════
//  GET /api/users  — Get all users (with optional filters)
// ═══════════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    const { role, department, section, search, status } = req.query;
    const filter = {};

    if (role)       filter.role       = role;
    if (department) filter.department = department;
    if (section)    filter.section    = section;
    if (status)     filter.status     = status;

    if (search) {
      filter.$or = [
        { first_name:  { $regex: search, $options: 'i' } },
        { last_name:   { $regex: search, $options: 'i' } },
        { email:       { $regex: search, $options: 'i' } },
        { id_number:   { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-password')   // never return password
      .sort({ createdAt: -1 });

    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════
//  GET /api/users/:id  — Get single user
// ═══════════════════════════════════════════
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════
//  POST /api/users  — Create new user
// ═══════════════════════════════════════════
router.post('/', [
  body('id_number').notEmpty().withMessage('ID Number is required'),
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['student','faculty','admin']).withMessage('Invalid role'),
  body('department').notEmpty().withMessage('Department is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    // Check for duplicate id_number or email
    const existing = await User.findOne({
      $or: [{ id_number: req.body.id_number }, { email: req.body.email }]
    });
    if (existing) {
      const field = existing.id_number === req.body.id_number ? 'ID Number' : 'Email';
      return res.status(400).json({ success: false, message: `${field} already exists` });
    }

    const user = await User.create(req.body);
    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({ success: true, message: 'User created successfully', data: userObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════
//  PUT /api/users/:id  — Update user
// ═══════════════════════════════════════════
router.put('/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Don't allow empty password updates — skip if blank
    if (!updateData.password || updateData.password.trim() === '') {
      delete updateData.password;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, message: 'User updated successfully', data: user });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ success: false, message: `${field} already exists` });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════
//  DELETE /api/users/:id  — Delete user
// ═══════════════════════════════════════════
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════
//  PATCH /api/users/:id/status  — Toggle active/inactive
// ═══════════════════════════════════════════
router.patch('/:id/status', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.status = user.status === 'active' ? 'inactive' : 'active';
    await user.save();

    res.json({ success: true, message: `User ${user.status}`, data: { status: user.status } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

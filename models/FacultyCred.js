const mongoose = require('mongoose');

// ── Faculty credential schema (mirrors admin_cred but for faculty) ──
const FacultyCredSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  name: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true,
  },
  department: {
    type: String,
    trim: true,
    default: 'Faculty',
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: '',
  },
}, {
  timestamps: true,
  collection: 'faculty_cred',   // explicit collection name
});

module.exports = mongoose.model('FacultyCred', FacultyCredSchema);

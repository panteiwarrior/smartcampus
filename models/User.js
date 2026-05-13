const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  id_number: {
    type: String,
    required: [true, 'ID Number is required'],
    unique: true,
    trim: true,
  },
  first_name: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
  },
  last_name: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['student', 'faculty', 'admin'],
    required: [true, 'Role is required'],
    default: 'student',
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true,
  },
  section: {
    type: String,
    trim: true,
    default: '',   // only applicable for students
  },
  nfc_uid: {
    type: String,
    trim: true,
    default: '',   // NFC card UID — assigned when hardware taps
  },
  fingerprint_id: {
    type: Number,
    default: null, // fingerprint scanner template ID
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
}, {
  timestamps: true,  // adds createdAt, updatedAt automatically
});

// ── Hash password before saving ──
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Hash password on update if changed ──
UserSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  if (update.password) {
    const salt = await bcrypt.genSalt(10);
    update.password = await bcrypt.hash(update.password, salt);
  }
  next();
});

// ── Virtual: full name ──
UserSchema.virtual('full_name').get(function () {
  return `${this.first_name} ${this.last_name}`;
});

module.exports = mongoose.model('User', UserSchema);

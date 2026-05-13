const mongoose = require('mongoose');

const RoomRequisitionSchema = new mongoose.Schema({
  requested_by: {
    type: String,
    required: true,
    trim: true,
  },
  faculty_name: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: String,
    trim: true,
    default: '',
  },
  room_name: {
    type: String,
    required: true,
    trim: true,
  },
  purpose: {
    type: String,
    required: true,
    trim: true,
  },
  date_needed: {
    type: String,
    required: true,
  },
  time_start: {
    type: String,
    required: true,
  },
  time_end: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending',
  },
  admin_remarks: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
  collection: 'room_requisitions',
});

module.exports = mongoose.model('RoomRequisition', RoomRequisitionSchema);

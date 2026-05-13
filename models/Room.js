const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  room_code: {
    type: String,
    required: [true, 'Room code is required'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  room_name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['Lecture', 'Laboratory', 'Seminar', 'Auditorium', 'Conference', 'Other'],
    default: 'Lecture',
  },
  building: {
    type: String,
    trim: true,
    default: '',
  },
  floor: {
    type: String,
    trim: true,
    default: '',
  },
  capacity: {
    type: Number,
    min: 0,
    default: 0,
  },
  amenities: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: ['available', 'unavailable'],
    default: 'available',
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
  collection: 'rooms',
});

module.exports = mongoose.model('Room', RoomSchema);

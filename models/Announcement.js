const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  body: {
    type: String,
    required: [true, 'Body is required'],
    trim: true,
  },
  posted_by: {
    type: String,
    required: true,
    trim: true,
  },
  faculty_name: {
    type: String,
    required: true,
    trim: true,
  },
  target_audience: {
    type: String,
    enum: ['all', 'students', 'faculty'],
    default: 'students',
  },
  pinned: {
    type: Boolean,
    default: false,
  },
  tags: {
    type: [String],
    default: [],
  },
}, {
  timestamps: true,
  collection: 'announcements',
});

module.exports = mongoose.model('Announcement', AnnouncementSchema);

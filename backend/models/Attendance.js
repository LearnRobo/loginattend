const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  checkIn: {
    time: { type: Date },
    location: {
      lat: { type: Number },
      lng: { type: Number }
    },
    faceImage: { type: String },
    verified: { type: Boolean, default: false }
  },
  checkOut: {
    time: { type: Date },
    location: {
      lat: { type: Number },
      lng: { type: Number }
    },
    faceImage: { type: String },
    verified: { type: Boolean, default: false }
  },
  office: { type: mongoose.Schema.Types.ObjectId, ref: 'Office' },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'on_leave'],
    default: 'present'
  },
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

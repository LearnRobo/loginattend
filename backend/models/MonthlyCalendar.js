const mongoose = require('mongoose');

const daySchema = new mongoose.Schema({
  day: { type: Number, required: true },
  dateString: { type: String, required: true }, // YYYY-MM-DD
  type: { type: String, enum: ['working', 'sunday', 'holiday'], default: 'working' },
  label: { type: String, default: '' }
});

const monthlyCalendarSchema = new mongoose.Schema({
  monthString: { type: String, required: true, unique: true }, // e.g. "2026-05"
  year: { type: Number, required: true },
  month: { type: Number, required: true }, // 0 to 11
  totalWorkingDays: { type: Number, required: true },
  days: [daySchema],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MonthlyCalendar', monthlyCalendarSchema);

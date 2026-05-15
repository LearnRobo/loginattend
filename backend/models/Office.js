const mongoose = require('mongoose');

const OfficeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  address: String,
  radius: {
    type: Number,
    default: 100 // Default 100 meters
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Office', OfficeSchema);

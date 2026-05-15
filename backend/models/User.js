const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  employeeId: { type: String, required: true, unique: true },
  role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
  faceImage: { type: String }, // Path to registered face image
  faceEncoding: { type: Array }, // To store face encoding if using local python service
  salaryDetails: {
    baseSalary: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 }
  },
  officeCoords: {
    lat: { type: Number },
    lng: { type: Number }
  },
  assignedOffices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Office' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);

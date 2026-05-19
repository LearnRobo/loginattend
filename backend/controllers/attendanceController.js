const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { calculateDistance } = require('../utils/gpsHelper');
const { DateTime } = require('luxon');
const axios = require('axios');

exports.checkIn = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`[CHECK-IN] Starting for user: ${userId}`);
    const { lat, lng, officeId } = req.body;
    console.log(`[CHECK-IN] RECEIVED DATA - OfficeId: ${officeId}, Lat: ${lat}, Lng: ${lng}`);
    console.log(`[CHECK-IN] RECEIVED FILE - `, req.file ? req.file.filename : 'NO FILE ATTACHED');
    
    // 1. GPS Validation
    console.log(`[CHECK-IN] Validating GPS: ${lat}, ${lng} for Office: ${officeId}`);
    const user = await User.findById(userId).populate('assignedOffices');
    
    // Find the specific office the user selected
    const targetOffice = user.assignedOffices.find(o => o._id.toString() === officeId);
    
    if (!targetOffice) {
      console.log(`[CHECK-IN] FAILED: Office ${officeId} not found in user allotments`);
      return res.status(400).json({ msg: 'Invalid office selection or office not assigned to you.' });
    }

    const officeLat = targetOffice.location.lat;
    const officeLng = targetOffice.location.lng;
    const allowedRadius = targetOffice.radius || 100;

    const distance = calculateDistance(lat, lng, officeLat, officeLng);
    console.log(`[CHECK-IN] Distance calculated: ${distance}m (Allowed: ${allowedRadius}m)`);
    
    if (distance > allowedRadius) {
      console.log(`[CHECK-IN] REJECTED: Out of range`);
      return res.status(400).json({ msg: `You are too far from ${targetOffice.name} (${Math.round(distance)}m)` });
    }

    // 2. Face Recognition Placeholder
    console.log(`[CHECK-IN] Face verification placeholder...`);
    let faceVerified = true; 

    // 3. Mark Attendance
    const today = DateTime.now().toFormat('yyyy-MM-dd');
    console.log(`[CHECK-IN] Saving to DB for date: ${today}`);
    
    let attendance = await Attendance.findOne({ user: userId, date: today });
    if (attendance && attendance.checkIn?.time) {
      console.log(`[CHECK-IN] REJECTED: Already checked in`);
      return res.status(400).json({ msg: 'Already checked in for today' });
    }

    if (!attendance) {
      attendance = new Attendance({ user: userId, date: today });
    }

    attendance.checkIn = {
      time: new Date(),
      location: { lat, lng },
      faceImage: req.file ? req.file.filename : (req.body.faceImageBase64 || null),
      verified: true
    };
    attendance.office = officeId;
    attendance.status = 'present';
    
    await attendance.save();
    console.log(`[CHECK-IN] SUCCESS: Attendance saved for Office: ${targetOffice.name}`);
    res.json(attendance);
  } catch (err) {
    console.error('Checkin Server Error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const { lat, lng, officeId, faceImageBase64 } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId).populate('assignedOffices');
    const today = DateTime.now().toFormat('yyyy-MM-dd');

    // Find the specific office the user selected
    const targetOffice = user.assignedOffices.find(o => o._id.toString() === officeId);
    
    if (!targetOffice) {
      return res.status(400).json({ msg: 'Invalid office selection for checkout.' });
    }

    // GPS Validation for Checkout
    const officeLat = targetOffice.location.lat;
    const officeLng = targetOffice.location.lng;
    const allowedRadius = targetOffice.radius || 100;

    const distance = calculateDistance(lat, lng, officeLat, officeLng);
    if (distance > allowedRadius) {
      return res.status(400).json({ msg: `You must be at ${targetOffice.name} to punch out (${Math.round(distance)}m away)` });
    }

    let attendance = await Attendance.findOne({ user: userId, date: today });
    if (!attendance || !attendance.checkIn.time) {
      return res.status(400).json({ msg: 'You must check-in first' });
    }

    attendance.checkOut = {
      time: new Date(),
      location: { lat, lng },
      faceImage: req.file ? req.file.filename : (faceImageBase64 || null),
      verified: true
    };

    await attendance.save();
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const history = await Attendance.find({ user: req.user.id })
      .populate('office', 'name')
      .sort({ date: -1 })
      .limit(30);
    res.json(history);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.getAllAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find()
      .populate('user', 'name employeeId')
      .populate('office', 'name')
      .sort({ date: -1 });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const today = DateTime.now().toFormat('yyyy-MM-dd');
    const presentToday = await Attendance.countDocuments({ date: today, status: 'present' });
    const pendingLeaves = await require('../models/Leave').countDocuments({ status: 'pending' });

    res.json({
      totalEmployees,
      presentToday,
      absentToday: totalEmployees - presentToday,
      pendingLeaves
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.resetAttendance = async (req, res) => {
  try {
    await Attendance.deleteMany({});
    console.log(`[RESET] All attendance records cleared by Admin: ${req.user.id}`);
    res.json({ msg: 'All attendance records have been reset successfully.' });
  } catch (err) {
    console.error('Reset Error:', err);
    res.status(500).json({ msg: 'Server Error during reset' });
  }
};

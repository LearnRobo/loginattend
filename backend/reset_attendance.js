const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
const dotenv = require('dotenv');

dotenv.config();

const resetAttendance = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/attendance_db');
    console.log('Connected to MongoDB...');
    
    const result = await Attendance.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} attendance records.`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error resetting attendance:', err);
    process.exit(1);
  }
};

resetAttendance();

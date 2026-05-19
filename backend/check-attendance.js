const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Attendance = require('./models/Attendance');

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    const records = await Attendance.find().populate('user', 'name');
    console.log('Total attendance records:', records.length);
    records.forEach(r => {
      console.log(`User: ${r.user ? r.user.name : 'Unknown'}, Date: ${r.date}`);
      console.log(`  CheckIn time: ${r.checkIn ? r.checkIn.time : 'none'}`);
      console.log(`  CheckIn faceImage: ${r.checkIn ? r.checkIn.faceImage : 'none'}`);
      console.log(`  CheckOut time: ${r.checkOut ? r.checkOut.time : 'none'}`);
      console.log(`  CheckOut faceImage: ${r.checkOut ? r.checkOut.faceImage : 'none'}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();

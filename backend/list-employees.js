const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const listEmployees = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const employees = await User.find({ role: 'employee' });
    
    console.log('\n--- REGISTERED EMPLOYEES ---');
    employees.forEach(emp => {
      console.log(`Name: ${emp.name}`);
      console.log(`Email: ${emp.email}`);
      console.log(`ID: ${emp.employeeId}`);
      console.log('---------------------------');
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

listEmployees();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const employees = [
  {
    name: 'Rahul Sharma',
    email: 'rahul@edtech.com',
    password: 'emp123',
    employeeId: 'EMP001',
    role: 'employee',
    salaryDetails: { baseSalary: 35000, bonus: 2000, deductions: 1500 }
  },
  {
    name: 'Priya Patel',
    email: 'priya@edtech.com',
    password: 'emp123',
    employeeId: 'EMP002',
    role: 'employee',
    salaryDetails: { baseSalary: 40000, bonus: 3000, deductions: 2000 }
  },
  {
    name: 'Ashwini Rajput',
    email: 'ashwini@edtech.com',
    password: 'emp123',
    employeeId: 'EMP003',
    role: 'employee',
    salaryDetails: { baseSalary: 45000, bonus: 5000, deductions: 2500 }
  }
];

const seedEmployees = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    const salt = await bcrypt.genSalt(10);

    for (const emp of employees) {
      const exists = await User.findOne({ email: emp.email });
      if (exists) {
        console.log(`Employee ${emp.email} already exists, skipping...`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(emp.password, salt);
      const user = new User({ ...emp, password: hashedPassword });
      await user.save();
      console.log(`✅ Created employee: ${emp.name} (${emp.email})`);
    }

    console.log('\n--- All done! ---');
    console.log('Employee Login Credentials:');
    employees.forEach(e => {
      console.log(`  ${e.name} | Email: ${e.email} | Password: ${e.password} | ID: ${e.employeeId}`);
    });

    process.exit();
  } catch (err) {
    console.error('Error seeding employees:', err);
    process.exit(1);
  }
};

seedEmployees();

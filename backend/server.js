const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const fs = require('fs');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../uploads/temp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created uploads directory:', uploadDir);
}

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath);
    if (!ext && filePath.includes('temp')) {
      res.setHeader('Content-Type', 'image/jpeg');
    }
  }
}));
app.get('/test-client', (req, res) => {
  res.sendFile(path.join(__dirname, '../employee-login-preview.html'));
});
app.get('/admin-test', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin-test-client.html'));
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/employees', require('./routes/employee'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/leaves', require('./routes/leave'));
app.use('/api/offices', require('./routes/office'));
app.use('/api/payroll', require('./routes/payroll'));

app.get('/', (req, res) => {
  res.send('Attendance App API is running...');
});

const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Database Connection
const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;
    
    if (uri.includes('localhost')) {
      console.log('Using MongoDB Memory Server for testing...');
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
    }

    await mongoose.connect(uri);
    console.log('MongoDB Connected');

    // Seed Admin if not exists
    const adminExists = await User.findOne({ role: 'admin' });
    const salt = await bcrypt.genSalt(10);
    const adminHashedPassword = await bcrypt.hash('admin123', salt);

    if (!adminExists) {
      await User.create({
        name: 'Super Admin',
        email: 'admin@edtech.com',
        password: adminHashedPassword,
        employeeId: 'ADM001',
        role: 'admin'
      });
      console.log('✅ Admin Created: admin@edtech.com / admin123');
    } else {
      adminExists.password = adminHashedPassword;
      adminExists.email = 'admin@edtech.com';
      await adminExists.save();
      console.log('✅ Admin Password Reset: admin@edtech.com / admin123');
    }

    // Seed Test Employees only if database is completely empty
    const employeeCount = await User.countDocuments({ role: 'employee' });
    if (employeeCount === 0) {
      const defaultLat = parseFloat(process.env.OFFICE_LAT) || 12.9716;
      const defaultLng = parseFloat(process.env.OFFICE_LONG) || 77.5946;

      const testEmployees = [
        { name: 'Rahul Sharma',   email: 'rahul@edtech.com',   employeeId: 'EMP001', officeCoords: { lat: defaultLat, lng: defaultLng }, salaryDetails: { baseSalary: 35000, bonus: 2000, deductions: 1500 } },
        { name: 'Priya Patel',    email: 'priya@edtech.com',    employeeId: 'EMP002', officeCoords: { lat: defaultLat, lng: defaultLng }, salaryDetails: { baseSalary: 40000, bonus: 3000, deductions: 2000 } },
        { name: 'Ashwini Rajput', email: 'ashwini@edtech.com', employeeId: 'EMP003', officeCoords: { lat: defaultLat, lng: defaultLng }, salaryDetails: { baseSalary: 45000, bonus: 5000, deductions: 2500 } },
        { name: 'Jane Smith',     email: 'jane@edtech.com',    employeeId: 'EMP004', officeCoords: { lat: defaultLat, lng: defaultLng }, salaryDetails: { baseSalary: 42000, bonus: 4000, deductions: 1800 } },
      ];

      for (const emp of testEmployees) {
        const hashedPwd = await bcrypt.hash('emp123', salt);
        await User.create({ ...emp, password: hashedPwd, role: 'employee' });
        console.log(`✅ Employee Created: ${emp.email} / emp123`);
      }
    }
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
  }
};

connectDB();

// Serve frontend build if available in production
const frontendDist = path.join(__dirname, '../admin/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api') || req.url.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ msg: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
// Global Error Handler
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err.stack);
  res.status(500).json({ msg: 'Internal Server Error', error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

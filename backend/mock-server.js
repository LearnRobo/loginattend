const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Mock Data
const employees = [
  { _id: '1', name: 'John Doe', email: 'john@edtech.com', employeeId: 'EMP001', role: 'employee', salaryDetails: { baseSalary: 5000 } },
  { _id: '2', name: 'Jane Smith', email: 'jane@edtech.com', employeeId: 'EMP002', role: 'employee', salaryDetails: { baseSalary: 6000 } }
];

const attendanceLogs = [
  { _id: 'a1', user: { name: 'John Doe', employeeId: 'EMP001' }, date: '2026-05-08', status: 'present', checkIn: { time: new Date().toISOString() }, checkOut: { time: new Date().toISOString() } },
  { _id: 'a2', user: { name: 'Jane Smith', employeeId: 'EMP002' }, date: '2026-05-08', status: 'present', checkIn: { time: new Date().toISOString() } }
];

const leaveRequests = [
  { _id: 'L1', user: { name: 'John Doe', employeeId: 'EMP001' }, startDate: '2026-05-10', endDate: '2026-05-12', type: 'sick', reason: 'Fever', status: 'pending', appliedAt: new Date().toISOString() }
];

const settings = {
  officeLat: 12.9716,
  officeLong: 77.5946,
  allowedRadius: 500
};

// Mock Routes
app.post('/api/auth/login', (req, res) => {
  res.json({
    token: 'mock-jwt-token',
    user: { id: 'admin-id', name: 'Super Admin', email: 'admin@edtech.com', role: 'admin' }
  });
});

app.get('/api/employees', (req, res) => {
  res.json(employees);
});

app.post('/api/employees', (req, res) => {
  const newEmp = { ...req.body, _id: Date.now().toString() };
  employees.push(newEmp);
  res.json(newEmp);
});

app.get('/api/attendance/all', (req, res) => {
  res.json(attendanceLogs);
});

app.get('/api/settings', (req, res) => {
  res.json(settings);
});

app.post('/api/settings', (req, res) => {
  Object.assign(settings, req.body);
  res.json(settings);
});

app.get('/api/payroll', (req, res) => {
  const payroll = employees.map(emp => ({
    ...emp,
    presentDays: 22,
    absentDays: 2,
    netSalary: emp.salaryDetails.baseSalary - 200 + 500 // Mock calc
  }));
  res.json(payroll);
});

app.post('/api/leaves/apply', (req, res) => {
  const newLeave = { ...req.body, _id: 'L' + Date.now(), status: 'pending', appliedAt: new Date().toISOString() };
  leaveRequests.push(newLeave);
  res.json(newLeave);
});

app.get('/api/leaves/my', (req, res) => {
  res.json(leaveRequests);
});

app.get('/api/leaves/all', (req, res) => {
  res.json(leaveRequests);
});

app.put('/api/leaves/:id', (req, res) => {
  const leave = leaveRequests.find(l => l._id === req.params.id);
  if (leave) leave.status = req.body.status;
  res.json(leave);
});

app.post('/api/attendance/check-in', (req, res) => {
  const { lat, lng, face } = req.body;
  
  // Simple distance check
  const R = 6371e3; // meters
  const φ1 = lat * Math.PI / 180;
  const φ2 = settings.officeLat * Math.PI / 180;
  const Δφ = (settings.officeLat - lat) * Math.PI / 180;
  const Δλ = (settings.officeLong - lng) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  if (distance > settings.allowedRadius) {
    return res.status(400).json({ msg: `Outside allowed range (${Math.round(distance)}m away)` });
  }

  const newLog = { 
    _id: Date.now().toString(), 
    user: { name: 'Current User', employeeId: 'EMP001' }, 
    date: new Date().toISOString().split('T')[0], 
    status: 'present', 
    checkIn: { time: new Date().toISOString() } 
  };
  attendanceLogs.push(newLog);
  res.json(newLog);
});

app.get('/api/attendance/history', (req, res) => {
  res.json(attendanceLogs);
});

app.get('/', (req, res) => res.send('Mock API Running'));

const PORT = 5000;
app.listen(PORT, () => console.log(`Mock Server running on port ${PORT}`));

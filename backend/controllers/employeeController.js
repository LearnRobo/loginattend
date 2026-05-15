const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' }).select('-password');
    res.json(employees);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id).select('-password');
    if (!employee) return res.status(404).json({ msg: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.addEmployee = async (req, res) => {
  try {
    const { name, email, password, employeeId, officeLat, officeLng, baseSalary, bonus, deductions, assignedOffices } = req.body;
    
    // Check if email or employee ID already exists
    let user = await User.findOne({ $or: [{ email }, { employeeId }] });
    if (user) return res.status(400).json({ msg: 'User or Employee ID already exists' });

    let finalAssignedOffices = assignedOffices;
    if (typeof assignedOffices === 'string') {
      finalAssignedOffices = [assignedOffices];
    }

    user = new User({
      name,
      email,
      password,
      employeeId,
      role: 'employee',
      salaryDetails: {
        baseSalary: parseFloat(baseSalary) || 0,
        bonus: parseFloat(bonus) || 0,
        deductions: parseFloat(deductions) || 0
      },
      officeCoords: {
        lat: parseFloat(officeLat),
        lng: parseFloat(officeLng)
      },
      assignedOffices: finalAssignedOffices || []
    });
// ... (rest of the code)

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    if (req.file) {
      user.faceImage = req.file.filename; // Just save the filename
    }

    await user.save();
    res.json(user);
  } catch (err) {
    console.error('Add Employee Server Error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { name, email, employeeId, officeLat, officeLng, baseSalary, bonus, deductions, password, assignedOffices } = req.body;
    let employee = await User.findById(req.params.id);
    if (!employee) return res.status(404).json({ msg: 'Employee not found' });

    // Update basic info
    if (name) employee.name = name;
    if (email) employee.email = email;
    if (employeeId) employee.employeeId = employeeId;
    
    if (assignedOffices !== undefined) {
      let finalOffices = assignedOffices;
      if (typeof assignedOffices === 'string') {
        finalOffices = [assignedOffices];
      }
      employee.assignedOffices = finalOffices || [];
    }
    
    // Update Password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      employee.password = await bcrypt.hash(password, salt);
    }

    // Update Salary Details
    if (baseSalary !== undefined) {
      employee.salaryDetails = {
        baseSalary: parseFloat(baseSalary) || 0,
        bonus: parseFloat(bonus) || 0,
        deductions: parseFloat(deductions) || 0
      };
    }

    // Update Office Coordinates
    if (officeLat && officeLng) {
      employee.officeCoords = {
        lat: parseFloat(officeLat),
        lng: parseFloat(officeLng)
      };
    }

    // Update Photo
    if (req.file) {
      employee.faceImage = req.file.filename;
    }

    await employee.save();
    res.json(employee);
  } catch (err) {
    console.error('Update Employee Error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Employee deleted' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

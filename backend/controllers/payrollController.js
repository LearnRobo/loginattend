const User = require('../models/User');
const Attendance = require('../models/Attendance');

exports.getPayroll = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' }).select('-password');

    const payrollData = await Promise.all(employees.map(async (emp) => {
      // Count present attendance records for this employee
      const actualPresent = await Attendance.countDocuments({ user: emp._id, status: 'present' });
      
      // If no attendance records exist yet (e.g., fresh database), default to 22 days for demo realism
      const presentDays = actualPresent > 0 ? actualPresent : 22;
      const totalWorkingDays = 24;

      const baseSalary = emp.salaryDetails?.baseSalary || 35000;
      const bonus = emp.salaryDetails?.bonus || 0;
      const deductions = emp.salaryDetails?.deductions || 0;

      // Pro-rata base salary calculation based on attendance
      const dailyWage = baseSalary / totalWorkingDays;
      const calculatedPay = (dailyWage * presentDays) + bonus - deductions;
      const netSalary = Math.max(0, Math.round(calculatedPay));

      return {
        _id: emp._id,
        name: emp.name,
        employeeId: emp.employeeId,
        presentDays,
        salaryDetails: emp.salaryDetails,
        netSalary
      };
    }));

    res.json(payrollData);
  } catch (err) {
    console.error('Payroll Error:', err);
    res.status(500).json({ msg: 'Server Error during payroll calculation' });
  }
};

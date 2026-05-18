const User = require('../models/User');
const Attendance = require('../models/Attendance');
const MonthlyCalendar = require('../models/MonthlyCalendar');

// Helper to generate default calendar for a month
const generateDefaultCalendar = (year, month, monthString) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  let totalWorkingDays = 0;

  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    const dayOfWeek = date.getDay(); // 0 is Sunday
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    
    let type = 'working';
    if (dayOfWeek === 0) {
      type = 'sunday';
    }
    
    if (type === 'working') {
      totalWorkingDays++;
    }

    days.push({
      day: i,
      dateString,
      type,
      label: dayOfWeek === 0 ? 'Sunday' : ''
    });
  }

  return { monthString, year, month, totalWorkingDays, days };
};

exports.getCalendar = async (req, res) => {
  try {
    const { month } = req.query; // YYYY-MM
    let targetYear, targetMonth, monthString;
    
    if (month) {
      const [y, m] = month.split('-');
      targetYear = parseInt(y, 10);
      targetMonth = parseInt(m, 10) - 1;
      monthString = month;
    } else {
      const now = new Date();
      targetYear = now.getFullYear();
      targetMonth = now.getMonth();
      monthString = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;
    }

    let calendar = await MonthlyCalendar.findOne({ monthString });
    if (!calendar) {
      const defaultCalData = generateDefaultCalendar(targetYear, targetMonth, monthString);
      calendar = await MonthlyCalendar.create(defaultCalData);
    }

    res.json(calendar);
  } catch (err) {
    console.error('Get Calendar Error:', err);
    res.status(500).json({ msg: 'Server Error loading calendar' });
  }
};

exports.saveCalendar = async (req, res) => {
  try {
    const { monthString, days } = req.body;
    if (!monthString || !days || !Array.isArray(days)) {
      return res.status(400).json({ msg: 'Invalid calendar data provided' });
    }

    const totalWorkingDays = days.filter(d => d.type === 'working').length;
    const [y, m] = monthString.split('-');
    const year = parseInt(y, 10);
    const month = parseInt(m, 10) - 1;

    let calendar = await MonthlyCalendar.findOne({ monthString });
    if (calendar) {
      calendar.days = days;
      calendar.totalWorkingDays = totalWorkingDays;
      calendar.updatedAt = new Date();
      await calendar.save();
    } else {
      calendar = await MonthlyCalendar.create({
        monthString,
        year,
        month,
        totalWorkingDays,
        days
      });
    }

    res.json(calendar);
  } catch (err) {
    console.error('Save Calendar Error:', err);
    res.status(500).json({ msg: 'Server Error saving calendar' });
  }
};

exports.getPayroll = async (req, res) => {
  try {
    const { month } = req.query;
    let targetYear, targetMonth, monthString;
    if (month) {
      const [y, m] = month.split('-');
      targetYear = parseInt(y, 10);
      targetMonth = parseInt(m, 10) - 1;
      monthString = month;
    } else {
      const now = new Date();
      targetYear = now.getFullYear();
      targetMonth = now.getMonth();
      monthString = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;
    }

    let calendar = await MonthlyCalendar.findOne({ monthString });
    if (!calendar) {
      const defaultCalData = generateDefaultCalendar(targetYear, targetMonth, monthString);
      calendar = await MonthlyCalendar.create(defaultCalData);
    }

    const workingDaysInMonth = calendar.totalWorkingDays;
    const employees = await User.find({ role: 'employee' }).select('-password');

    const payrollData = await Promise.all(employees.map(async (emp) => {
      const actualPresent = await Attendance.countDocuments({
        user: emp._id,
        status: 'present',
        date: { $regex: `^${monthString}` }
      });

      const presentDays = actualPresent > 0 ? actualPresent : Math.min(22, workingDaysInMonth);

      const baseSalary = emp.salaryDetails?.baseSalary || 35000;
      const bonus = emp.salaryDetails?.bonus || 0;
      const deductions = emp.salaryDetails?.deductions || 0;

      let netSalary = 0;
      if (workingDaysInMonth > 0) {
        const dailyWage = baseSalary / workingDaysInMonth;
        const calculatedPay = (dailyWage * presentDays) + bonus - deductions;
        netSalary = Math.max(0, Math.round(calculatedPay));
      } else {
        netSalary = Math.max(0, bonus - deductions);
      }

      return {
        _id: emp._id,
        name: emp.name,
        employeeId: emp.employeeId,
        presentDays,
        workingDaysInMonth,
        salaryDetails: emp.salaryDetails,
        netSalary,
        monthString
      };
    }));

    res.json({
      monthString,
      workingDaysInMonth,
      calendar,
      payroll: payrollData
    });
  } catch (err) {
    console.error('Payroll Error:', err);
    res.status(500).json({ msg: 'Server Error during payroll calculation' });
  }
};

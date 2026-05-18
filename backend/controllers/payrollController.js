const User = require('../models/User');
const Attendance = require('../models/Attendance');
const MonthlyCalendar = require('../models/MonthlyCalendar');
const Leave = require('../models/Leave');

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

const countApprovedLeaveDaysInMonth = (approvedLeaves, year, month) => {
  let leaveDays = 0;
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

  for (const leave of approvedLeaves) {
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);

    if (start <= monthEnd && end >= monthStart) {
      let curr = new Date(start);
      while (curr <= end) {
        if (curr.getFullYear() === year && curr.getMonth() === month) {
          leaveDays++;
        }
        curr.setDate(curr.getDate() + 1);
      }
    }
  }
  return leaveDays;
};

exports.getCalendar = async (req, res) => {
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
      // 1. Physical attendance punches for this month
      const actualPresent = await Attendance.countDocuments({
        user: emp._id,
        status: 'present',
        date: { $regex: `^${monthString}` }
      });

      // 2. Approved leave queries
      const approvedLeaves = await Leave.find({
        user: emp._id,
        status: 'approved'
      });
      const paidQuotaLeaves = approvedLeaves.filter(l => ['sick', 'casual', 'earned'].includes(l.type));
      const absentQuotaLeaves = approvedLeaves.filter(l => ['paid', 'unpaid'].includes(l.type));

      const leaveDays = countApprovedLeaveDaysInMonth(paidQuotaLeaves, targetYear, targetMonth);
      const absentLeaveDays = countApprovedLeaveDaysInMonth(absentQuotaLeaves, targetYear, targetMonth);

      let attendanceCount = actualPresent;
      if (actualPresent === 0 && leaveDays === 0 && absentLeaveDays === 0) {
        attendanceCount = Math.min(22, workingDaysInMonth);
      }

      const presentDays = Math.max(0, Math.min(workingDaysInMonth, attendanceCount + leaveDays) - absentLeaveDays);

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
        designation: emp.designation || 'Software Engineer',
        department: emp.department || 'Engineering',
        bankDetails: emp.bankDetails || {
          bankName: 'HDFC Bank',
          accountNumber: '50100293847281',
          ifscCode: 'HDFC0001234',
          panNumber: 'ABCDE1234F',
          uanNumber: '100928374652',
          pfNumber: 'MH/BAN/0019283/000/0001234'
        },
        presentDays,
        attendanceCount,
        leaveDays,
        absentLeaveDays,
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

exports.getMyPayroll = async (req, res) => {
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
    const emp = await User.findById(req.user.id).select('-password');
    if (!emp) {
      return res.status(404).json({ msg: 'Employee not found' });
    }

    const actualPresent = await Attendance.countDocuments({
      user: emp._id,
      status: 'present',
      date: { $regex: `^${monthString}` }
    });

    const approvedLeaves = await Leave.find({
      user: emp._id,
      status: 'approved'
    });
    const paidQuotaLeaves = approvedLeaves.filter(l => ['sick', 'casual', 'earned'].includes(l.type));
    const absentQuotaLeaves = approvedLeaves.filter(l => ['paid', 'unpaid'].includes(l.type));

    const leaveDays = countApprovedLeaveDaysInMonth(paidQuotaLeaves, targetYear, targetMonth);
    const absentLeaveDays = countApprovedLeaveDaysInMonth(absentQuotaLeaves, targetYear, targetMonth);

    let attendanceCount = actualPresent;
    if (actualPresent === 0 && leaveDays === 0 && absentLeaveDays === 0) {
      attendanceCount = Math.min(22, workingDaysInMonth);
    }

    const presentDays = Math.max(0, Math.min(workingDaysInMonth, attendanceCount + leaveDays) - absentLeaveDays);

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

    res.json({
      _id: emp._id,
      name: emp.name,
      employeeId: emp.employeeId,
      designation: emp.designation || 'Software Engineer',
      department: emp.department || 'Engineering',
      bankDetails: emp.bankDetails || {
        bankName: 'HDFC Bank',
        accountNumber: '50100293847281',
        ifscCode: 'HDFC0001234',
        panNumber: 'ABCDE1234F',
        uanNumber: '100928374652',
        pfNumber: 'MH/BAN/0019283/000/0001234'
      },
      presentDays,
      attendanceCount,
      leaveDays,
      absentLeaveDays,
      workingDaysInMonth,
      salaryDetails: emp.salaryDetails,
      netSalary,
      monthString,
      calendar
    });
  } catch (err) {
    console.error('Get My Payroll Error:', err);
    res.status(500).json({ msg: 'Server Error loading salary details' });
  }
};

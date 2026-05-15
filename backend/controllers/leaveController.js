const Leave = require('../models/Leave');

exports.applyLeave = async (req, res) => {
  try {
    const { startDate, endDate, type, reason } = req.body;
    const leave = new Leave({
      user: req.user.id,
      startDate,
      endDate,
      type,
      reason
    });
    await leave.save();
    res.json(leave);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ user: req.user.id }).sort({ appliedAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find().populate('user', 'name employeeId').sort({ appliedAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ msg: 'Leave request not found' });

    leave.status = status;
    await leave.save();
    res.json(leave);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

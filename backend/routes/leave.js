const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus
} = require('../controllers/leaveController');

router.post('/apply', auth, applyLeave);
router.get('/my', auth, getMyLeaves);
router.get('/all', auth, adminAuth, getAllLeaves);
router.put('/:id', auth, adminAuth, updateLeaveStatus);

module.exports = router;

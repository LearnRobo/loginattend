const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth, adminAuth } = require('../middleware/auth');
const {
  checkIn,
  checkOut,
  getHistory,
  getAllAttendance,
  getStats,
  resetAttendance
} = require('../controllers/attendanceController');

const upload = multer({ dest: '../uploads/temp/' });

router.post('/check-in', auth, upload.single('faceImage'), checkIn);
router.post('/check-out', auth, upload.single('faceImage'), checkOut);
router.get('/history', auth, getHistory);
router.get('/all', auth, adminAuth, getAllAttendance);
router.get('/stats', auth, adminAuth, getStats);
router.delete('/reset', auth, adminAuth, resetAttendance);

module.exports = router;

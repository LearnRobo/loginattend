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

const path = require('path');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/temp/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = file.originalname ? path.extname(file.originalname) : '.jpg';
    cb(null, uniqueSuffix + (ext || '.jpg'));
  }
});

const upload = multer({ storage });

router.post('/check-in', auth, upload.single('faceImage'), checkIn);
router.post('/check-out', auth, upload.single('faceImage'), checkOut);
router.get('/history', auth, getHistory);
router.get('/all', auth, adminAuth, getAllAttendance);
router.get('/stats', auth, adminAuth, getStats);
router.delete('/reset', auth, adminAuth, resetAttendance);

module.exports = router;

const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const { getPayroll, getCalendar, saveCalendar } = require('../controllers/payrollController');

router.get('/calendar', auth, adminAuth, getCalendar);
router.post('/calendar', auth, adminAuth, saveCalendar);
router.get('/', auth, adminAuth, getPayroll);

module.exports = router;

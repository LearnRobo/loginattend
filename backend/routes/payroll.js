const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const { getPayroll } = require('../controllers/payrollController');

router.get('/', auth, adminAuth, getPayroll);

module.exports = router;

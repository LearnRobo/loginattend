const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth, adminAuth } = require('../middleware/auth');
const {
  getAllEmployees,
  getEmployeeById,
  addEmployee,
  updateEmployee,
  deleteEmployee
} = require('../controllers/employeeController');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, '../uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

router.get('/', auth, adminAuth, getAllEmployees);
router.get('/:id', auth, adminAuth, getEmployeeById);
router.post('/', auth, adminAuth, upload.single('faceImage'), addEmployee);
router.put('/:id', auth, adminAuth, upload.single('faceImage'), updateEmployee);
router.delete('/:id', auth, adminAuth, deleteEmployee);

module.exports = router;

const express = require('express');
const router = express.Router();
const Office = require('../models/Office');
const { auth, adminAuth } = require('../middleware/auth');

// @route   GET api/offices
// @desc    Get all offices
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const offices = await Office.find().sort({ name: 1 });
    res.json(offices);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   POST api/offices
// @desc    Add a new office
// @access  Private/Admin
router.post('/', auth, adminAuth, async (req, res) => {
  const { name, lat, lng, address, radius } = req.body;
  try {
    let office = await Office.findOne({ name });
    if (office) return res.status(400).json({ msg: 'Office already exists' });

    office = new Office({
      name,
      location: { lat, lng },
      address,
      radius: radius || 100
    });

    await office.save();
    res.json(office);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/offices/:id
// @desc    Update an office
// @access  Private/Admin
router.put('/:id', auth, adminAuth, async (req, res) => {
  const { name, lat, lng, address, radius } = req.body;
  try {
    let office = await Office.findById(req.params.id);
    if (!office) return res.status(404).json({ msg: 'Office not found' });

    office.name = name || office.name;
    office.location = {
      lat: lat || office.location.lat,
      lng: lng || office.location.lng
    };
    office.address = address || office.address;
    office.radius = radius || office.radius;

    await office.save();
    res.json(office);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/offices/:id
// @desc    Delete an office
// @access  Private/Admin
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    await Office.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Office removed' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;

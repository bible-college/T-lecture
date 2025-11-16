// src/api/v1/index.js
const express = require('express');
const userRoutes = require('./user.routes');
const unitRoutes = require('./unit.routes');
const distanceRoutes = require('./distance.routes');

const router = express.Router();

// /api/v1/users
router.use('/users', userRoutes);

// /api/v1/locations
router.use('/units', unitRoutes);

// /api/v1/distances
router.use('/distances', distanceRoutes);

module.exports = router;

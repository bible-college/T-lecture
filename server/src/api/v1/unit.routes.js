// server/src/api/v1/unit.routes.js
const express = require('express');
const router = express.Router();
const unitController = require('../../modules/unit/controllers/unit.controller');

// POST /api/v1/units
router.post('/', unitController.createUnit);

// GET /api/v1/units
router.get('/', unitController.getUnits);

// GET /api/v1/units/:id
router.get('/:id', unitController.getUnit);

// PUT /api/v1/units/:id
router.put('/:id', unitController.updateUnit);

// DELETE /api/v1/units/:id
router.delete('/:id', unitController.deleteUnit);

module.exports = router;

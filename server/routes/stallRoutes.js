const express = require('express');
const router = express.Router();
const { getStalls, createStall, recordSale, getSales } = require('../controllers/stallController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Stall Config Routes
router.route('/')
    .get(protect, getStalls)
    .post(protect, authorize('superadmin', 'manager'), createStall);

// Sales Routes
router.route('/sales')
    .post(protect, authorize('stall', 'manager', 'superadmin'), recordSale)
    .get(protect, authorize('stall', 'manager', 'superadmin'), getSales);

module.exports = router;

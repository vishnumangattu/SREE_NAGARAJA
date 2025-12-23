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

router.route('/sales/:id')
    .put(protect, authorize('stall', 'manager', 'superadmin'), require('../controllers/stallController').updateSale);

module.exports = router;

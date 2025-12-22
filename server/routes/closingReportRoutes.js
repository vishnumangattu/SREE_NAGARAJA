const express = require('express');
const router = express.Router();
const {
    createReport,
    getDailyTotal,
    getReports
} = require('../controllers/closingReportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, authorize('counter'), createReport)
    .get(protect, authorize('superadmin', 'manager', 'counter'), getReports); // Added counter to view own reports

router.route('/daily-total')
    .get(protect, authorize('superadmin', 'manager', 'counter'), getDailyTotal);

module.exports = router;


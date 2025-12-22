const express = require('express');
const router = express.Router();
const {
    createReceipt,
    getReceipts,
    getReceiptById,
    deleteReceipt,
    getManagerStats,
    updateReceipt,
    getClosingReport,
    createClosingReport,
    getUserPerformanceStats,
    toggleBlockStatus
} = require('../controllers/receiptController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, authorize('counter', 'manager', 'superadmin'), createReceipt)
    .get(protect, authorize('counter', 'manager', 'superadmin'), getReceipts);

router.get('/stats/manager', protect, authorize('manager', 'superadmin'), getManagerStats);
router.get('/stats/user-performance', protect, authorize('manager', 'superadmin'), getUserPerformanceStats);

router.route('/:id')
    .get(protect, getReceiptById)
    .put(protect, authorize('counter', 'manager', 'superadmin'), updateReceipt) // Add PUT
    .delete(protect, authorize('manager', 'superadmin'), deleteReceipt);

router.route('/:id/block').put(protect, authorize('manager', 'superadmin'), toggleBlockStatus);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getVazhipads, createVazhipad, updateVazhipad, deleteVazhipad } = require('../controllers/vazhipadController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getVazhipads) // Authenticated users can view
    .post(protect, authorize('superadmin', 'manager'), createVazhipad);

router.route('/:id')
    .put(protect, authorize('superadmin', 'manager'), updateVazhipad)
    .delete(protect, authorize('superadmin', 'manager'), deleteVazhipad);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getUsers, createUser, deleteUser, changePassword } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, authorize('superadmin', 'manager'), getUsers)
    .post(protect, authorize('superadmin', 'manager'), createUser);

router.route('/:id')
    .delete(protect, authorize('superadmin', 'manager'), deleteUser);

router.route('/change-password')
    .put(protect, changePassword);

module.exports = router;

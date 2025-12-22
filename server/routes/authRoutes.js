const express = require('express');
const router = express.Router();
const { loginUser } = require('../controllers/authController');
const { logoutUser, getActiveUsers, getActivityReport } = require('../controllers/userActivityController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.post('/logout', logoutUser); // Protected handling in controller if needed, but often logout is public-ish if just ID sent

router.get('/active-users', protect, authorize('superadmin'), getActiveUsers);
router.get('/activity-report', protect, authorize('superadmin'), getActivityReport);

module.exports = router;

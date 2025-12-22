const UserActivity = require('../models/UserActivity');

// @desc    Log out user (Record logout time)
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
    const { activityId } = req.body;

    if (activityId) {
        const activity = await UserActivity.findById(activityId);
        if (activity) {
            activity.logoutTime = new Date();
            await activity.save();
        }
    }
    // Even if no activityId, we treat request as successful
    res.json({ message: 'Logged out successfully' });
};

// @desc    Get currently active users
// @route   GET /api/auth/active-users
// @access  Private (Admin)
const getActiveUsers = async (req, res) => {
    // Users with no logout time implies they are active
    const activeSessions = await UserActivity.find({ logoutTime: null })
        .populate('user', 'name username role assignedStall')
        .sort({ loginTime: -1 });

    // Filter out superadmin and manager
    const filteredSessions = activeSessions.filter(session =>
        session.user &&
        session.user.role !== 'superadmin' &&
        session.user.role !== 'manager'
    );

    res.json(filteredSessions);
};

// @desc    Get activity report for a date
// @route   GET /api/auth/activity-report
// @access  Private (Admin)
const getActivityReport = async (req, res) => {
    const { date } = req.query; // 'YYYY-MM-DD'

    let query = {};
    if (date) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        query.loginTime = { $gte: start, $lte: end };
    }

    const report = await UserActivity.find(query)
        .populate('user', 'name username role')
        .sort({ loginTime: -1 });

    // Filter out superadmin and manager
    const filteredReport = report.filter(log =>
        log.user &&
        log.user.role !== 'superadmin' &&
        log.user.role !== 'manager'
    );

    res.json(filteredReport);
};

module.exports = { logoutUser, getActiveUsers, getActivityReport };

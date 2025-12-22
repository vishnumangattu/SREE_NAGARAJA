const User = require('../models/User');
const UserActivity = require('../models/UserActivity');
const generateToken = require('../utils/generateToken');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (user && (await user.matchPassword(password))) {
        if (user.status !== 'active') {
            res.status(401);
            throw new Error('User account is inactive. Contact Admin.');
        }

        // Log Activity
        const activity = await UserActivity.create({
            user: user._id,
            loginTime: new Date(),
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({
            _id: user._id,
            name: user.name,
            username: user.username,
            role: user.role,
            assignedStall: user.assignedStall,
            token: generateToken(user._id),
            activityId: activity._id // Send back to client for logout tracking
        });
    } else {
        res.status(401);
        throw new Error('Invalid username or password');
    }
};

// @desc    Register a new user (admin/manager only)
// @route   POST /api/users
// @access  Private/Admin/Manager
const registerUser = async (req, res) => {
    const { name, username, password, role, assignedStall } = req.body;

    const userExists = await User.findOne({ username });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        name,
        username,
        password,
        role,
        assignedStall: assignedStall || null,
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            username: user.username,
            role: user.role,
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
};

module.exports = { loginUser, registerUser };

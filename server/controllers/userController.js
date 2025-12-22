const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Manager/Admin
const getUsers = async (req, res) => {
    const users = await User.find({}).select('-password');
    res.json(users);
};

// @desc    Register a new user (admin/manager only)
// @route   POST /api/users
// @access  Private/Admin/Manager
const createUser = async (req, res) => {
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

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin/Manager
const deleteUser = async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        if (user.role === 'superadmin') {
            res.status(400);
            throw new Error('Cannot delete Super Admin');
        }
        await user.deleteOne();
        res.json({ message: 'User removed' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
};

// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    if (user && (await user.matchPassword(currentPassword))) {
        user.password = newPassword;
        await user.save();
        res.json({ message: 'Password updated successfully' });
    } else {
        res.status(401);
        throw new Error('Invalid current password');
    }
};

module.exports = { getUsers, createUser, deleteUser, changePassword };

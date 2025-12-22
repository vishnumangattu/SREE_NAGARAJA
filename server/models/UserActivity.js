const mongoose = require('mongoose');

const userActivitySchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        loginTime: {
            type: Date,
            required: true,
            default: Date.now,
        },
        logoutTime: {
            type: Date,
        },
        ipAddress: {
            type: String,
        },
        userAgent: {
            type: String,
        }
    },
    {
        timestamps: true,
    }
);

const UserActivity = mongoose.model('UserActivity', userActivitySchema);

module.exports = UserActivity;

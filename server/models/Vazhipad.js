const mongoose = require('mongoose');

const vazhipadSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        code: {
            type: String,
            required: true,
            unique: true,
        },
        rate: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
        },
        requiresDateConfirmation: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const Vazhipad = mongoose.model('Vazhipad', vazhipadSchema);

module.exports = Vazhipad;

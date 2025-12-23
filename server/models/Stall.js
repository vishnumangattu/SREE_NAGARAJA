const mongoose = require('mongoose');

const stallSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        type: {
            type: String,
            default: 'Stall',
        },
        description: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

const Stall = mongoose.model('Stall', stallSchema);

module.exports = Stall;

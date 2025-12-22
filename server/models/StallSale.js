const mongoose = require('mongoose');

const stallSaleSchema = mongoose.Schema(
    {
        stall: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Stall',
            required: true,
        },
        items: [
            {
                name: { type: String, required: true },
                rate: { type: Number, required: true },
                quantity: { type: Number, required: true },
                amount: { type: Number, required: true },
            }
        ],
        totalAmount: {
            type: Number,
            required: true,
        },
        soldBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

const StallSale = mongoose.model('StallSale', stallSaleSchema);

module.exports = StallSale;

const mongoose = require('mongoose');

const receiptSchema = mongoose.Schema(
    {
        receiptNumber: {
            type: Number,
            // unique: true, // Removed to allow multiple docs (dates) per transaction
        },
        date: {
            type: Date,
            default: Date.now,
        },
        vazhipaduDate: {
            type: Date, // Reverted to Single Date per document
            required: true
        },
        recurrenceDates: {
            type: [Date], // Stores the full list of dates for this transaction (for printing)
        },
        paymentType: {
            type: String, // 'Cash', 'GPay'
            default: 'Cash'
        },
        vazhipadu: {
            type: String, // English key
            required: true
        },
        vazhipaduType: {
            type: String, // Malayalam/Display name
        },
        mode: {
            type: String, // 'One Day', 'Every Week', etc.
        },
        // Items in this context are Persons added to the receipt for the SAME vazhipad
        items: [
            {
                name: { type: String, required: true }, // Person Name
                nakshatram: { type: String },
                count: { type: Number, default: 1 },
                rate: { type: Number, required: true },
                amount: { type: Number, required: true },
            }
        ],
        totalAmount: {
            type: Number,
            required: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        deletedAt: {
            type: Date,
        },
        deleteReason: {
            type: String,
        },
        postingDetails: {
            address: { type: String },
            pincode: { type: String },
            phone: { type: String }
        },
    },
    {
        timestamps: true,
    }
);

const Counter = require('./Counter');

receiptSchema.pre('save', async function () {
    if (this.isNew && !this.receiptNumber) {
        try {
            const counter = await Counter.findByIdAndUpdate(
                { _id: 'receiptNumber' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            this.receiptNumber = counter.seq;
        } catch (error) {
            throw error;
        }
    }
});

const Receipt = mongoose.model('Receipt', receiptSchema);

module.exports = Receipt;

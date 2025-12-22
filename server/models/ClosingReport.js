const mongoose = require('mongoose');

const closingReportSchema = mongoose.Schema(
    {
        counterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        denominations: {
            // Store as key-value pairs e.g. "2000": 5, "500": 10
            type: Map,
            of: Number,
            required: true,
        },
        totalCashEntered: {
            type: Number,
            required: true,
        },
        receiptTotal: {
            type: Number,
            required: true,
        },
        discrepancy: {
            type: Number,
            required: true, // totalCashEntered - receiptTotal
        },
        notes: {
            type: String,
        }
    },
    {
        timestamps: true,
    }
);

const ClosingReport = mongoose.model('ClosingReport', closingReportSchema);

module.exports = ClosingReport;

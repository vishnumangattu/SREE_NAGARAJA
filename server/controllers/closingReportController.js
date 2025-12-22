const ClosingReport = require('../models/ClosingReport');
const Receipt = require('../models/Receipt');

// @desc    Get daily total for the logged-in counter
// @route   GET /api/closing-report/daily-total
// @access  Private (Counter)
const getDailyTotal = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Aggregate breakdown by payment type
        const paymentStats = await Receipt.aggregate([
            {
                $match: {
                    createdBy: req.user._id,
                    createdAt: { $gte: today, $lt: tomorrow },
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: "$paymentType",
                    total: { $sum: "$totalAmount" }
                }
            }
        ]);

        // Convert array to object for easier access
        const totals = paymentStats.reduce((acc, curr) => {
            acc[curr._id] = curr.total;
            return acc;
        }, {});

        const cashTotal = totals['Cash'] || 0;
        const moneyOrderTotal = totals['MoneyOrder'] || 0;
        const onlineTxnTotal = totals['OnlineTransaction'] || 0;
        const upiTotal = (totals['UPI'] || 0) + (totals['GPay'] || 0);

        const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

        res.json({
            cashTotal,
            upiTotal,
            moneyOrderTotal,
            onlineTxnTotal,
            total: grandTotal
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new closing report
// @route   POST /api/closing-report
// @access  Private (Counter)
const createReport = async (req, res) => {
    try {
        const { denominations, totalCashEntered, receiptTotal, notes } = req.body;

        const discrepancy = totalCashEntered - receiptTotal;

        const report = await ClosingReport.create({
            counterId: req.user._id,
            date: new Date(),
            denominations,
            totalCashEntered,
            receiptTotal,
            discrepancy,
            notes
        });

        res.status(201).json(report);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all closing reports
// @route   GET /api/closing-report
// @access  Private (Admin, Manager)
const getReports = async (req, res) => {
    try {
        let query = {};

        // If user is counter, restrict to own reports
        if (req.user.role === 'counter') {
            query.counterId = req.user._id;
        } else {
            // Managers/Admins can filter by counterId
            if (req.query.counterId) {
                query.counterId = req.query.counterId;
            }
        }

        // Date filtering
        if (req.query.startDate || req.query.endDate) {
            query.createdAt = {};
            if (req.query.startDate) {
                const start = new Date(req.query.startDate);
                start.setHours(0, 0, 0, 0);
                query.createdAt.$gte = start;
            }
            if (req.query.endDate) {
                const end = new Date(req.query.endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        const reports = await ClosingReport.find(query)
            .populate('counterId', 'name')
            .sort({ createdAt: -1 });

        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getDailyTotal,
    createReport,
    getReports
};

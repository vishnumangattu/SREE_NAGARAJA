const Receipt = require('../models/Receipt');
const User = require('../models/User');
const mongoose = require('mongoose');
const Counter = require('../models/Counter');

// @desc    Create a new receipt
// @route   POST /api/receipts
// @access  Private (Counter, Manager)
const createReceipt = async (req, res) => {
    // New payload structure matching user request
    // { vazhipadu, vazhipaduType, vazhipaddate, currentdate, paymentType, mode, items, postingDetails }
    const { vazhipadu, vazhipaduType, vazhipaddate, currentdate, paymentType, mode, items, postingDetails } = req.body;



    if (!items || items.length === 0) {
        res.status(400);
        throw new Error('No items/persons added');
    }

    // 1. Get Next Receipt Number
    const counter = await Counter.findByIdAndUpdate(
        { _id: 'receiptNumber' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    const nextReceiptNo = counter.seq;

    // 2. Prepare Data
    const datesToProcess = Array.isArray(vazhipaddate) ? vazhipaddate : [vazhipaddate || new Date()];
    const numberOfDates = datesToProcess.length;

    // Calculate Per-Day Amounts
    // The frontend sends the TOTAL (multiplied) amount. We need to divide it back for per-day storage.
    // item.amount is total. 
    // Wait, if frontend sends 400 for 4 days, per day is 100.

    const processedItems = items.map(item => ({
        ...item,
        amount: (Number(item.amount) || 0) / numberOfDates
    }));

    const perDayTotal = processedItems.reduce((acc, item) => acc + item.amount, 0);

    const createdReceipts = [];

    // 3. Loop and Create
    for (const dateStr of datesToProcess) {
        const receipt = new Receipt({
            receiptNumber: nextReceiptNo, // Force same number
            vazhipadu,
            vazhipaduType,
            date: currentdate || new Date(),
            vazhipaduDate: dateStr, // Single date
            recurrenceDates: datesToProcess, // Store all for reference
            paymentType,
            mode,
            items: processedItems,
            totalAmount: perDayTotal,
            postingDetails,
            createdBy: req.user._id,
        });

        // Bypass pre-save hook for receiptNumber since we provided it? 
        // We modified schema to NOT be unique, but pre-save might still run. 
        // We should check Receipt.js pre-save. It checks `if (this.isNew)`.
        // We need to modify Receipt.js or set a flag to skip auto-generation if provided.
        // Actually, if we set receiptNumber, we just need to ensure pre-save doesn't overwrite it if it exists.

        await receipt.save();
        createdReceipts.push(receipt);
    }

    // Return the first one (or a summary) for the frontend to display
    // Frontend expects a single receipt object or we adjust frontend.
    // Returing the first one allows ReceiptView to show standard details.
    // ReceiptView needs to know it's a recurring one -> it uses recurrenceDates.

    res.status(201).json(createdReceipts[0]);
};

// @desc    Get all receipts
// @route   GET /api/receipts
// @access  Private
const getReceipts = async (req, res) => {
    let query = { isDeleted: false };

    if (req.query.startDate && req.query.endDate) {
        const start = new Date(req.query.startDate);
        const end = new Date(req.query.endDate);
        const nextDay = new Date(end);
        nextDay.setDate(end.getDate() + 1);

        query.date = {
            $gte: start,
            $lt: nextDay,
        };
    }

    if (req.user.role === 'counter') {
        query.createdBy = req.user._id;
    }

    if (req.query.deleted === 'true') {
        query.isDeleted = true;
    }

    if (req.query.userId && (req.user.role === 'manager' || req.user.role === 'superadmin')) {
        query.createdBy = req.query.userId;
    }

    if (req.query.vazhipaduDate) {
        // Filter by the specific pooja date (ignoring time)
        const date = new Date(req.query.vazhipaduDate);
        const nextDay = new Date(date);
        nextDay.setDate(date.getDate() + 1);

        query.vazhipaduDate = {
            $gte: date,
            $lt: nextDay // Entire day range
        };
    }

    if (req.query.vazhipadu) {
        // Partial match for vazhipadu code/name
        query.$or = [
            { vazhipadu: { $regex: req.query.vazhipadu, $options: 'i' } },
            { vazhipaduType: { $regex: req.query.vazhipadu, $options: 'i' } }
        ];
    }

    let queryBuilder = Receipt.find(query)
        .populate('createdBy', 'name username')
        .sort({ createdAt: -1 });

    if (req.query.limit) {
        queryBuilder = queryBuilder.limit(parseInt(req.query.limit));
    }

    const receipts = await queryBuilder;

    res.json(receipts);
};

// @desc    Get receipt by ID
// @route   GET /api/receipts/:id
// @access  Private
const getReceiptById = async (req, res) => {
    const receipt = await Receipt.findById(req.params.id).populate('createdBy', 'name');

    if (receipt) {
        if (req.user.role === 'counter' && receipt.createdBy._id.toString() !== req.user._id.toString()) {
            // Optional: Allow if searching for reprint? For now strict.
            // res.status(403); throw new Error(...) 
            // keeping strictly own receipts for counter
            if (receipt.createdBy._id.toString() !== req.user._id.toString()) {
                res.status(403);
                throw new Error('Not authorized');
            }
        }
        res.json(receipt);
    } else {
        res.status(404);
        throw new Error('Receipt not found');
    }
};

// @desc    Soft delete receipt
// @route   DELETE /api/receipts/:id
// @access  Private (Manager/Admin)
const deleteReceipt = async (req, res) => {
    const receipt = await Receipt.findById(req.params.id);

    if (receipt) {
        receipt.isDeleted = true;
        receipt.deletedBy = req.user._id;
        receipt.deletedAt = Date.now();
        receipt.deleteReason = req.body.reason || 'No reason provided';

        await receipt.save();
        res.json({ message: 'Receipt removed' });
    } else {
        res.status(404);
        throw new Error('Receipt not found');
    }
};

// @desc    Get stats
// @route   GET /api/receipts/stats/manager
// @access  Private
const getManagerStats = async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Use createdAt for "Printed Date" based collection
    const totalCollectionToday = await Receipt.aggregate([
        {
            $match: {
                createdAt: { $gte: today, $lt: tomorrow }, // Changed from date to createdAt
                isDeleted: false
            }
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const userWiseStats = await Receipt.aggregate([
        {
            $match: {
                createdAt: { $gte: today, $lt: tomorrow }, // Changed from date to createdAt
                isDeleted: false
            }
        },
        {
            $group: {
                _id: '$createdBy',
                total: { $sum: '$totalAmount' },
                count: { $sum: 1 }
            }
        },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { _id: 1, total: 1, count: 1, 'user.name': 1 } }
    ]);

    // Payment breakdown by type
    const paymentBreakdownAgg = await Receipt.aggregate([
        {
            $match: {
                createdAt: { $gte: today, $lt: tomorrow }, // Changed from date to createdAt
                isDeleted: false
            }
        },
        { $group: { _id: '$paymentType', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
    ]);

    const paymentBreakdown = paymentBreakdownAgg.reduce((acc, cur) => {
        acc[cur._id || 'Unknown'] = { total: cur.total, count: cur.count };
        return acc;
    }, {});

    // Sum online payments as anything not 'Cash'
    const cashTotal = paymentBreakdown['Cash']?.total || 0;

    // Explicitly separate totals
    const moneyOrderTotal = paymentBreakdown['MoneyOrder']?.total || 0;
    const onlineTxnTotal = paymentBreakdown['OnlineTransaction']?.total || 0;

    // Combine 'UPI' and 'GPay' for backward compatibility or just use UPI if strictly new
    const upiTotal = (paymentBreakdown['UPI']?.total || 0) + (paymentBreakdown['GPay']?.total || 0);

    // Legacy onlineTotal (if needed by other dashboards not yet updated, or just remove)
    // Let's keep a generic sum of non-cash just in case, but user wants separate.
    // The request was "show online transacation,upi separate".

    res.json({
        totalCollectionToday: totalCollectionToday[0]?.total || 0,
        userWiseStats,
        paymentBreakdown,
        cashTotal,
        moneyOrderTotal,
        onlineTxnTotal,
        upiTotal
    });
};

// @desc    Get user performance stats
// @route   GET /api/receipts/stats/user-performance
// @access  Private (Manager, Superadmin)
const getUserPerformanceStats = async (req, res) => {
    const { userId, startDate, endDate } = req.query;

    // Build MatchQuery
    const matchQuery = { isDeleted: false };

    // Date Range Filter
    if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        matchQuery.createdAt = { $gte: start, $lte: end };
    } else {
        // Default to today if not provided? Or all time? 
        // Let's default to today to be safe if no range provided
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        matchQuery.createdAt = { $gte: today, $lt: tomorrow };
    }

    // User Filter
    if (userId) {
        matchQuery.createdBy = new mongoose.Types.ObjectId(userId);
    }

    // Aggregation
    const stats = await Receipt.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$totalAmount" },
                count: { $sum: 1 },
                // Conditional sums for breakdown
                cashTotal: {
                    $sum: {
                        $cond: [{ $eq: ["$paymentType", "Cash"] }, "$totalAmount", 0]
                    }
                },
                upiTotal: {
                    $sum: {
                        $cond: [{ $in: ["$paymentType", ["UPI", "GPay"]] }, "$totalAmount", 0]
                    }
                },
                onlineTotal: {
                    $sum: {
                        $cond: [{ $eq: ["$paymentType", "OnlineTransaction"] }, "$totalAmount", 0]
                    }
                },
                moneyOrderTotal: {
                    $sum: {
                        $cond: [{ $eq: ["$paymentType", "MoneyOrder"] }, "$totalAmount", 0]
                    }
                }
            }
        }
    ]);

    const result = stats.length > 0 ? stats[0] : {
        totalAmount: 0,
        count: 0,
        cashTotal: 0,
        upiTotal: 0,
        onlineTotal: 0,
        moneyOrderTotal: 0
    };

    res.json(result);
};

// @desc    Update receipt
// @route   PUT /api/receipts/:id
// @access  Private (Counter, Manager)
const updateReceipt = async (req, res) => {
    const receipt = await Receipt.findById(req.params.id);

    if (!receipt) {
        res.status(404);
        throw new Error('Receipt not found');
    }

    if (req.user.role === 'counter' && receipt.createdBy.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to edit this receipt');
    }

    // Update fields
    const { vazhipadu, vazhipaduType, vazhipaddate, currentdate, paymentType, mode, items, postingDetails } = req.body;

    receipt.vazhipadu = vazhipadu || receipt.vazhipadu;
    receipt.vazhipaduType = vazhipaduType || receipt.vazhipaduType;
    if (vazhipaddate) {
        receipt.vazhipaduDate = Array.isArray(vazhipaddate) ? vazhipaddate : [vazhipaddate];
    }
    if (currentdate) receipt.date = currentdate;
    receipt.paymentType = paymentType || receipt.paymentType;
    receipt.mode = mode || receipt.mode;
    receipt.items = items || receipt.items;

    if (postingDetails) {
        receipt.postingDetails = postingDetails;
    }

    // Recalculate total if items changed
    if (items) {
        receipt.totalAmount = items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
    }

    const updatedReceipt = await receipt.save();

    // If paymentType changed, update all other receipts with the same receiptNumber
    if (paymentType && receipt.receiptNumber) {
        await Receipt.updateMany(
            {
                receiptNumber: receipt.receiptNumber,
                _id: { $ne: receipt._id } // Don't update self again
            },
            { $set: { paymentType: paymentType } }
        );
    }

    res.json(updatedReceipt);
};

// @desc    Toggle Block Status
// @route   PUT /api/receipts/:id/block
// @access  Private/Manager/Admin
const toggleBlockStatus = async (req, res) => {
    const receipt = await Receipt.findById(req.params.id);

    if (receipt) {
        receipt.isBlocked = !receipt.isBlocked;
        const updatedReceipt = await receipt.save();
        res.json(updatedReceipt);
    } else {
        res.status(404);
        throw new Error('Receipt not found');
    }
};

module.exports = { createReceipt, getReceipts, getReceiptById, deleteReceipt, getManagerStats, updateReceipt, getUserPerformanceStats, toggleBlockStatus };

const Stall = require('../models/Stall');
const StallSale = require('../models/StallSale');

// --- Stall Management ---

// @desc    Get all stalls
// @route   GET /api/stalls
// @access  Private
const getStalls = async (req, res) => {
    const stalls = await Stall.find({});
    res.json(stalls);
};

// @desc    Create new stall
// @route   POST /api/stalls
// @access  Private/Manager/Admin
const createStall = async (req, res) => {
    const { name, type, description } = req.body;

    const stall = await Stall.create({
        name,
        type,
        description,
    });

    res.status(201).json(stall);
};

// --- Sales Management ---

// @desc    Record a new sale
// @route   POST /api/stalls/sales
// @access  Private (Stall User)
const recordSale = async (req, res) => {
    const { items, totalAmount } = req.body;

    // Verify user is assigned to a stall
    if (!req.user.assignedStall) {
        res.status(400);
        throw new Error('User is not assigned to any stall');
    }

    const sale = await StallSale.create({
        stall: req.user.assignedStall,
        items,
        totalAmount,
        soldBy: req.user._id,
    });

    res.status(201).json(sale);
};

// @desc    Get sales history
// @route   GET /api/stalls/sales
// @access  Private (Stall User sees own/stall-wise, Manager sees all)
const getSales = async (req, res) => {
    let query = {};

    if (req.user.role === 'stall') {
        // See sales by this user OR for this stall?
        // Usually stall user sees sales from their stall.
        // If multiple users per stall, they see stall sales.
        // If user assigned to stall, show by valid stall.
        if (req.user.assignedStall) {
            query.stall = req.user.assignedStall;
        } else {
            // Fallback if not assigned but role is stall (shouldn't happen)
            query.soldBy = req.user._id;
        }
    }

    const sales = await StallSale.find(query)
        .populate('stall', 'name')
        .populate('soldBy', 'name')
        .sort({ date: -1 });

    res.json(sales);
};

module.exports = { getStalls, createStall, recordSale, getSales };

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
    const { items, totalAmount, paymentMethod } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'No items in sale' });
    }

    // Verify user is assigned to a stall OR Auto-assign first stall
    let stallId = req.user.assignedStall;

    if (!stallId) {
        // Auto-assign: Fetch the first available stall
        const defaultStall = await Stall.findOne({});
        if (defaultStall) {
            stallId = defaultStall._id;
        } else {
            res.status(400);
            throw new Error('No stalls defined in system. Please create a stall first.');
        }
    }

    try {
        const sale = new StallSale({
            stall: stallId,
            items,
            totalAmount,
            paymentMethod: paymentMethod || 'Cash', // Default to 'Cash' if not provided
            soldBy: req.user._id,
        });

        const createdSale = await sale.save();
        res.status(201).json(createdSale);
    } catch (error) {
        res.status(500).json({ message: 'Failed to record sale: ' + error.message });
    }
};

// @desc    Get sales history
// @route   GET /api/stalls/sales
// @access  Private (Stall User sees own/stall-wise, Manager sees all)
const getSales = async (req, res) => {
    let query = {};

    if (req.user.role === 'stall') {
        // Strict requirement: User sees ONLY their own sales
        query.soldBy = req.user._id;
    }

    const sales = await StallSale.find(query)
        .populate('stall', 'name')
        .populate('soldBy', 'name')
        .sort({ date: -1 });

    res.json(sales);
};

// @desc    Update a sale
// @route   PUT /api/stalls/sales/:id
// @access  Private (Stall User - Own/Stall only)
const updateSale = async (req, res) => {
    const sale = await StallSale.findById(req.params.id);

    if (!sale) {
        res.status(404);
        throw new Error('Sale not found');
    }

    // Check permissions
    // If stall user, must match assigned stall or be the creator
    if (req.user.role === 'stall') {
        if (req.user.assignedStall && sale.stall.toString() !== req.user.assignedStall.toString()) {
            res.status(403);
            throw new Error('Not authorized to edit this sale');
        }
    }
    // Managers/Admins can implicitly edit

    sale.items = req.body.items || sale.items;
    sale.totalAmount = req.body.totalAmount || sale.totalAmount;
    sale.paymentMethod = req.body.paymentMethod || sale.paymentMethod;

    const updatedSale = await sale.save();
    res.json(updatedSale);
};

module.exports = { getStalls, createStall, recordSale, getSales, updateSale };

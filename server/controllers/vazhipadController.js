const Vazhipad = require('../models/Vazhipad');

// @desc    Get all vazhipads
// @route   GET /api/vazhipads
// @access  Public (or Private/Counter/Manager depending on req)
// Keeping it Private/AllAuthenticated for now, or Public if kiosk logic needed.
// Specs say "Manager Manage", "Counter Create Receipt". So Counter needs to Read.
const getVazhipads = async (req, res) => {
    const vazhipads = await Vazhipad.find({});
    res.json(vazhipads);
};

// @desc    Create new vazhipad
// @route   POST /api/vazhipads
// @access  Private/Manager/Admin
const createVazhipad = async (req, res) => {
    const { name, code, rate, status, requiresDateConfirmation } = req.body;

    const exists = await Vazhipad.findOne({ code });
    if (exists) {
        res.status(400);
        throw new Error('Vazhipad with this code already exists');
    }

    const vazhipad = await Vazhipad.create({
        name,
        code,
        rate,
        status,
        requiresDateConfirmation
    });

    res.status(201).json(vazhipad);
};

// @desc    Update vazhipad
// @route   PUT /api/vazhipads/:id
// @access  Private/Manager/Admin
const updateVazhipad = async (req, res) => {
    const vazhipad = await Vazhipad.findById(req.params.id);

    if (vazhipad) {
        vazhipad.name = req.body.name || vazhipad.name;
        vazhipad.code = req.body.code || vazhipad.code;
        vazhipad.rate = req.body.rate || vazhipad.rate;
        vazhipad.status = req.body.status || vazhipad.status;
        vazhipad.requiresDateConfirmation = req.body.requiresDateConfirmation !== undefined ? req.body.requiresDateConfirmation : vazhipad.requiresDateConfirmation;

        const updatedVazhipad = await vazhipad.save();
        res.json(updatedVazhipad);
    } else {
        res.status(404);
        throw new Error('Vazhipad not found');
    }
};

// @desc    Delete vazhipad
// @route   DELETE /api/vazhipads/:id
// @access  Private/Manager/Admin
const deleteVazhipad = async (req, res) => {
    const vazhipad = await Vazhipad.findById(req.params.id);

    if (vazhipad) {
        await vazhipad.deleteOne();
        res.json({ message: 'Vazhipad removed' });
    } else {
        res.status(404);
        throw new Error('Vazhipad not found');
    }
};

module.exports = { getVazhipads, createVazhipad, updateVazhipad, deleteVazhipad };

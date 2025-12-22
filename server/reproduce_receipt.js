const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Receipt = require('./models/Receipt');
const User = require('./models/User');
const Vazhipad = require('./models/Vazhipad');
const Counter = require('./models/Counter');
const connectDB = require('./config/db');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('DB Connected');

        // 1. Get User
        const user = await User.findOne({ role: 'counter' });
        if (!user) throw new Error('No counter user found');
        console.log('User found:', user.username);

        // 2. Get Vazhipad
        const vazhipad = await Vazhipad.findOne();
        if (!vazhipad) throw new Error('No vazhipad found');
        console.log('Vazhipad found:', vazhipad.name);

        // 2.5 Test Counter
        console.log('Testing Counter...');
        const counter = await Counter.findByIdAndUpdate(
            { _id: 'receiptNumber' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        console.log('Counter Test Result:', counter);

        // 3. Create Receipt
        const receipt = new Receipt({
            items: [{
                name: vazhipad.name,
                code: vazhipad.code,
                rate: vazhipad.rate,
                quantity: 1,
                amount: vazhipad.rate
            }],
            totalAmount: vazhipad.rate,
            createdBy: user._id,
            devoteeName: 'Devotee Test',
        });

        console.log('Attempting to save receipt...');
        const saved = await receipt.save();
        console.log('Receipt Saved Successfully:', saved);

        process.exit();
    } catch (error) {
        console.error('ERROR MESSAGE:', error.message);
        if (error.errors) console.error('VALIDATION ERRORS:', JSON.stringify(error.errors, null, 2));
        process.exit(1);
    }
};

run();

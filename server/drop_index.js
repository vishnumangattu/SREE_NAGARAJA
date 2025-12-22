const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        try {
            await mongoose.connection.collection('receipts').dropIndex('receiptNumber_1');
            console.log('Index receiptNumber_1 dropped successfully');
        } catch (error) {
            console.log('Error dropping index (it might not exist):', error.message);
        }

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

connectDB();

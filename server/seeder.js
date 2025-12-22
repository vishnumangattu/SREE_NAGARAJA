const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Stall = require('./models/Stall');
const Vazhipad = require('./models/Vazhipad');
// Connect DB logic simplified for seeder
const connectDB = require('./config/db');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for Seeding...');

        // Clear existing data? Maybe safer to just add if missing, but for clean start:
        // await User.deleteMany();
        // await Stall.deleteMany();
        // await Vazhipad.deleteMany();
        // user requested "add 1 dummy login", so let's stick to upsert logic or check existance.

        // --- 1. Stalls ---
        const stalls = [
            { name: 'Prasadam Stall', type: 'prasadam', description: 'Main prasadam counter' },
            { name: 'Flower Stall', type: 'flowers', description: 'Fresh flowers for offering' }
        ];

        let createdStalls = [];
        for (const s of stalls) {
            let stall = await Stall.findOne({ name: s.name });
            if (!stall) {
                stall = await Stall.create(s);
                console.log(`Stall created: ${stall.name}`);
            }
            createdStalls.push(stall);
        }

        // --- 2. Users ---
        const users = [
            {
                name: 'Super Admin',
                username: 'admin',
                password: 'password123',
                role: 'superadmin'
            },
            {
                name: 'Temple Manager',
                username: 'manager',
                password: 'password123',
                role: 'manager'
            },
            {
                name: 'Counter Staff',
                username: 'counter',
                password: 'password123',
                role: 'counter'
            },
            {
                name: 'Stall Staff',
                username: 'stall',
                password: 'password123',
                role: 'stall',
                assignedStall: createdStalls[0]._id // Assign to Prasadam Stall
            }
        ];

        for (const u of users) {
            const exists = await User.findOne({ username: u.username });
            if (!exists) {
                await User.create(u);
                console.log(`User created: ${u.username} (${u.role})`);
            } else {
                console.log(`User already exists: ${u.username}`);
            }
        }

        // --- 3. Vazhipads (Sample) ---
        const vazhipads = [
            { name: 'Pushpanjali', code: 'PUSH001', rate: 20 },
            { name: 'Archana', code: 'ARCH010', rate: 10 },
            { name: 'Neyvilakku', code: 'NEY005', rate: 50 },
            { name: 'Ganapathi Homam', code: 'GAN100', rate: 500 }
        ];

        for (const v of vazhipads) {
            const exists = await Vazhipad.findOne({ code: v.code });
            if (!exists) {
                await Vazhipad.create(v);
                console.log(`Vazhipad created: ${v.name}`);
            }
        }

        console.log('Seeding Completed!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

seedData();

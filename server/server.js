const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

const connectDB = require('./config/db');

// Database Connection
// connectDB(); // Called after config is loaded

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const vazhipadRoutes = require('./routes/vazhipadRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const stallRoutes = require('./routes/stallRoutes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vazhipads', vazhipadRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/stalls', stallRoutes);
app.use('/api/closing-reports', require('./routes/closingReportRoutes'));

app.get('/', (req, res) => {
    res.send('Temple Management System API is running...');
});

// Error Handling Middleware (Basic)
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
});

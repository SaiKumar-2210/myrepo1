require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { startScheduler } = require('./utils/scheduler');

// Route imports
const authRoutes = require('./routes/auth');
const medicineRoutes = require('./routes/medicines');
const adherenceRoutes = require('./routes/adherence');
const ocrRoutes = require('./routes/ocr');
const qrRoutes = require('./routes/qr');
const emergencyRoutes = require('./routes/emergency');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/adherence', adherenceRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);

    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Max 10MB allowed.' });
        }
        return res.status(400).json({ message: err.message });
    }

    if (err.message === 'Only image files are allowed.') {
        return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: 'Internal server error.' });
});

// Start server
async function start() {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`🚀 MedBs Backend running on http://localhost:${PORT}`);
        console.log(`📡 API available at http://localhost:${PORT}/api`);
    });
    startScheduler();
}

start();

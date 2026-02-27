const express = require('express');
const AdherenceLog = require('../models/AdherenceLog');
const Medicine = require('../models/Medicine');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/adherence — get logs, optionally filter by date
router.get('/', async (req, res) => {
    try {
        const { date, medicineId } = req.query;
        const filter = { userId: req.userId };

        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            filter.date = { $gte: start, $lte: end };
        }

        if (medicineId) {
            filter.medicineId = medicineId;
        }

        const logs = await AdherenceLog.find(filter)
            .populate('medicineId', 'name dosage timing')
            .sort({ date: -1 });

        res.json(logs);
    } catch (error) {
        console.error('Get adherence logs error:', error);
        res.status(500).json({ message: 'Server error fetching logs.' });
    }
});

// GET /api/adherence/stats — daily/weekly adherence statistics
router.get('/stats', async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const since = new Date();
        since.setDate(since.getDate() - parseInt(days));
        since.setHours(0, 0, 0, 0);

        const logs = await AdherenceLog.find({
            userId: req.userId,
            date: { $gte: since }
        });

        const total = logs.length;
        const taken = logs.filter(l => l.taken).length;
        const missed = total - taken;
        const rate = total > 0 ? Math.round((taken / total) * 100) : 0;

        // Group by date
        const daily = {};
        logs.forEach(log => {
            const key = log.date.toISOString().split('T')[0];
            if (!daily[key]) daily[key] = { total: 0, taken: 0 };
            daily[key].total++;
            if (log.taken) daily[key].taken++;
        });

        const dailyStats = Object.entries(daily).map(([date, data]) => ({
            date,
            total: data.total,
            taken: data.taken,
            rate: Math.round((data.taken / data.total) * 100)
        })).sort((a, b) => a.date.localeCompare(b.date));

        res.json({ total, taken, missed, rate, dailyStats });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ message: 'Server error fetching stats.' });
    }
});

// POST /api/adherence — log a dose (taken or missed)
router.post('/', async (req, res) => {
    try {
        const { medicineId, date, scheduledTime, taken } = req.body;

        if (!medicineId) {
            return res.status(400).json({ message: 'medicineId is required.' });
        }

        // Verify medicine belongs to user
        const medicine = await Medicine.findOne({ _id: medicineId, userId: req.userId });
        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found.' });
        }

        const log = await AdherenceLog.create({
            medicineId,
            userId: req.userId,
            date: date ? new Date(date) : new Date(),
            scheduledTime,
            taken: taken !== undefined ? taken : true,
            takenTime: taken ? new Date() : undefined
        });

        res.status(201).json(log);
    } catch (error) {
        console.error('Log adherence error:', error);
        res.status(500).json({ message: 'Server error logging adherence.' });
    }
});

// PUT /api/adherence/:id — update a log (mark taken, snooze)
router.put('/:id', async (req, res) => {
    try {
        const { taken, snoozed, snoozeUntil } = req.body;
        const update = {};

        if (taken !== undefined) {
            update.taken = taken;
            update.takenTime = taken ? new Date() : null;
        }
        if (snoozed !== undefined) {
            update.snoozed = snoozed;
            update.snoozeUntil = snoozeUntil ? new Date(snoozeUntil) : null;
        }

        const log = await AdherenceLog.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            update,
            { new: true }
        ).populate('medicineId', 'name dosage');

        if (!log) {
            return res.status(404).json({ message: 'Log not found.' });
        }

        res.json(log);
    } catch (error) {
        res.status(500).json({ message: 'Server error updating log.' });
    }
});

// POST /api/adherence/voice — voice confirmation endpoint
router.post('/voice', async (req, res) => {
    try {
        const { transcript } = req.body;
        const normalized = (transcript || '').toLowerCase().trim();

        const confirmPhrases = ['i took my medicine', 'taken', 'done', 'yes'];
        const isConfirmation = confirmPhrases.some(p => normalized.includes(p));

        if (!isConfirmation) {
            return res.json({ recognized: false, message: 'Could not recognize confirmation.' });
        }

        // Mark all pending doses for today as taken
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const result = await AdherenceLog.updateMany(
            {
                userId: req.userId,
                date: { $gte: today, $lte: endOfDay },
                taken: false,
                snoozed: false
            },
            {
                taken: true,
                takenTime: new Date()
            }
        );

        res.json({
            recognized: true,
            message: `Marked ${result.modifiedCount} dose(s) as taken.`,
            count: result.modifiedCount
        });
    } catch (error) {
        console.error('Voice confirmation error:', error);
        res.status(500).json({ message: 'Server error processing voice.' });
    }
});

module.exports = router;

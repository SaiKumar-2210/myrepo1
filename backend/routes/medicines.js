const express = require('express');
const Medicine = require('../models/Medicine');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/medicines — list user's medicines
router.get('/', async (req, res) => {
    try {
        const { active } = req.query;
        const filter = { userId: req.userId };
        if (active !== undefined) {
            filter.active = active === 'true';
        }
        const medicines = await Medicine.find(filter).sort({ createdAt: -1 });
        res.json(medicines);
    } catch (error) {
        console.error('Get medicines error:', error);
        res.status(500).json({ message: 'Server error fetching medicines.' });
    }
});

// GET /api/medicines/:id
router.get('/:id', async (req, res) => {
    try {
        const medicine = await Medicine.findOne({ _id: req.params.id, userId: req.userId });
        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found.' });
        }
        res.json(medicine);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// POST /api/medicines — add medicine
router.post('/', async (req, res) => {
    try {
        const { name, dosage, frequency, timing, startDate, endDate, notes } = req.body;

        if (!name || !dosage) {
            return res.status(400).json({ message: 'Medicine name and dosage are required.' });
        }

        const medicine = await Medicine.create({
            userId: req.userId,
            name,
            dosage,
            frequency: frequency || 'once',
            timing: timing || [],
            startDate: startDate || new Date(),
            endDate,
            notes
        });

        res.status(201).json(medicine);
    } catch (error) {
        console.error('Add medicine error:', error);
        res.status(500).json({ message: 'Server error adding medicine.' });
    }
});

// POST /api/medicines/bulk — add multiple medicines (from OCR/QR)
router.post('/bulk', async (req, res) => {
    try {
        const { medicines } = req.body;
        if (!Array.isArray(medicines) || medicines.length === 0) {
            return res.status(400).json({ message: 'Provide an array of medicines.' });
        }

        const created = await Medicine.insertMany(
            medicines.map(m => ({
                userId: req.userId,
                name: m.name,
                dosage: m.dosage,
                frequency: m.frequency || 'once',
                timing: m.timing || [],
                startDate: m.startDate || new Date(),
                endDate: m.endDate,
                notes: m.notes
            }))
        );

        res.status(201).json(created);
    } catch (error) {
        console.error('Bulk add error:', error);
        res.status(500).json({ message: 'Server error adding medicines.' });
    }
});

// PUT /api/medicines/:id — update medicine
router.put('/:id', async (req, res) => {
    try {
        const { name, dosage, frequency, timing, startDate, endDate, notes, active } = req.body;

        const medicine = await Medicine.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { name, dosage, frequency, timing, startDate, endDate, notes, active },
            { new: true, runValidators: true }
        );

        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found.' });
        }

        res.json(medicine);
    } catch (error) {
        console.error('Update medicine error:', error);
        res.status(500).json({ message: 'Server error updating medicine.' });
    }
});

// DELETE /api/medicines/:id
router.delete('/:id', async (req, res) => {
    try {
        const medicine = await Medicine.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found.' });
        }
        res.json({ message: 'Medicine deleted.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting medicine.' });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const EmergencyProfile = require('../models/EmergencyProfile');
const auth = require('../middleware/auth');
const Medicine = require('../models/Medicine');
const User = require('../models/User');

// @route   GET /api/emergency/me
// @desc    Get current user's emergency profile
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        let profile = await EmergencyProfile.findOne({ userId: req.user.id });
        if (!profile) {
            // Return empty skeleton instead of 404 for easier frontend handling
            profile = {
                bloodGroup: '',
                allergies: [],
                emergencyContactName: '',
                emergencyContactPhone: '',
                medicalConditions: [],
                isPublic: true
            };
        }
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/emergency/me
// @desc    Create or update current user's emergency profile
// @access  Private
router.post('/me', auth, async (req, res) => {
    const { bloodGroup, allergies, emergencyContactName, emergencyContactPhone, medicalConditions, isPublic } = req.body;

    try {
        let profile = await EmergencyProfile.findOne({ userId: req.user.id });

        const profileFields = {
            userId: req.user.id,
            bloodGroup,
            allergies: allergies || [],
            emergencyContactName,
            emergencyContactPhone,
            medicalConditions: medicalConditions || [],
            isPublic: isPublic !== undefined ? isPublic : true
        };

        if (profile) {
            // Update
            profile = await EmergencyProfile.findOneAndUpdate(
                { userId: req.user.id },
                { $set: profileFields },
                { new: true }
            );
            return res.json(profile);
        }

        // Create
        profile = new EmergencyProfile(profileFields);
        await profile.save();
        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/emergency/public/:userId
// @desc    Get public emergency profile (for QR scanner)
// @access  Public
router.get('/public/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const profile = await EmergencyProfile.findOne({ userId, isPublic: true });
        if (!profile) {
            return res.status(404).json({ message: 'Emergency profile not found or is private' });
        }

        // Fetch basic user info
        const user = await User.findById(userId).select('name');

        // Fetch current active medications
        const medications = await Medicine.find({ userId, active: true }).select('name dosage frequency timing');

        res.json({
            user: { name: user ? user.name : 'Unknown' },
            profile,
            medications
        });

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Profile not found' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   POST /api/notifications/subscribe
// @desc    Subscribe user to push notifications
// @access  Private
router.post('/subscribe', auth, async (req, res) => {
    try {
        const subscription = req.body;

        // Save subscription to user object
        await User.findByIdAndUpdate(req.user.id, { pushSubscription: subscription });

        res.status(201).json({ message: 'Push subscription saved successfully.' });
    } catch (error) {
        console.error('Error saving subscription:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/notifications/vapidPublicKey
// @desc    Get VAPID public key
// @access  Public
router.get('/vapidPublicKey', (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

module.exports = router;

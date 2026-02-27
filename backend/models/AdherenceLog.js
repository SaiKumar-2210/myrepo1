const mongoose = require('mongoose');

const adherenceLogSchema = new mongoose.Schema({
    medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    date: {
        type: Date,
        required: true
    },
    scheduledTime: {
        type: String
        // e.g. "08:00"
    },
    taken: {
        type: Boolean,
        default: false
    },
    takenTime: {
        type: Date
    },
    snoozed: {
        type: Boolean,
        default: false
    },
    snoozeUntil: {
        type: Date
    },
    missedAlertSent: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
adherenceLogSchema.index({ userId: 1, date: 1 });
adherenceLogSchema.index({ medicineId: 1, date: 1 });

module.exports = mongoose.model('AdherenceLog', adherenceLogSchema);

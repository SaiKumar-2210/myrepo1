const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Medicine name is required'],
        trim: true
    },
    dosage: {
        type: String,
        required: [true, 'Dosage is required'],
        trim: true
    },
    frequency: {
        type: String,
        enum: ['once', 'twice', 'thrice', 'custom'],
        default: 'once'
    },
    timing: [{
        type: String,
        trim: true
        // e.g. "08:00", "14:00", "20:00"
    }],
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    },
    notes: {
        type: String,
        trim: true,
        default: ''
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Medicine', medicineSchema);

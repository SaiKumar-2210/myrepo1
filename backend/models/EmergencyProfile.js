const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    bloodGroup: {
        type: String,
        trim: true,
        default: ''
    },
    allergies: [{
        type: String,
        trim: true
    }],
    emergencyContactName: {
        type: String,
        trim: true,
        default: ''
    },
    emergencyContactPhone: {
        type: String,
        trim: true,
        default: ''
    },
    medicalConditions: [{
        type: String,
        trim: true
    }],
    isPublic: {
        type: Boolean,
        default: true // Allows QR scanner to read this without being logged in
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('EmergencyProfile', emergencySchema);

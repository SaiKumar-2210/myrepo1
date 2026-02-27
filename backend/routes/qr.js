const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/qr/parse — parse QR code data
router.post('/parse', auth, async (req, res) => {
    try {
        const { data } = req.body;

        if (!data) {
            return res.status(400).json({ message: 'QR data is required.' });
        }

        let parsed;

        // Try to parse as JSON first
        try {
            parsed = JSON.parse(data);
        } catch {
            // If not JSON, try to extract from text format
            parsed = parseQRText(data);
        }

        // Normalize to array of medicines
        let medicines = [];
        if (Array.isArray(parsed)) {
            medicines = parsed;
        } else if (parsed && parsed.medicines) {
            medicines = parsed.medicines;
        } else if (parsed && parsed.name) {
            medicines = [parsed];
        }

        // Validate and normalize each medicine
        medicines = medicines.map(m => ({
            name: m.name || m.medicine || '',
            dosage: m.dosage || m.dose || '',
            frequency: m.frequency || m.freq || 'once',
            timing: m.timing || [],
            notes: m.notes || ''
        })).filter(m => m.name);

        if (medicines.length === 0) {
            return res.json({
                success: false,
                rawData: data,
                medicines: [],
                message: 'Could not parse medicine data from QR code. Raw data is shown.'
            });
        }

        res.json({
            success: true,
            medicines,
            message: `Parsed ${medicines.length} medicine(s) from QR code.`
        });
    } catch (error) {
        console.error('QR parse error:', error);
        res.status(500).json({ message: 'Error parsing QR data.' });
    }
});

// Parse text-based QR data
function parseQRText(text) {
    const lines = text.split(/[\n;|]/).filter(l => l.trim());
    const medicines = [];

    for (const line of lines) {
        const parts = line.split(/[,:\t]/).map(p => p.trim());
        if (parts.length >= 2) {
            medicines.push({
                name: parts[0],
                dosage: parts[1],
                frequency: parts[2] || 'once'
            });
        }
    }

    return medicines;
}

module.exports = router;

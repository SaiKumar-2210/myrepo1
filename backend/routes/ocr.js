const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|bmp|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed.'));
        }
    }
});

// Parse OCR text to extract medicine info
function parsePrescriptionText(text) {
    const lines = text.split('\n').filter(l => l.trim());
    const medicines = [];

    // Common patterns for medicine extraction
    const medPatterns = [
        // Pattern: Medicine Name 500mg 1-0-1 or similar
        /([A-Za-z\s]+)\s+(\d+\s*(?:mg|ml|mcg|g|iu|units?))\s*[,\-\s]*(\d[\-\d]*)/gi,
        // Pattern: Tab/Cap Medicine Name dosage
        /(?:tab|cap|syp|inj|drops?)\.?\s+([A-Za-z\s]+)\s+(\d+\s*(?:mg|ml|mcg|g))/gi,
    ];

    for (const line of lines) {
        for (const pattern of medPatterns) {
            pattern.lastIndex = 0;
            const match = pattern.exec(line);
            if (match) {
                medicines.push({
                    name: match[1].trim(),
                    dosage: match[2].trim(),
                    frequency: match[3] ? match[3].trim() : 'once',
                    rawLine: line.trim()
                });
                break;
            }
        }
    }

    // If no patterns matched, return raw lines as suggestions
    if (medicines.length === 0) {
        for (const line of lines.slice(0, 10)) {
            if (line.trim().length > 3) {
                medicines.push({
                    name: line.trim(),
                    dosage: '',
                    frequency: '',
                    rawLine: line.trim()
                });
            }
        }
    }

    return medicines;
}

// POST /api/ocr/extract — extract medicine info from prescription image
router.post('/extract', auth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image file.' });
        }

        const imagePath = req.file.path;

        // Run OCR
        const { data: { text, confidence } } = await Tesseract.recognize(imagePath, 'eng', {
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    // Progress tracking available
                }
            }
        });

        // Parse extracted text
        const medicines = parsePrescriptionText(text);

        // Clean up uploaded file
        fs.unlink(imagePath, (err) => {
            if (err) console.error('Error deleting uploaded file:', err);
        });

        res.json({
            rawText: text,
            confidence: Math.round(confidence),
            medicines,
            message: medicines.length > 0
                ? `Found ${medicines.length} medicine(s). Please verify and edit before saving.`
                : 'Could not auto-detect medicines. Raw text is shown for manual entry.'
        });
    } catch (error) {
        console.error('OCR error:', error);
        // Clean up file on error
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, () => { });
        }
        res.status(500).json({ message: 'Error processing image. Please try again.' });
    }
});

module.exports = router;

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || '*')
    .split(',')
    .map(origin => origin.trim().replace(/\/$/, '')); // Remove trailing slash if present

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Check if origin matches any allowed origin
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('🚫 CORS Blocked:', origin, 'Allowed:', allowedOrigins);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json({ limit: '15mb' }));

// Static files for uploaded images
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer config for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    }
});

// Admin config
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'fuad1205@gmail.com')
    .split(',')
    .map(e => e.trim().toLowerCase());

console.log('👷 Admin Emails Configured:', ADMIN_EMAILS);

// Auth middleware - extract userId and admin email from headers
const authMiddleware = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    req.userId = userId;
    req.userEmail = (req.headers['x-user-email'] || '').toLowerCase();
    req.isAdmin = ADMIN_EMAILS.includes(req.userEmail);
    console.log(`👤 Auth: ${req.userEmail} (ID: ${userId}) -> Admin: ${req.isAdmin}`);
    next();
};

// ===== DEBUG CONFIG (REMOVE IN PRODUCTION IF SENSITIVE) =====
app.get('/api/debug-config', (req, res) => {
    res.json({
        adminEmails: ADMIN_EMAILS,
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
        geminiKeyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
        port: PORT,
        corsOrigin: process.env.CORS_ORIGIN
    });
});

// ===== ADMIN CHECK =====
app.get('/api/auth/check-admin', authMiddleware, (req, res) => {
    res.json({ isAdmin: req.isAdmin });
});

// ===== HORSES =====
app.get('/api/horses', authMiddleware, (req, res) => {
    try {
        const horses = req.isAdmin ? db.getAllHorses() : db.getHorses(req.userId);
        res.json(horses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/horses', authMiddleware, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'certImage', maxCount: 1 }]), (req, res) => {
    try {
        const { name, age, breed, gender, fatherName, motherName } = req.body;
        const image = req.files['image'] ? req.files['image'][0].filename : null;
        const certImage = req.files['certImage'] ? req.files['certImage'][0].filename : null;

        const horse = db.addHorse(req.userId, {
            name,
            age: parseInt(age),
            breed,
            gender,
            image,
            fatherName,
            motherName,
            certImage
        });
        res.status(201).json(horse);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/horses/:id', authMiddleware, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'certImage', maxCount: 1 }]), (req, res) => {
    try {
        const { name, age, breed, gender, fatherName, motherName } = req.body;
        const existing = db.getHorse(req.params.id, req.userId);
        if (!existing) return res.status(404).json({ error: 'Horse not found' });

        let image = existing.image;
        if (req.files && req.files['image']) {
            // Delete old image
            if (existing.image) {
                const oldPath = path.join(uploadsDir, existing.image);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            image = req.files['image'][0].filename;
        }

        let certImage = existing.certImage;
        if (req.files && req.files['certImage']) {
            // Delete old certificate
            if (existing.certImage) {
                const oldPath = path.join(uploadsDir, existing.certImage);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            certImage = req.files['certImage'][0].filename;
        }

        const horse = db.updateHorse(req.params.id, req.userId, {
            name,
            age: parseInt(age),
            breed,
            gender,
            image,
            fatherName,
            motherName,
            certImage
        });
        res.json(horse);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/horses/:id', authMiddleware, (req, res) => {
    try {
        let deleted;
        if (req.isAdmin) {
            const result = db.deleteHorseAdmin(req.params.id);
            if (!result) return res.status(404).json({ error: 'Horse not found' });
            deleted = result.horse;
            // Delete image file
            if (deleted.image) {
                const imgPath = path.join(uploadsDir, deleted.image);
                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            }
            // Return all related firebaseIds for Firestore cleanup
            res.json({
                success: true,
                firebaseId: deleted.firebaseId,
                relatedFirebaseIds: {
                    visits: result.relatedVisits.filter(v => v.firebaseId).map(v => v.firebaseId),
                    vaccines: result.relatedVaccines.filter(v => v.firebaseId).map(v => v.firebaseId),
                    pregnancies: result.relatedPregnancies.filter(p => p.firebaseId).map(p => p.firebaseId),
                }
            });
        } else {
            const existing = db.getHorse(req.params.id, req.userId);
            if (!existing) return res.status(404).json({ error: 'Horse not found' });
            if (existing.image) {
                const imgPath = path.join(uploadsDir, existing.image);
                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            }
            deleted = db.deleteHorse(req.params.id, req.userId);
            res.json({ success: true, firebaseId: deleted?.firebaseId });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== VISITS =====
app.get('/api/visits', authMiddleware, (req, res) => {
    try { res.json(db.getVisits(req.userId)); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/visits', authMiddleware, (req, res) => {
    try {
        const visit = db.addVisit(req.userId, req.body);
        res.status(201).json(visit);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/visits/:id', authMiddleware, (req, res) => {
    try {
        const deleted = db.deleteVisit(req.params.id, req.userId);
        res.json({ success: true, firebaseId: deleted?.firebaseId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== VACCINES =====
app.get('/api/vaccines', authMiddleware, (req, res) => {
    try { res.json(db.getVaccines(req.userId)); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/vaccines', authMiddleware, (req, res) => {
    try {
        const vaccine = db.addVaccine(req.userId, req.body);
        res.status(201).json(vaccine);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/vaccines/:id', authMiddleware, (req, res) => {
    try {
        const deleted = db.deleteVaccine(req.params.id, req.userId);
        res.json({ success: true, firebaseId: deleted?.firebaseId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== PREGNANCIES =====
app.get('/api/pregnancies', authMiddleware, (req, res) => {
    try { res.json(db.getPregnancies(req.userId)); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/pregnancies', authMiddleware, (req, res) => {
    try {
        const pregnancy = db.addPregnancy(req.userId, req.body);
        res.status(201).json(pregnancy);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/pregnancies/:id', authMiddleware, (req, res) => {
    try {
        const deleted = db.deletePregnancy(req.params.id, req.userId);
        res.json({ success: true, firebaseId: deleted?.firebaseId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== FIREBASE ID SYNC =====
app.patch('/api/horses/:id/firebase-id', authMiddleware, (req, res) => {
    try {
        db.setHorseFirebaseId(req.params.id, req.body.firebaseId);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/visits/:id/firebase-id', authMiddleware, (req, res) => {
    try {
        db.setVisitFirebaseId(req.params.id, req.body.firebaseId);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/vaccines/:id/firebase-id', authMiddleware, (req, res) => {
    try {
        db.setVaccineFirebaseId(req.params.id, req.body.firebaseId);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/pregnancies/:id/firebase-id', authMiddleware, (req, res) => {
    try {
        db.setPregnancyFirebaseId(req.params.id, req.body.firebaseId);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== GEMINI CHATBOT =====
app.post('/api/chat', authMiddleware, async (req, res) => {
    try {
        const { message } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;
        console.log('🤖 Chat Request - Has API Key:', !!apiKey);

        if (!apiKey) {
            console.error('❌ Gemini API key is missing in environment variables');
            return res.status(500).json({ error: 'Gemini API key not configured' });
        }

        // Fetch context data
        const horses = req.isAdmin ? db.getAllHorses() : db.getHorses(req.userId);
        const visits = db.getVisits(req.userId);
        const vaccines = db.getVaccines(req.userId);
        const pregnancies = db.getPregnancies(req.userId);

        // Prepare context summary
        const context = `
Current Stable Data:
- Horses: ${JSON.stringify(horses.map(h => ({
            id: h.id,
            name: h.name,
            age: h.age,
            breed: h.breed,
            gender: h.gender,
            father: h.fatherName || 'Unknown',
            mother: h.motherName || 'Unknown'
        })))}
- Recent Visits: ${JSON.stringify(visits.slice(0, 10).map(v => ({ date: v.date, horseId: v.horseId, type: v.type, vet: v.vetName, notes: v.notes })))}
- Upcoming Vaccines: ${JSON.stringify(vaccines.filter(v => v.nextDate).map(v => ({ date: v.date, nextDate: v.nextDate, horseId: v.horseId, type: v.type })))}
- Active Pregnancies: ${JSON.stringify(pregnancies.filter(p => p.status !== 'הסתיים').map(p => ({ horseId: p.horseId, due: p.expectedDate, stallion: p.stallionName })))}

User Question: ${message}

System Instruction: You are an expert equine veterinary assistant and stable manager AI for "Oshri Stables".
Your role is to provide professional, accurate, and helpful insights based on the stable's data.
- Tone: Professional, authoritative yet accessible, and veterinary-focused.
- Data Usage: Always check the provided data for specific horse details (age, breed, lineage, medical history).
- Lineage: If asked about a horse, mention their parents (Father/Mother) if recorded.
- Limitations: If the answer is not in the data, state clearly that you don't have that information in the records. Do not hallucinate data.
- Formatting: Use bullet points for lists and keep paragraphs concise.
- Language: Respond in Hebrew unless asked otherwise.
`;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent(context);
        const response = await result.response;
        const text = response.text();

        res.json({ reply: text });
    } catch (err) {
        console.error('Chat error:', err);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

// ===== MIGRATION =====
app.post('/api/migrate', authMiddleware, (req, res) => {
    try {
        const { horses, visits, vaccines, pregnancies } = req.body;
        const idMapping = {}; // firebaseId -> sqliteId

        // Import horses
        for (const horse of (horses || [])) {
            let imagePath = null;

            // Handle base64 image from Firestore
            if (horse.image && horse.image.startsWith('data:')) {
                const matches = horse.image.match(/^data:image\/(\w+);base64,(.+)$/);
                if (matches) {
                    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
                    const filename = `${uuidv4()}.${ext}`;
                    const buffer = Buffer.from(matches[2], 'base64');
                    fs.writeFileSync(path.join(uploadsDir, filename), buffer);
                    imagePath = filename;
                }
            }

            const newHorse = db.addHorse(req.userId, {
                name: horse.name,
                age: horse.age,
                breed: horse.breed,
                gender: horse.gender,
                image: imagePath,
                firebaseId: horse.id
            });
            idMapping[horse.id] = newHorse.id;
        }

        // Import visits
        for (const visit of (visits || [])) {
            const horseId = idMapping[visit.horseId];
            if (!horseId) continue;
            db.addVisit(req.userId, { ...visit, horseId, firebaseId: visit.id });
        }

        // Import vaccines
        for (const vaccine of (vaccines || [])) {
            const horseId = idMapping[vaccine.horseId];
            if (!horseId) continue;
            db.addVaccine(req.userId, { ...vaccine, horseId, firebaseId: vaccine.id });
        }

        // Import pregnancies
        for (const pregnancy of (pregnancies || [])) {
            const horseId = idMapping[pregnancy.horseId];
            if (!horseId) continue;
            db.addPregnancy(req.userId, { ...pregnancy, horseId, firebaseId: pregnancy.id });
        }

        res.json({
            success: true,
            imported: {
                horses: (horses || []).length,
                visits: (visits || []).length,
                vaccines: (vaccines || []).length,
                pregnancies: (pregnancies || []).length
            }
        });
    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({ error: 'Migration failed: ' + error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🐴 Server running on http://localhost:${PORT}`);
});

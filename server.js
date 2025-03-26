const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// ✅ Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ----------------------------
// 🌐 Database Connection
// ----------------------------
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Failed:', error.message);
        process.exit(1);
    }
};

connectDB();

// ----------------------------
// 🧩 Braille Data Model
// ----------------------------
const brailleDataSchema = new mongoose.Schema({
    pressedButtons: String,
    letter: String,
    timestamp: { type: Date, default: Date.now }
});

const BrailleData = mongoose.model('BrailleData', brailleDataSchema);

// ----------------------------
// 🎮 Braille Button Endpoints
// ----------------------------

// Store received data in memory (optional)
let receivedData = [];

// Endpoint to handle button presses
app.post('/buttonpress', async (req, res) => {
    try {
        const data = req.body;
        console.log('Received data:', data);

        // Fetch the latest AI-generated letter from the database
        const latestTestLetter = await TestLetter.findOne().sort({ timestamp: -1 });

        let isMatch = false;
        if (latestTestLetter) {
            isMatch = latestTestLetter.letter === data.letter;
            console.log(isMatch ? '✅ Same' : '❌ Not same');
        } else {
            console.log('⚠️ No AI-generated letter found in database.');
        }

        // Save to MongoDB
        const newData = new BrailleData({
            pressedButtons: data.pressedButtons,
            letter: data.letter
        });
        await newData.save();

        res.json({ 
            status: 'success', 
            message: 'Data received and saved', 
            match: isMatch 
        });
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ status: 'error', message: 'Failed to save data' });
    }
});

// Endpoint to get all received data
app.get('/data', async (req, res) => {
    try {
        // Get from MongoDB
        const dataFromDB = await BrailleData.find().sort({ timestamp: -1 });
        res.json(dataFromDB);
        
        // Or use in-memory data (optional)
        // res.json(receivedData);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch data' });
    }
});

// Endpoint to clear data
app.delete('/clear', async (req, res) => {
    try {
        // Clear MongoDB collection
        await BrailleData.deleteMany({});
        
        // Clear in-memory data (optional)
        receivedData = [];
        
        res.json({ status: 'success', message: 'Data cleared' });
    } catch (error) {
        console.error('Error clearing data:', error);
        res.status(500).json({ status: 'error', message: 'Failed to clear data' });
    }
});
// ----------------------------
// 📌 AI-Generated Letter Schema
// ----------------------------
const testLetterSchema = new mongoose.Schema({
    letter: String,
    timestamp: { type: Date, default: Date.now }
});

const TestLetter = mongoose.model('TestLetter', testLetterSchema);

// ----------------------------
// 📌 API to Save AI-Generated Letter
// ----------------------------
app.post('/api/testing/save-letter', async (req, res) => {
    try {
        const { letter } = req.body;

        if (!letter) {
            return res.status(400).json({ error: 'Letter is required' });
        }

        const newTestLetter = new TestLetter({ letter });
        await newTestLetter.save();

        res.status(201).json({ message: 'AI-generated letter saved successfully' });
    } catch (error) {
        console.error('❌ Error saving AI-generated letter:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ----------------------------
// 🎮 Braille Button Endpoints
// ----------------------------
app.post('/api/testing/save-result', async (req, res) => {
    try {
        const { letter, isCorrect } = req.body;

        if (!letter) {
            return res.status(400).json({ error: 'Letter is required' });
        }

        const newBrailleData = new BrailleData({
            pressedButtons: isCorrect ? 'Correct' : 'Incorrect',
            letter
        });

        await newBrailleData.save();
        res.status(201).json({ message: 'Test result saved successfully' });
    } catch (error) {
        console.error('❌ Error saving test result:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ----------------------------
// 🚀 Start Server
// ----------------------------
const PORT = process.env.PORT || 7000;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`Accessible on your network at: http://${getLocalIP()}:${PORT}`);
});

// Function to get local IP address
function getLocalIP() {
    const interfaces = require('os').networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}
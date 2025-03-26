const express = require('express');
const router = express.Router();
const User = require('../models/user');

router.get('/profile', async (req, res) => {
    try {
        const userEmail = req.query.email;

        console.log("Received email for profile fetch:", userEmail); // Debugging line

        if (!userEmail) {
            return res.status(400).json({ message: "Email is required" });
        }

        const profile = await User.findOne({ email: userEmail });

        if (!profile) {
            console.log("No profile found for:", userEmail); // Debugging line
            return res.status(404).json({ message: "Profile not found" });
        }

        res.json({ parentName: profile.parentName, childName: profile.childName });

    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ message: "Server error", error });
    }
});

module.exports = router;

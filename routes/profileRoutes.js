const express = require("express");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const User = require("../models/user");
const verifyToken = require("../middleware/verify-token");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Store file in memory before upload

// Upload Profile Picture
router.post("/upload", verifyToken, upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded." });
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload_stream({ folder: "profile_pics" }, async (error, result) => {
            if (error) return res.status(500).json({ error: "Upload failed." });

            // Update user's profilePic in MongoDB
            const updatedUser = await User.findByIdAndUpdate(
                req.user.id,
                { profilePic: result.secure_url },
                { new: true }
            );

            res.json({ success: true, profilePic: result.secure_url, user: updatedUser });
        });

        result.end(req.file.buffer); // Send file to Cloudinary
    } catch (error) {
        console.error("Error uploading profile picture:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

module.exports = router;
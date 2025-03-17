const express = require("express");
const verifyToken = require("../middleware/verify-token");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("../configs/cloudinary");
const streamifier = require("streamifier");
const User = require("../models/user");

const upload = multer({ storage: multer.memoryStorage() }); // Store file in memory before upload


// Upload Profile Picture
// Apply verifyToken middleware to extract user ID
router.post("/upload", verifyToken, upload.single("profilePic"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded." });
        }

        console.log("Uploading file to Cloudinary...");

        const streamUpload = (buffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: "profile_pics" },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                streamifier.createReadStream(buffer).pipe(stream);
            });
        };

        const result = await streamUpload(req.file.buffer);

        if (!req.user || !req.user.id) {
            return res.status(400).json({ error: "User ID not found in request." });
        }

        // Save the new profile picture URL to the user
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { profilePicture: result.secure_url },
            { new: true }
        );

        res.json({ success: true, profilePic: result.secure_url, user: updatedUser });
    } catch (error) {
        console.error("Error uploading profile picture:", error);
        res.status(500).json({ error: "Upload failed." });
    }
});

module.exports = router;
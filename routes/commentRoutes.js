const express = require('express');
const Comment = require('../models/Comment');
const { verifyToken } = require('./authRoutes');

const router = express.Router();

// Create a comment (Protected)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { postId, text } = req.body;
    const newComment = new Comment({ postId, text, author: req.user.id });
    await newComment.save();
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get comments for a post
router.get('/:postId', async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId }).populate('author', 'username');
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
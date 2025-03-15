// src/routes/commentRoutes.js
const Post = require('../models/Post');
const express = require('express');
const Comment = require('../models/comment');
const verifyToken = require('../middleware/verify-token');

const router = express.Router();

// Create a comment (Protected)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { postId, text } = req.body;
    const comment = new Comment({ postId, text, author: req.user.id });

    // Save comment
    await comment.save();

    // Update the corresponding post to include the new comment
    await Post.findByIdAndUpdate(postId, { $push: { comments: comment._id } });

    res.status(201).json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "Server Error" });
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

// Delete a comment (Protected)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

     // Remove the comment reference from the post
     await Post.findByIdAndUpdate(comment.postId, { $pull: { comments: comment._id } });

    // Check if the logged-in user is the comment author
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await comment.deleteOne();
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
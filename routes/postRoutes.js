// src/routes/postRoutes.js

const express = require('express');
const fetch = require('node-fetch');
const Post = require('../models/Post'); // Import Post model
const router = express.Router();
const verifyToken = require('../middleware/verify-token'); 

// API Key for Tomorrow.io
const WEATHER_API_KEY = process.env.TOMORROW_IO_API_KEY;

// Function to fetch weather data
async function getWeatherData(latitude, longitude) {
  try {
    const response = await fetch(
      `https://api.tomorrow.io/v4/weather/realtime?location=${latitude},${longitude}&apikey=${WEATHER_API_KEY}`
    );
    const data = await response.json();

    if (data && data.data) {
      return {
        temperature: data.data.values.temperature,
        conditions: data.data.values.weatherCode,
        icon: data.data.values.weatherCode, // May want to map this to an emoji or an icon
      };
    }
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

// Get all posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().populate('author', 'username');
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 🛠️ Create a new post with optional weather data
router.post('/', verifyToken, async (req, res) => {
  try {
    console.log("Request Body:", req.body); // Debugging line
    console.log("Authenticated User ID:", req.user?.id); // Debugging line

    const { title, content, location, latitude, longitude } = req.body;
    let weatherData = null;

    // Fetch weather data if latitude & longitude are provided
    if (latitude && longitude) {
      weatherData = await getWeatherData(latitude, longitude);
    }

    // Ensure author field is set using req.user.id
    const newPost = new Post({
      title,
      content,
      location,
      latitude,
      longitude,
      weatherData,
      author: req.user.id,  // Fix: Assign author from authenticated user
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get a single post by ID
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username' }
      });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update a post (PUT)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Ensure the logged-in user is the post owner
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized action' });
    }

    // Update the post
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete a post (DELETE)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Ensure the logged-in user is the post owner
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized action' });
    }

    await post.deleteOne();
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
const express = require('express');
const fetch = require('node-fetch');
const Post = require('../models/Post'); // Import Post model
const router = express.Router();
const verifyToken = require('../middleware/verify-token'); 

// API Key for Tomorrow.io
const WEATHER_API_KEY = process.env.TOMORROW_IO_API_KEY;
console.log("🌍 Using Weather API Key:", process.env.TOMORROW_IO_API_KEY);

// Weather Code Mapping based on Tomorrow.io documentation
const weatherCodeMap = {
  1000: "Clear",
  1001: "Cloudy",
  1100: "Mostly Clear",
  1101: "Partly Cloudy",
  1102: "Mostly Cloudy",
  2000: "Fog",
  2100: "Light Fog",
  4000: "Drizzle",
  4001: "Rain",
  4200: "Light Rain",
  4201: "Heavy Rain",
  5000: "Snow",
  5001: "Flurries",
  5100: "Light Snow",
  5101: "Heavy Snow",
  6000: "Freezing Drizzle",
  6001: "Freezing Rain",
  6200: "Light Freezing Rain",
  6201: "Heavy Freezing Rain",
  7000: "Ice Pellets",
  7101: "Heavy Ice Pellets",
  7102: "Light Ice Pellets",
  8000: "Thunderstorm",
};

// Weather Code to Icon Mapping
const weatherIconMap = {
  1000: "☀️",  // Clear
  1001: "☁️",  // Cloudy
  1100: "🌤",  // Mostly Clear
  1101: "⛅",  // Partly Cloudy
  1102: "🌥",  // Mostly Cloudy
  2000: "🌫",  // Fog
  2100: "🌁",  // Light Fog
  4000: "🌧",  // Drizzle
  4001: "🌧",  // Rain
  4200: "🌦",  // Light Rain
  4201: "⛈",  // Heavy Rain
  5000: "❄️",  // Snow
  5001: "🌨",  // Flurries
  5100: "🌨",  // Light Snow
  5101: "❄️",  // Heavy Snow
  6000: "🌧❄️",  // Freezing Drizzle
  6001: "🌧❄️",  // Freezing Rain
  6200: "🌧❄️",  // Light Freezing Rain
  6201: "🌧❄️",  // Heavy Freezing Rain
  7000: "🌨❄️",  // Ice Pellets
  7101: "🌨❄️",  // Heavy Ice Pellets
  7102: "🌨❄️",  // Light Ice Pellets
  8000: "⛈",  // Thunderstorm
};

// ✅ Modify getWeatherData() to include icon mapping
async function getWeatherData(latitude, longitude) {
  try {
    const apiUrl = `https://api.tomorrow.io/v4/weather/realtime?location=${latitude},${longitude}&apikey=${WEATHER_API_KEY}`;
    console.log("🌍 Fetching Weather from URL:", apiUrl);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("🌤 Raw Weather API Response:", JSON.stringify(data, null, 2));

    if (data && data.data && data.data.values) {
      // Extract weather condition code
      const weatherCode = data.data.values.weatherCode;

      return {
        temperature: data.data.values.temperature,
        conditions: weatherCodeMap[weatherCode] || "Unknown",
        icon: weatherIconMap[weatherCode] || "❓",  // ✅ Map icon to emoji
      };
    } else {
      console.warn("⚠️ Unexpected API response structure:", data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching weather data:', error);
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

    let { title, content, location, latitude, longitude, locationUrl } = req.body;
    
    if (!latitude || !longitude) {
      console.warn("⚠️ Latitude/Longitude missing - Weather data will NOT be fetched!");
    } else {
      console.log(`📍 Fetching weather for lat: ${latitude}, lon: ${longitude}`);
    }

    let weatherData = null;
    if (latitude && longitude) {
      weatherData = await getWeatherData(latitude, longitude);
      console.log("🌤 Weather Data Fetched:", weatherData);
    }

    // Ensure author field is set using req.user.id
    const newPost = new Post({
      title,
      content,
      location,
      locationUrl, // ✅ Add locationUrl
      latitude,
      longitude,
      weatherData,
      author: req.user.id,
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get a single post by ID and populate comments
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username' } // ✅ This ensures author details are included
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

// Like a post
router.post('/:id/like', verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const userId = req.user.id;
    const hasLiked = post.likes.includes(userId);

    if (hasLiked) {
      post.likes = post.likes.filter(id => id !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.json(post);
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
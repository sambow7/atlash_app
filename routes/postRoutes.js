const express = require('express');
const fetch = require('node-fetch');
const Post = require('../models/Post'); // Import Post model
const router = express.Router();

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

// 🛠️ Create a new post with optional weather data
router.post('/', async (req, res) => {
  try {
    const { title, content, author, location, latitude, longitude } = req.body;

    let weatherData = null;

    // If latitude & longitude exist, fetch weather data
    if (latitude && longitude) {
      weatherData = await getWeatherData(latitude, longitude);
    }

    const newPost = new Post({
      title,
      content,
      author,
      location,
      latitude,
      longitude,
      weatherData,
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
// src/server.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./configs/database');

// Middleware
const app = express();

connectDB();

app.use(express.json());
app.use(cors());


mongoose.connect(process.env.MONGODB_URI, {})
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

// Import routes
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes'); // Confirmed commentRoutes import
const profileRoutes = require('./routes/profileRoutes'); // Added profileRoutes import


// Root route for testing
app.get('/', (req, res) => {
  res.send('Atlash backend is live!');
});

// Existing API routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/profile', profileRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
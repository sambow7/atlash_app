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
const commentRoutes = require('./routes/commentRoutes');
const profileRoutes = require('./routes/profileRoutes'); // Added profileRoutes import

//ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/profile', profileRoutes); // Added profileRoutes to the API

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
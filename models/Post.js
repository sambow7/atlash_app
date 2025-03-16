const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // References User model
  location: { type: String },
  locationUrl: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  weatherData: {
    temperature: Number,
    conditions: String,
    icon: String
  },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }], // References Comment model
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who liked the post
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
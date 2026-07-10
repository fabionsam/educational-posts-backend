const express = require('express');
const postRoutes = require('./routes/postRoutes');
const authRoutes = require('./routes/authRoutes');

// Load models to establish relationships
require('./models/user');
require('./models/post');

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Register API routes
app.use('/auth', authRoutes);
app.use('/posts', postRoutes);

// Catch-all 404 handler for undefined endpoints
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error.' });
});

module.exports = app;

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Add request timing middleware
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://quest-io.vercel.app', 'https://*.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Increase server limits to handle large responses
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Security headers
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Import routes
const healthRoutes = require('./routes/health');
const chatRoutes = require('./routes/chat');
const imageRoutes = require('./routes/image-new');
const voiceRoutes = require('./routes/voice-enhanced');
const speechRoutes = require('./routes/speech');
const weatherRoutes = require('./routes/weather-enhanced');
const webSearchRoutes = require('./routes/web-search');
const pollinationsRoutes = require('./routes/pollinations');
const visionRoutes = require('./routes/vision');
const artRoutes = require('./routes/art');

// Mount routes
app.use('/api/health', healthRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/image-enhanced', imageRoutes);
app.use('/api/voice-enhanced', voiceRoutes);
app.use('/api/speech', speechRoutes);
app.use('/api/weather-enhanced', weatherRoutes);
app.use('/api/web-search', webSearchRoutes);
app.use('/api/pollinations', pollinationsRoutes);
app.use('/api/vision', visionRoutes);
app.use('/api/art', artRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Quest.io API Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Quest.io API Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 API Status: http://localhost:${PORT}/`);
});

module.exports = app;
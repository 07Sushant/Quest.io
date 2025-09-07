const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server to attach WebSocket
const http = require('http');
const server = http.createServer(app);

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

// WebSocket bridge for Gemini Voice (Live audio) — voice-only change
let WebSocketServer
try {
  WebSocketServer = require('ws').Server
} catch (e) {
  console.warn('ws package not installed; Gemini voice WS disabled')
}

if (WebSocketServer) {
  const wss = new WebSocketServer({ server, path: '/ws/gemini-voice' })

  wss.on('error', (err) => {
    console.error('WS server error on /ws/gemini-voice:', err.message)
  })

  wss.on('connection', async (client, req) => {
    console.log('WS client connected to /ws/gemini-voice from', req?.socket?.remoteAddress)
    // Defer Live session creation until first message to avoid early close
    let GoogleGenAI, Modality
    let genai = null
    let session = null

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      try { client.send(JSON.stringify({ type: 'error', message: 'Missing GEMINI_API_KEY' })) } catch {}
      // Do not close immediately; let client display error UI
    }

    const ensureSession = async () => {
      if (session) return true
      if (!apiKey) return false
      try {
        if (!GoogleGenAI || !Modality) {
          const genaiMod = await import('@google/genai')
          GoogleGenAI = genaiMod.GoogleGenAI
          Modality = genaiMod.Modality
        }
        genai = new GoogleGenAI({ apiKey })
        session = await genai.live.connect({
          model: 'gemini-2.5-flash-preview-native-audio-dialog',
          callbacks: {
            onopen: () => { try { client.send(JSON.stringify({ type: 'status', message: 'live-connected' })) } catch {} },
            onmessage: (m) => { try { client.send(JSON.stringify(m)) } catch {} },
            onerror: (e) => { try { client.send(JSON.stringify({ type: 'error', message: e?.message || 'live error' })) } catch {} },
            onclose: (e) => { try { client.send(JSON.stringify({ type: 'status', message: 'live-closed', reason: e?.reason || '' })) } catch {} },
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Orus' } } },
          },
        })
        return true
      } catch (e) {
        try { client.send(JSON.stringify({ type: 'error', message: 'Failed to initialize Gemini Live', detail: e?.message })) } catch {}
        return false
      }
    }

    client.on('message', async (data, isBinary) => {
      try {
        if (!(await ensureSession())) return

        if (isBinary || Buffer.isBuffer(data)) {
          const base64 = Buffer.from(data).toString('base64')
          session.sendRealtimeInput({ media: { data: base64, mimeType: 'audio/pcm;rate=16000' } })
          return
        }

        const text = data.toString('utf8')
        let msg
        try { msg = JSON.parse(text) } catch {}

        if (msg?.media?.data && msg?.media?.mimeType) {
          session.sendRealtimeInput({ media: msg.media })
        } else if (msg) {
          session.send(msg)
        }
      } catch (e) {
        try { client.send(JSON.stringify({ type: 'error', message: e?.message || 'client message error' })) } catch {}
      }
    })

    const safeClose = () => { try { session?.close() } catch {} }
    client.on('close', safeClose)
    client.on('error', safeClose)

    try { client.send(JSON.stringify({ type: 'status', message: 'ws-connected' })) } catch {}
  })
}

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Quest.io API Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 API Status: http://localhost:${PORT}/`);
  console.log(`🔊 WS: ws://localhost:${PORT}/ws/gemini-voice`)
});

module.exports = app;
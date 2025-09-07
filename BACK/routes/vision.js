const express = require('express');
const axios = require('axios');
const multer = require('multer');
require('dotenv').config();

const router = express.Router();

// Multer for up to 4 images
const upload = multer({
  limits: {
    files: 4,
    fileSize: 15 * 1024 * 1024, // 15MB per file
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

const TEXT_BASE = process.env.POLLINATIONS_TEXT_API_URL || 'https://text.pollinations.ai';

// In-memory file cache for quick serving (resets on server restart)
if (!global.visionFileCache) global.visionFileCache = new Map();

// Serve uploaded files by id
router.get('/files/:id', (req, res) => {
  const id = req.params.id;
  if (!global.visionFileCache.has(id)) {
    return res.status(404).json({ error: 'File not found' });
  }
  const item = global.visionFileCache.get(id);
  res.setHeader('Content-Type', item.mimeType || 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(item.buffer);
});

// Analyze up to 4 images + question, then produce a comprehensive answer
router.post('/analyze', upload.array('images', 4), async (req, res) => {
  try {
    const question = (req.body.question || '').toString().trim();
    const imageUrlsBody = req.body.imageUrls; // could be string or string[]

    // Normalize image URLs input
    let imageUrls = [];
    if (Array.isArray(imageUrlsBody)) imageUrls = imageUrlsBody.filter(Boolean).slice(0, 4);
    else if (typeof imageUrlsBody === 'string' && imageUrlsBody.trim()) imageUrls = [imageUrlsBody.trim()].slice(0, 4);

    const files = req.files || [];

    // Build accessible URLs for uploaded files (for local previews) and inline data URLs for model
    const servedUrls = [];
    const inlineDataUrls = [];

    const bufferToDataUrl = (buffer, mime) => {
      const b64 = Buffer.from(buffer).toString('base64');
      return `data:${mime || 'image/png'};base64,${b64}`;
    };

    for (const file of files) {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      global.visionFileCache.set(id, {
        buffer: file.buffer,
        mimeType: file.mimetype,
        timestamp: Date.now(),
      });
      servedUrls.push(`/api/vision/files/${id}`);
      inlineDataUrls.push(bufferToDataUrl(file.buffer, file.mimetype));
    }

    // Prefer inline data URLs for uploads; keep external URLs as-is
    const allForModel = [...inlineDataUrls, ...imageUrls].slice(0, 4);

    if (allForModel.length === 0) {
      return res.status(400).json({ error: 'Provide at least one image (upload or URL)' });
    }

    // Step 1: Ask Pollinations to describe images in JSON using multimodal messages
    const describeUrl = new URL('/openai', TEXT_BASE).toString();

    // Build multimodal content array: instruction + images
    const contentParts = [
      { type: 'text', text: 'You will analyze up to 4 images. For each, return a JSON object with fields: index (1-based), url (echo exactly), name (2-5 words), description (1-2 sentences, objective, visual only). Output a JSON array only.' },
    ];
    allForModel.forEach((url, i) => {
      contentParts.push({ type: 'text', text: `Image ${i + 1} URL next.` });
      contentParts.push({ type: 'image_url', image_url: { url } });
    });

    const descResp = await axios.post(describeUrl, {
      model: 'openai',
      messages: [
        { role: 'user', content: contentParts }
      ],
      max_tokens: 500
    }, {
      timeout: 60000,
      headers: { 'Content-Type': 'application/json' }
    });

    // Extract assistant message content containing JSON
    const content = descResp.data?.choices?.[0]?.message?.content || '';

    // Try to parse JSON from content
    let descriptions = [];
    try {
      const start = content.indexOf('[');
      const end = content.lastIndexOf(']');
      if (start !== -1 && end !== -1 && end > start) {
        const jsonStr = content.slice(start, end + 1);
        descriptions = JSON.parse(jsonStr);
      }
    } catch (e) {
      descriptions = [];
    }

    // Step 2: Build final prompt combining descriptions and user's question
    const finalPrompt = `Based on these image descriptions and the user question, write a comprehensive, helpful answer.\n\nDescriptions:\n${JSON.stringify(descriptions, null, 2)}\n\nUser question: ${question || 'Describe these images succinctly.'}`;

    const textAnswerUrl = new URL('/' + encodeURIComponent(finalPrompt), TEXT_BASE).toString();
    const answerResp = await axios.get(textAnswerUrl, {
      timeout: 60000,
      headers: { Accept: 'text/plain' }
    });

    // Combine served URLs (for local preview) and any external URLs we received
    const responseImageList = [...servedUrls, ...imageUrls].slice(0, 4);

    return res.json({
      success: true,
      text: answerResp.data || '',
      descriptions,
      images: responseImageList,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const detail = error.response?.data || error.message || 'Unknown error';
    console.error('Vision analyze error:', detail);
    return res.status(500).json({ error: 'Vision analysis failed', detail });
  }
});

module.exports = router;
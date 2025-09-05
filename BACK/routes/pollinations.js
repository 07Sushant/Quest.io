const express = require('express');
const axios = require('axios');
const router = express.Router();

// SECURE POLLINATIONS PROXY - NO API EXPOSURE TO FRONTEND
// This route acts as a secure proxy to hide Pollinations API from client-side inspection

// Internal Pollinations API configuration (NEVER exposed to frontend)
const POLLINATIONS_CONFIG = {
  IMAGE_BASE_URL: 'https://image.pollinations.ai',
  TEXT_BASE_URL: 'https://text.pollinations.ai',
  DEFAULT_PARAMS: {
    width: 1024,
    height: 1024,
    model: 'flux',
    nologo: true,
    enhance: true
  }
};

// Utility function to sanitize prompts
function sanitizePrompt(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Invalid prompt provided');
  }
  
  // Remove potentially harmful characters and limit length
  return prompt
    .replace(/[<>\"'&]/g, '') // Remove HTML/script injection chars
    .trim()
    .substring(0, 500); // Limit prompt length
}

// Utility function to validate dimensions
function validateDimensions(width, height) {
  const minSize = 256;
  const maxSize = 2048;
  
  width = parseInt(width) || POLLINATIONS_CONFIG.DEFAULT_PARAMS.width;
  height = parseInt(height) || POLLINATIONS_CONFIG.DEFAULT_PARAMS.height;
  
  width = Math.max(minSize, Math.min(maxSize, width));
  height = Math.max(minSize, Math.min(maxSize, height));
  
  return { width, height };
}

// SECURE IMAGE GENERATION ENDPOINT
router.post('/generate-image', async (req, res) => {
  try {
    const { prompt, width, height, model, enhance, seed } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt is required',
        timestamp: new Date().toISOString()
      });
    }

    // Sanitize and validate inputs
    const sanitizedPrompt = sanitizePrompt(prompt);
    const dimensions = validateDimensions(width, height);
    
    // Build internal Pollinations URL (hidden from frontend)
    const pollinationsUrl = new URL('/prompt/' + encodeURIComponent(sanitizedPrompt), POLLINATIONS_CONFIG.IMAGE_BASE_URL);
    
    // Add parameters
    pollinationsUrl.searchParams.set('width', dimensions.width.toString());
    pollinationsUrl.searchParams.set('height', dimensions.height.toString());
    pollinationsUrl.searchParams.set('model', model || POLLINATIONS_CONFIG.DEFAULT_PARAMS.model);
    pollinationsUrl.searchParams.set('nologo', 'true');
    pollinationsUrl.searchParams.set('enhance', enhance !== false ? 'true' : 'false');
    
    if (seed) {
      pollinationsUrl.searchParams.set('seed', seed.toString());
    }

    console.log('🎨 Generating image via secure proxy...');
    
    // Make request to Pollinations (server-side only)
    const response = await axios.get(pollinationsUrl.toString(), {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Quest.io/1.0'
      }
    });

    // Store image temporarily and return URL instead of base64
    const imageBuffer = Buffer.from(response.data);
    const mimeType = response.headers['content-type'] || 'image/jpeg';
    const fileExtension = mimeType.split('/')[1] || 'jpg';
    
    // Generate unique filename
    const imageId = Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    const filename = `${imageId}.${fileExtension}`;
    
    // Store image in memory cache (in production, use proper file storage)
    if (!global.imageCache) {
      global.imageCache = new Map();
    }
    
    global.imageCache.set(imageId, {
      buffer: imageBuffer,
      mimeType: mimeType,
      timestamp: Date.now()
    });
    
    // Clean up old images (keep only last 100 images)
    if (global.imageCache.size > 100) {
      const entries = Array.from(global.imageCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toDelete = entries.slice(0, entries.length - 100);
      toDelete.forEach(([key]) => global.imageCache.delete(key));
    }

    // Return secure response with image URL instead of base64
    res.json({
      success: true,
      imageUrl: `/api/pollinations/image/${imageId}`,
      prompt: sanitizedPrompt,
      dimensions: dimensions,
      model: model || POLLINATIONS_CONFIG.DEFAULT_PARAMS.model,
      timestamp: new Date().toISOString(),
      metadata: {
        size: imageBuffer.length,
        format: fileExtension,
        enhanced: enhance !== false
      }
    });

  } catch (error) {
    console.error('❌ Image generation error:', error.message);
    
    res.status(500).json({
      error: 'Image generation failed',
      message: 'Unable to generate image at this time',
      timestamp: new Date().toISOString()
    });
  }
});

// SECURE TEXT GENERATION ENDPOINT
router.post('/generate-text', async (req, res) => {
  try {
    const { prompt, model, temperature, max_tokens } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt is required',
        timestamp: new Date().toISOString()
      });
    }

    // Sanitize prompt
    const sanitizedPrompt = sanitizePrompt(prompt);
    
    // Build internal Pollinations URL (hidden from frontend)
    const pollinationsUrl = new URL('/' + encodeURIComponent(sanitizedPrompt), POLLINATIONS_CONFIG.TEXT_BASE_URL);

    console.log('📝 Generating text via secure proxy...');
    
    // Make request to Pollinations (server-side only)
    const response = await axios.get(pollinationsUrl.toString(), {
      timeout: 30000,
      headers: {
        'User-Agent': 'Quest.io/1.0',
        'Accept': 'text/plain'
      }
    });

    // Return secure response (no Pollinations reference)
    res.json({
      success: true,
      text: response.data,
      prompt: sanitizedPrompt,
      model: model || 'default',
      timestamp: new Date().toISOString(),
      metadata: {
        length: response.data.length,
        words: response.data.split(' ').length
      }
    });

  } catch (error) {
    console.error('❌ Text generation error:', error.message);
    
    res.status(500).json({
      error: 'Text generation failed',
      message: 'Unable to generate text at this time',
      timestamp: new Date().toISOString()
    });
  }
});

// SECURE IMAGE PROXY ENDPOINT (for serving images without exposing Pollinations)
router.get('/image/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    
    // Validate imageId (should be base64 encoded Pollinations URL)
    if (!imageId || imageId.length > 500) {
      return res.status(400).json({ error: 'Invalid image ID' });
    }

    // Decode the image URL (this would be encoded by our frontend)
    let imageUrl;
    try {
      imageUrl = Buffer.from(imageId, 'base64').toString('utf-8');
    } catch (e) {
      return res.status(400).json({ error: 'Invalid image ID format' });
    }

    // Validate that it's a Pollinations URL (security check)
    if (!imageUrl.startsWith('https://image.pollinations.ai/')) {
      return res.status(403).json({ error: 'Unauthorized image source' });
    }

    // Fetch image from Pollinations
    const response = await axios.get(imageUrl, {
      responseType: 'stream',
      timeout: 15000
    });

    // Set appropriate headers
    res.set({
      'Content-Type': response.headers['content-type'] || 'image/jpeg',
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Source': 'Quest.io Image Service' // Hide Pollinations
    });

    // Stream the image
    response.data.pipe(res);

  } catch (error) {
    console.error('❌ Image proxy error:', error.message);
    res.status(500).json({
      error: 'Image not available',
      timestamp: new Date().toISOString()
    });
  }
});

// Health check for Pollinations service (internal use)
router.get('/health', async (req, res) => {
  try {
    // Test both services
    const [imageTest, textTest] = await Promise.allSettled([
      axios.head(POLLINATIONS_CONFIG.IMAGE_BASE_URL, { timeout: 5000 }),
      axios.head(POLLINATIONS_CONFIG.TEXT_BASE_URL, { timeout: 5000 })
    ]);

    res.json({
      status: 'healthy',
      services: {
        image: imageTest.status === 'fulfilled',
        text: textTest.status === 'fulfilled'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      error: 'Service health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// IMAGE SERVING ENDPOINT
router.get('/image/:imageId', (req, res) => {
  try {
    const { imageId } = req.params;
    console.log(`🖼️ Image request for ID: ${imageId}`);
    console.log(`📦 Cache exists: ${!!global.imageCache}`);
    console.log(`📦 Cache size: ${global.imageCache ? global.imageCache.size : 0}`);
    console.log(`📦 Has image: ${global.imageCache ? global.imageCache.has(imageId) : false}`);
    
    if (!global.imageCache || !global.imageCache.has(imageId)) {
      console.log(`❌ Image not found in cache: ${imageId}`);
      return res.status(404).json({
        error: 'Image not found',
        message: 'The requested image does not exist or has expired',
        timestamp: new Date().toISOString()
      });
    }
    
    const imageData = global.imageCache.get(imageId);
    
    // Set appropriate headers
    res.set({
      'Content-Type': imageData.mimeType,
      'Content-Length': imageData.buffer.length,
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'ETag': `"${imageId}"`,
      'Last-Modified': new Date(imageData.timestamp).toUTCString()
    });
    
    // Send the image buffer
    res.send(imageData.buffer);
    
  } catch (error) {
    console.error('❌ Image serving error:', error.message);
    
    res.status(500).json({
      error: 'Image serving failed',
      message: 'Unable to serve image at this time',
      timestamp: new Date().toISOString()
    });
  }
});

// TEST ENDPOINT
router.get('/test', (req, res) => {
  res.json({
    message: 'Pollinations route is working',
    timestamp: new Date().toISOString()
  });
});

// TEST IMAGE ENDPOINT
router.get('/test-image/:id', (req, res) => {
  res.json({
    message: 'Image route test',
    id: req.params.id,
    cacheExists: !!global.imageCache,
    cacheSize: global.imageCache ? global.imageCache.size : 0,
    timestamp: new Date().toISOString()
  });
});

// HEALTH CHECK ENDPOINT
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Pollinations Proxy',
    cacheSize: global.imageCache ? global.imageCache.size : 0,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
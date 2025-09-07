const express = require('express');
const axios = require('axios');
const multer = require('multer');
const natural = require('natural');
const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// NLP-based prompt and dimension extraction function
function parseImagePrompt(userInput) {
  const input = userInput.toLowerCase().trim();
  
  // Normalize separators and whitespace
  const normalized = input
    .replace(/[×✕✖✖️]/g, 'x')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Default values
  let prompt = userInput;
  let width = 1024;
  let height = 1024;
  
  // Extract dimensions using regex patterns (use normalized text)
  const dimensionPatterns = [
    // Pattern: "1024x768", "1920x1080", etc.
    /(\d{3,4})\s*[x]\s*(\d{3,4})/i,
    // Pattern: "width 1024 height 768"
    /width\s*:?\s*(\d{3,4}).*?height\s*:?\s*(\d{3,4})/i,
    // Pattern: "1024 by 768", "1920 by 1080"
    /(\d{3,4})\s+by\s+(\d{3,4})/i,
    // Pattern: "size 1024x768"
    /size\s*:?\s*(\d{3,4})\s*[x]\s*(\d{3,4})/i,
    // Pattern: "dimensions 1024x768"
    /dimensions?\s*:?\s*(\d{3,4})\s*[x]\s*(\d{3,4})/i
  ];
  
  let foundDimensions = false;
  for (const pattern of dimensionPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      width = parseInt(match[1]);
      height = parseInt(match[2]);
      foundDimensions = true;
      
      // Remove dimension part from prompt (handle different x symbols)
      const removePattern = new RegExp(match[0].replace('x', '[x×✕✖✖️]'), 'gi');
      prompt = userInput.replace(removePattern, '').trim();
      break;
    }
  }
  
  // If no explicit dimensions found, look for common size keywords
  if (!foundDimensions) {
    const sizeKeywords = {
      'full hd': { width: 1920, height: 1080 },
      '1080p': { width: 1920, height: 1080 },
      '720p': { width: 1280, height: 720 },
      '4k': { width: 3840, height: 2160 },
      'uhd': { width: 3840, height: 2160 },
      'hd': { width: 1280, height: 720 },
      'wallpaper': { width: 1920, height: 1080 },
      'square': { width: 1024, height: 1024 },
      'portrait': { width: 768, height: 1024 },
      'landscape': { width: 1920, height: 1080 },
      'wide': { width: 1920, height: 1080 },
      'tall': { width: 1080, height: 1920 },
      'banner': { width: 1200, height: 400 },
      'avatar': { width: 512, height: 512 },
      'thumbnail': { width: 300, height: 300 },
      'instagram': { width: 1080, height: 1080 },
      'twitter': { width: 1200, height: 675 },
      'facebook': { width: 1200, height: 630 }
    };
    
    for (const [keyword, dimensions] of Object.entries(sizeKeywords)) {
      if (normalized.includes(keyword)) {
        width = dimensions.width;
        height = dimensions.height;
        // Remove size keyword from prompt
        const kwRegex = new RegExp(keyword.replace(' ', '\\s+'), 'gi');
        prompt = prompt.replace(kwRegex, '').trim();
        break;
      }
    }
  }
  
  // Clean up the prompt - remove common dimension-related words
  const cleanupWords = ['size', 'dimension', 'dimensions', 'resolution', 'pixels', 'px', 'image', 'picture', 'photo', 'generate', 'create', 'make'];
  let cleanedPrompt = prompt;
  
  cleanupWords.forEach(word => {
    const regex = new RegExp(`\\b${word}s?\\b`, 'gi');
    cleanedPrompt = cleanedPrompt.replace(regex, '').trim();
  });
  
  // Remove extra spaces and clean up
  cleanedPrompt = cleanedPrompt.replace(/\s+/g, ' ').trim();
  
  // Ensure dimensions are within valid range (allow larger for HD/4K)
  width = Math.max(256, Math.min(4096, width));
  height = Math.max(256, Math.min(4096, height));
  
  return {
    prompt: cleanedPrompt || 'a beautiful image',
    width,
    height,
    originalInput: userInput
  };
}

// ENHANCED IMAGE GENERATION with NLP parsing
router.post('/generate', async (req, res) => {
  try {
    const { prompt: userInput, enhance = true } = req.body;
    
    if (!userInput || userInput.trim().length === 0) {
      return res.status(400).json({
        error: 'Prompt is required',
        timestamp: new Date().toISOString()
      });
    }

    // Parse the user input using NLP
    const parsed = parseImagePrompt(userInput);
    
    console.log('🎨 NLP Parsed Image Request:', {
      originalInput: userInput,
      extractedPrompt: parsed.prompt,
      dimensions: { width: parsed.width, height: parsed.height }
    });

    // Enhance the prompt if requested
    let finalPrompt = parsed.prompt;
    if (enhance) {
      finalPrompt = enhancePrompt(parsed.prompt);
    }

    // Generate image using direct Pollinations API
    // Hardcode a default seed to get consistent, high-quality results
    const DEFAULT_SEED = 934417;
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${parsed.width}&height=${parsed.height}&model=flux&nologo=true&enhance=true&seed=${DEFAULT_SEED}`;
    
    console.log('🚀 Generating image with URL:', imageUrl);

    // Fetch the image
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 45000,
      headers: {
        'User-Agent': 'Quest.io/1.0.0'
      }
    });

    // Convert to base64 for easy handling
    const imageBuffer = Buffer.from(response.data);
    const imageBase64 = imageBuffer.toString('base64');
    const mimeType = response.headers['content-type'] || 'image/jpeg';
    
    // Store in memory cache for serving
    if (!global.imageCache) {
      global.imageCache = new Map();
    }
    
    const imageId = Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    global.imageCache.set(imageId, {
      buffer: imageBuffer,
      mimeType: mimeType,
      timestamp: Date.now(),
      prompt: finalPrompt,
      originalInput: userInput,
      dimensions: { width: parsed.width, height: parsed.height }
    });
    
    // Clean up old images (keep only last 50 images)
    if (global.imageCache.size > 50) {
      const entries = Array.from(global.imageCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toDelete = entries.slice(0, entries.length - 50);
      toDelete.forEach(([key]) => global.imageCache.delete(key));
    }

    // Return response with local image URL
    res.json({
      success: true,
      imageUrl: `/api/image-enhanced/serve/${imageId}`,
      prompt: parsed.prompt,
      enhancedPrompt: finalPrompt,
      originalInput: userInput,
      dimensions: { width: parsed.width, height: parsed.height },
      model: 'flux',
      timestamp: new Date().toISOString(),
      metadata: {
        size: imageBuffer.length,
        format: mimeType.split('/')[1],
        enhanced: enhance,
        nlpParsed: true
      }
    });

  } catch (error) {
    console.error('❌ Enhanced image generation error:', error.message);
    
    res.status(500).json({
      error: 'Image generation failed',
      message: error.response?.data?.message || 'Unable to generate image',
      timestamp: new Date().toISOString()
    });
  }
});

// Image serving endpoint
router.get('/serve/:imageId', (req, res) => {
  try {
    const { imageId } = req.params;
    
    if (!global.imageCache || !global.imageCache.has(imageId)) {
      return res.status(404).json({
        error: 'Image not found',
        message: 'The requested image does not exist or has expired'
      });
    }
    
    const imageData = global.imageCache.get(imageId);
    
    // Set headers for proper image serving
    res.set({
      'Content-Type': imageData.mimeType,
      'Content-Length': imageData.buffer.length,
      'Cache-Control': 'public, max-age=3600',
      'ETag': `"${imageId}"`,
      'Last-Modified': new Date(imageData.timestamp).toUTCString(),
      'X-Prompt': imageData.prompt,
      'X-Dimensions': `${imageData.dimensions.width}x${imageData.dimensions.height}`
    });
    
    res.send(imageData.buffer);
    
  } catch (error) {
    console.error('❌ Image serving error:', error.message);
    res.status(500).json({
      error: 'Image serving failed',
      message: 'Unable to serve image'
    });
  }
});

// Enhanced prompt function
function enhancePrompt(prompt) {
  // Add artistic enhancements
  const enhancements = [
    'highly detailed',
    'professional quality',
    'vibrant colors',
    'sharp focus',
    '8k resolution'
  ];
  
  let enhanced = prompt;
  
  // Add quality enhancements if not present
  if (!prompt.toLowerCase().includes('detail')) {
    enhanced += ', highly detailed';
  }
  
  if (!prompt.toLowerCase().includes('quality') && !prompt.toLowerCase().includes('resolution')) {
    enhanced += ', professional quality, 8k resolution';
  }
  
  if (!prompt.toLowerCase().includes('color')) {
    enhanced += ', vibrant colors';
  }
  
  return enhanced;
}

// Test NLP parsing endpoint
router.post('/parse-prompt', (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    const parsed = parseImagePrompt(prompt);
    
    res.json({
      success: true,
      originalInput: prompt,
      parsed: parsed,
      enhanced: enhancePrompt(parsed.prompt),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Parsing failed',
      message: error.message
    });
  }
});

module.exports = router;

module.exports = router;
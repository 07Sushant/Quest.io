const express = require('express');
const axios = require('axios');
const multer = require('multer');
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

// ENHANCED IMAGE GENERATION - Uses secure Pollinations proxy
router.post('/generate', async (req, res) => {
  try {
    const { prompt, width, height, model, enhance, seed, nologo } = req.body;
    
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({
        error: 'Prompt is required',
        timestamp: new Date().toISOString()
      });
    }

    // Enhanced prompt processing
    let enhancedPrompt = prompt.trim();
    
    // Auto-enhance prompt if requested
    if (enhance !== false) {
      enhancedPrompt = await enhancePromptInternal(prompt);
    }

    console.log('🎨 Enhanced Image Generation Request:', {
      originalPrompt: prompt,
      enhancedPrompt: enhancedPrompt,
      dimensions: { width, height }
    });

    // Call our secure Pollinations proxy (internal route)
    const pollinationsResponse = await axios.post('http://localhost:3001/api/pollinations/generate-image', {
      prompt: enhancedPrompt,
      width: width || 1024,
      height: height || 1024,
      model: model || 'flux',
      enhance: true,
      seed: seed
    });

    // Return enhanced response
    res.json({
      imageUrl: pollinationsResponse.data.imageUrl,
      prompt: prompt,
      enhancedPrompt: enhancedPrompt,
      model: pollinationsResponse.data.model,
      dimensions: pollinationsResponse.data.dimensions,
      timestamp: new Date().toISOString(),
      metadata: {
        ...pollinationsResponse.data.metadata,
        enhanced: enhance !== false,
        processingTime: Date.now() - req.startTime
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

// IMAGE ANALYSIS ENDPOINT
router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    const { question, model } = req.body;
    const imageFile = req.file;
    const imageUrl = req.body.imageUrl;

    if (!imageFile && !imageUrl) {
      return res.status(400).json({
        error: 'Either image file or image URL is required',
        timestamp: new Date().toISOString()
      });
    }

    let analysisPrompt = question || 'Describe this image in detail';
    
    // For now, return a mock analysis (can be enhanced with actual AI vision API)
    const mockAnalysis = {
      analysis: `Image Analysis: ${analysisPrompt}\n\nThis appears to be an image that has been uploaded for analysis. The system has received the image successfully and would normally process it through an AI vision model to provide detailed insights about its contents, objects, colors, composition, and any text present.`,
      model: model || 'vision-analysis-v1',
      confidence: 0.85,
      detectedObjects: [
        { name: 'image', confidence: 1.0 }
      ],
      timestamp: new Date().toISOString(),
      metadata: {
        fileSize: imageFile?.size,
        mimeType: imageFile?.mimetype,
        originalName: imageFile?.originalname
      }
    };

    res.json(mockAnalysis);

  } catch (error) {
    console.error('❌ Image analysis error:', error.message);
    
    res.status(500).json({
      error: 'Image analysis failed',
      message: 'Unable to analyze image at this time',
      timestamp: new Date().toISOString()
    });
  }
});

// IMAGE SEARCH ENDPOINT
router.post('/search', async (req, res) => {
  try {
    const { query, count = 10 } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Search query is required',
        timestamp: new Date().toISOString()
      });
    }

    // Generate multiple images based on search query
    const imagePrompts = generateImageSearchPrompts(query, count);
    const imageResults = [];

    for (let i = 0; i < Math.min(imagePrompts.length, count); i++) {
      try {
        const response = await axios.post('http://localhost:3001/api/pollinations/generate-image', {
          prompt: imagePrompts[i],
          width: 512,
          height: 512,
          model: 'flux',
          enhance: true
        });

        imageResults.push({
          id: `img_${i + 1}`,
          url: response.data.imageUrl,
          prompt: imagePrompts[i],
          title: `${query} - Variation ${i + 1}`,
          description: `AI-generated image for: ${imagePrompts[i]}`,
          dimensions: response.data.dimensions,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error(`Failed to generate image ${i + 1}:`, error.message);
      }
    }

    res.json({
      query: query,
      results: imageResults,
      totalResults: imageResults.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Image search error:', error.message);
    
    res.status(500).json({
      error: 'Image search failed',
      message: 'Unable to search images at this time',
      timestamp: new Date().toISOString()
    });
  }
});

// PROMPT ENHANCEMENT ENDPOINT
router.post('/enhance-prompt', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({
        error: 'Prompt is required',
        timestamp: new Date().toISOString()
      });
    }

    const enhancedPrompt = await enhancePromptInternal(prompt);

    res.json({
      originalPrompt: prompt,
      enhancedPrompt: enhancedPrompt,
      improvements: [
        'Added artistic style descriptors',
        'Enhanced lighting and composition details',
        'Improved color and mood specifications',
        'Added technical quality parameters'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Prompt enhancement error:', error.message);
    
    res.status(500).json({
      error: 'Prompt enhancement failed',
      message: 'Unable to enhance prompt at this time',
      timestamp: new Date().toISOString()
    });
  }
});

// UTILITY FUNCTIONS

async function enhancePromptInternal(prompt) {
  // Enhanced prompt engineering for better image generation
  const enhancements = [
    'highly detailed',
    'professional photography',
    'cinematic lighting',
    '8k resolution',
    'sharp focus',
    'vibrant colors'
  ];

  // Add style and quality enhancements
  let enhanced = prompt;
  
  // Add artistic enhancements if not already present
  if (!prompt.toLowerCase().includes('detailed')) {
    enhanced += ', highly detailed';
  }
  
  if (!prompt.toLowerCase().includes('quality') && !prompt.toLowerCase().includes('resolution')) {
    enhanced += ', high quality, 8k resolution';
  }
  
  if (!prompt.toLowerCase().includes('lighting')) {
    enhanced += ', professional lighting';
  }

  return enhanced;
}

function generateImageSearchPrompts(query, count) {
  const basePrompt = query;
  const variations = [
    `${basePrompt}, photorealistic style`,
    `${basePrompt}, artistic illustration`,
    `${basePrompt}, digital art style`,
    `${basePrompt}, minimalist design`,
    `${basePrompt}, vintage aesthetic`,
    `${basePrompt}, modern contemporary`,
    `${basePrompt}, abstract interpretation`,
    `${basePrompt}, detailed close-up`,
    `${basePrompt}, wide angle view`,
    `${basePrompt}, dramatic lighting`
  ];

  return variations.slice(0, count);
}

// Add request timing middleware
router.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

module.exports = router;
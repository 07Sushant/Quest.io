const express = require('express');
const axios = require('axios');
const router = express.Router();

// Text to Speech endpoint
router.post('/text-to-speech', async (req, res) => {
  try {
    const { text, voice = 'nova', model = 'openai-audio' } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Text is required',
        timestamp: new Date().toISOString()
      });
    }

    const token = process.env.POLLINATIONS_SPEECH_TOKEN;
    if (!token) {
      return res.status(500).json({
        error: 'Speech token not configured',
        timestamp: new Date().toISOString()
      });
    }

    // Construct the Pollinations speech API URL
    const speechUrl = `https://text.pollinations.ai/${encodeURIComponent(text)}?model=${model}&voice=${voice}&token=${token}`;

    console.log('Generating speech for text:', text.substring(0, 50) + '...');
    console.log('Speech URL:', speechUrl);

    // Make request to Pollinations API
    const response = await axios.get(speechUrl, {
      responseType: 'arraybuffer',
      timeout: 60000, // Increased timeout
      headers: {
        'User-Agent': 'Quest.io/1.0.0',
        'Accept': 'audio/mpeg, audio/wav, audio/*'
      },
      validateStatus: function (status) {
        return status >= 200 && status < 300; // default
      }
    });

    // Check if we got audio data
    if (!response.data || response.data.length === 0) {
      throw new Error('No audio data received from API');
    }

    // Return the audio data as base64
    const audioBuffer = Buffer.from(response.data);
    const audioBase64 = audioBuffer.toString('base64');
    
    res.json({
      success: true,
      audioData: audioBase64,
      contentType: response.headers['content-type'] || 'audio/mpeg',
      size: audioBuffer.length,
      text: text,
      voice: voice,
      model: model,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Speech generation error:', error.message);
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data?.toString?.(),
      url: speechUrl
    });
    
    let errorMessage = 'Failed to generate speech';
    let statusCode = 500;

    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Speech generation timed out';
      statusCode = 408;
    } else if (error.response) {
      statusCode = error.response.status;
      errorMessage = `API error: ${error.response.status} - ${error.response.statusText}`;
      
      // Log response data for debugging
      if (error.response.data) {
        console.error('Response data:', error.response.data.toString());
      }
    } else if (error.request) {
      errorMessage = 'No response from speech API';
      statusCode = 503;
    }

    res.status(statusCode).json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check for speech service
router.get('/health', (req, res) => {
  res.json({
    service: 'Speech Service',
    status: 'healthy',
    features: ['text-to-speech'],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

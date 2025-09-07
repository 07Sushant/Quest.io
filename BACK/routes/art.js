const express = require('express');
const multer = require('multer');
const mime = require('mime-types');
async function getGenAI() {
  try {
    const mod = await import('@google/genai')
    const Cls = mod.GoogleGenAI || mod.default?.GoogleGenAI || mod.default
    return Cls
  } catch (e) {
    console.error('Failed to load @google/genai:', e)
    return null
  }
}
require('dotenv').config();

const router = express.Router();

// Multer for single image
const upload = multer({
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// POST /api/art/transform
// Body: form-data with fields: image (file), prompt (text)
router.post('/transform', upload.single('image'), async (req, res) => {
  try {
    const prompt = (req.body.prompt || '').toString();
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'Image file is required' });
    if (!prompt.trim()) return res.status(400).json({ error: 'Prompt is required' });
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'Missing GEMINI_API_KEY' });

    const GoogleGenAI = await getGenAI()
    if (!GoogleGenAI) return res.status(500).json({ error: 'Model SDK not loaded' });
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Gemini 2.5 Flash with image preview streaming
    const model = 'gemini-2.5-flash-image-preview';

    const config = {
      responseModalities: ['IMAGE', 'TEXT'],
    };

    const contents = [
      {
        role: 'user',
        parts: [
          { text: prompt },
          // Provide the uploaded image as inlineData
          {
            inlineData: {
              mimeType: file.mimetype || 'image/png',
              data: file.buffer.toString('base64'),
            },
          },
        ],
      },
    ];

    const stream = await ai.models.generateContentStream({ model, config, contents });

    // We will capture last image and full text for returning to client
    let lastImage = null;
    let textParts = [];

    for await (const chunk of stream) {
      const parts = chunk?.candidates?.[0]?.content?.parts || [];
      for (const p of parts) {
        if (p.inlineData) {
          lastImage = p.inlineData; // { mimeType, data }
        }
        if (p.text) {
          textParts.push(p.text);
        }
      }
    }

    if (!lastImage) {
      return res.status(500).json({ error: 'No image returned by model' });
    }

    const extension = mime.extension(lastImage.mimeType || '') || 'png';
    const base64 = lastImage.data || '';

    // Serve as Data URL for simplicity in frontend
    const dataUrl = `data:${lastImage.mimeType || 'image/png'};base64,${base64}`;

    return res.json({
      success: true,
      imageUrl: dataUrl,
      description: textParts.join(' ').trim(),
      mimeType: lastImage.mimeType || 'image/png',
      filename: `art_result.${extension}`,
      model,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Art transform error:', error?.response?.data || error.message || error);
    return res.status(500).json({ error: 'Art transform failed' });
  }
});

module.exports = router;
const express = require('express');
const axios = require('axios');
const router = express.Router();

// SECURE CHAT COMPLETION - Uses Pollinations text API as proxy
router.post('/completion', async (req, res) => {
  try {
    const { messages, model, temperature, maxTokens } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'Messages array is required',
        timestamp: new Date().toISOString()
      });
    }

    // Extract the latest user message
    const userMessage = messages[messages.length - 1];
    if (!userMessage || userMessage.role !== 'user') {
      return res.status(400).json({
        error: 'Last message must be from user',
        timestamp: new Date().toISOString()
      });
    }

    console.log('💬 Chat completion request:', {
      messageCount: messages.length,
      model: model || 'default',
      userQuery: userMessage.content.substring(0, 100) + '...'
    });

    // Build conversation context
    let conversationContext = '';
    messages.forEach(msg => {
      if (msg.role === 'user') {
        conversationContext += `Human: ${msg.content}\n`;
      } else if (msg.role === 'assistant') {
        conversationContext += `Assistant: ${msg.content}\n`;
      }
    });

    // Add system context for better responses
    
    const enhancedPrompt = `You are Quest.io, an advanced AI search assistant. You provide helpful, clean text always, accurate, and engaging responses. You can help with research, analysis, creative tasks, and general questions. Your name is Quest.io.

${conversationContext}

Please provide a helpful and informative response and avoid "—" in between text it is noise always provide clean text.`;

    // Call our secure Pollinations text proxy
    const pollinationsResponse = await axios.post('http://localhost:3001/api/pollinations/generate-text', {
      prompt: enhancedPrompt,
      model: model || 'default',
      temperature: temperature || 0.7,
      max_tokens: maxTokens || 1000
    });

    // Process and format the response
    let responseText = pollinationsResponse.data.text || 'I apologize, but I was unable to generate a response at this time.';
    
    // Clean up the response
    responseText = responseText.trim();
    
    // Remove any potential "Assistant:" prefix if it exists
    if (responseText.startsWith('Assistant:')) {
      responseText = responseText.substring('Assistant:'.length).trim();
    }

    // Generate HTML formatted version
    const htmlOutput = formatTextToHTML(responseText);

    // Return structured response
    res.json({
      output: responseText,
      htmlOutput: htmlOutput,
      tokens: responseText.split(' ').length, // Approximate token count
      model: model || 'quest-ai-v1',
      quotaStatus: {
        tokensUsed: responseText.split(' ').length,
        remaining: 10000,
        limit: 10000
      },
      sources: [],
      timestamp: new Date().toISOString(),
      metadata: {
        processingTime: Date.now() - req.startTime,
        messageCount: messages.length,
        conversationId: req.headers['x-conversation-id'] || 'default'
      }
    });

  } catch (error) {
    console.error('❌ Chat completion error:', error.message);
    
    res.status(500).json({
      error: 'Chat completion failed',
      message: error.response?.data?.message || 'Unable to process chat request',
      timestamp: new Date().toISOString()
    });
  }
});

// STREAMING CHAT COMPLETION
router.post('/completion/stream', async (req, res) => {
  try {
    const { messages, model, temperature, maxTokens } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'Messages array is required'
      });
    }

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Get the response from our text generation
    const userMessage = messages[messages.length - 1];
    let conversationContext = '';
    messages.forEach(msg => {
      if (msg.role === 'user') {
        conversationContext += `Human: ${msg.content}\n`;
      } else if (msg.role === 'assistant') {
        conversationContext += `Assistant: ${msg.content}\n`;
      }
    });

    const enhancedPrompt = `You are Quest.io, an advanced AI search assistant. You provide helpful, accurate, and engaging responses.

${conversationContext}

Please provide a helpful response.`;

    try {
      const pollinationsResponse = await axios.post('http://localhost:3001/api/pollinations/generate-text', {
        prompt: enhancedPrompt,
        model: model || 'default'
      });

      let responseText = pollinationsResponse.data.text || 'I apologize, but I was unable to generate a response.';
      responseText = responseText.trim();
      
      if (responseText.startsWith('Assistant:')) {
        responseText = responseText.substring('Assistant:'.length).trim();
      }

      // Simulate streaming by sending chunks
      const words = responseText.split(' ');
      for (let i = 0; i < words.length; i++) {
        const chunk = {
          choices: [{
            delta: {
              content: words[i] + (i < words.length - 1 ? ' ' : '')
            }
          }]
        };
        
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        
        // Add small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      res.write('data: [DONE]\n\n');
      res.end();

    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`);
      res.end();
    }

  } catch (error) {
    console.error('❌ Streaming error:', error.message);
    res.status(500).json({
      error: 'Streaming failed',
      message: 'Unable to start streaming response'
    });
  }
});

// UTILITY FUNCTIONS

function formatTextToHTML(text) {
  // Convert markdown to HTML with better formatting
  let html = text;
  
  // Handle code blocks first (```code```)
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  
  // Handle inline code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Handle bold text (**text** or __text__)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  
  // Handle italic text (*text* or _text_)
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
  
  // Handle headings (# ## ###)
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  
  // Handle bullet points (- item or * item) - improved regex
  html = html.replace(/^[\s]*[-*]\s+(.*)$/gm, (match, item) => {
    return `<li>${item.trim()}</li>`;
  });
  
  // Handle numbered lists (1. item, 2. item)
  html = html.replace(/^[\s]*\d+\.\s+(.*)$/gm, (match, item) => {
    return `<li>${item.trim()}</li>`;
  });
  
  // Wrap consecutive <li> elements in <ul> - improved logic
  html = html.replace(/(<li>.*?<\/li>)(\s*<li>.*?<\/li>)*/gs, (match) => {
    return '<ul>' + match.replace(/\s+/g, ' ') + '</ul>';
  });
  
  // Handle line breaks and paragraphs
  html = html.replace(/\n\n+/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');
  
  // Clean up any empty paragraphs and extra spaces
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/\s+/g, ' ');
  
  // Wrap in paragraph if doesn't start with block element
  if (!html.match(/^<(h[1-6]|ul|ol|pre|div)/)) {
    html = `<p>${html}</p>`;
  }
  
  return html;
}

// Add request timing middleware
router.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

module.exports = router;
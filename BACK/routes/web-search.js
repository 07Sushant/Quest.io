const express = require('express');
const axios = require('axios');
const router = express.Router();

// WEB SEARCH ENDPOINT (Gemini grounded search with URL citations)
router.post('/search', async (req, res) => {
  try {
    const { query, num_results = 10, safe_search = 'moderate', region = 'us', language = 'en' } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Search query is required',
        timestamp: new Date().toISOString()
      });
    }

    console.log('🔍 Web search request (Gemini grounded):', {
      query: query.substring(0, 200),
      num_results,
      region,
      language,
      safe_search
    });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback to previous mock behavior if key is missing
      const mockResults = generateMockSearchResults(query, num_results);
      const insights = await generateSearchInsights(query, mockResults);
      return res.json({
        query,
        results: mockResults,
        insights,
        related_searches: generateRelatedSearches(query),
        timestamp: new Date().toISOString(),
        metadata: {
          total_results: mockResults.length,
          search_time: Math.random() * 0.5 + 0.1,
          region,
          language,
          safe_search,
          grounded: false
        }
      });
    }

    // Lazy-load Google GenAI to avoid affecting other routes
    let GoogleGenAI;
    try {
      ({ GoogleGenAI } = await import('@google/genai'));
    } catch (e) {
      console.error('Failed to import @google/genai:', e?.message);
      return res.status(500).json({
        error: 'Service not available',
        message: 'AI provider not installed on server',
        timestamp: new Date().toISOString()
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Tools configuration: urlContext + googleSearch
    const tools = [
      { urlContext: {} },
      { googleSearch: {} }
    ];

    // Build a strict instruction to return JSON with citations
    const systemInstruction = `You are a grounded web search assistant. Use Google Grounding with web results and cite URLs.
Return a compact JSON object with keys: results (array of {title, url, snippet}), answer (string), related_searches (array of strings),
and current (object with time and date in ISO). Do not include any extra keys or text outside JSON.`;

    const userPrompt = `Query: ${query}\n
- Language: ${language}\n- Region: ${region}\n- SafeSearch: ${safe_search}\n- MaxResults: ${Math.max(1, Math.min(25, Number(num_results) || 10))}\n
Requirements:\n1) Use Google-grounded search.\n2) Provide 5-10 top results with titles, URLs, and concise snippets.\n3) Ensure each result includes a valid URL.\n4) Provide a concise answer summarizing key points.\n5) Include 5 related searches.\n6) Include current time/date.\n7) Respond ONLY with JSON.`;

    // Prefer non-streaming for simpler server handling
    let aiResponseText = '';
    try {
      const resp = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        config: {
          thinkingConfig: { thinkingBudget: 0 },
          tools
        },
        contents: [
          { role: 'user', parts: [{ text: systemInstruction }] },
          { role: 'user', parts: [{ text: userPrompt }] }
        ]
      });
      // SDK typically exposes .text on response
      aiResponseText = (resp?.text ?? '').trim();
    } catch (e) {
      console.error('Gemini grounded search error:', e?.message);
      return res.status(502).json({
        error: 'AI search failed',
        message: 'Unable to query grounded search at this time',
        timestamp: new Date().toISOString()
      });
    }

    // Try to parse JSON; if it fails, degrade gracefully
    let parsed;
    try {
      // Some models may wrap JSON in code fences; strip if present
      const cleaned = aiResponseText
        .replace(/^```(?:json)?/i, '')
        .replace(/```$/i, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      // Fallback: produce minimal shape with raw text
      parsed = {
        results: [],
        answer: aiResponseText || 'No structured response available.',
        related_searches: generateRelatedSearches(query),
        current: { time: new Date().toISOString(), date: new Date().toISOString().slice(0,10) }
      };
    }

    // Validate and clamp results
    const results = Array.isArray(parsed.results) ? parsed.results.slice(0, Math.max(1, Math.min(25, Number(num_results) || 10))) : [];
    const normalizedResults = results
      .filter(r => r && typeof r === 'object')
      .map((r, i) => ({
        title: String(r.title || `Result ${i+1}`),
        url: String(r.url || ''),
        snippet: String(r.snippet || ''),
      }))
      .filter(r => /^https?:\/\//i.test(r.url));

    const responseBody = {
      query,
      results: normalizedResults,
      insights: parsed.answer || '',
      related_searches: Array.isArray(parsed.related_searches) && parsed.related_searches.length
        ? parsed.related_searches.slice(0, 10)
        : generateRelatedSearches(query),
      timestamp: new Date().toISOString(),
      metadata: {
        total_results: normalizedResults.length,
        region,
        language,
        safe_search,
        grounded: true
      },
      current: parsed.current || { time: new Date().toISOString(), date: new Date().toISOString().slice(0,10) }
    };

    return res.json(responseBody);

  } catch (error) {
    console.error('❌ Web search error:', error?.message);
    res.status(500).json({
      error: 'Web search failed',
      message: 'Unable to perform web search at this time',
      timestamp: new Date().toISOString()
    });
  }
});

// NEWS SEARCH ENDPOINT
router.post('/news', async (req, res) => {
  try {
    const { query, num_results = 10, time_range = 'week', category, region = 'us' } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Search query is required',
        timestamp: new Date().toISOString()
      });
    }

    console.log('📰 News search request:', {
      query: query.substring(0, 100),
      num_results,
      time_range,
      category
    });

    // Mock news results
    const mockNewsResults = generateMockNewsResults(query, num_results);

    res.json({
      query: query,
      results: mockNewsResults,
      category: category || 'general',
      time_range: time_range,
      timestamp: new Date().toISOString(),
      metadata: {
        total_results: mockNewsResults.length,
        sources: [...new Set(mockNewsResults.map(r => r.domain))],
        region: region
      }
    });

  } catch (error) {
    console.error('❌ News search error:', error.message);
    
    res.status(500).json({
      error: 'News search failed',
      message: 'Unable to search news at this time',
      timestamp: new Date().toISOString()
    });
  }
});

// ACADEMIC SEARCH ENDPOINT
router.post('/academic', async (req, res) => {
  try {
    const { query, num_results = 10, publication_year, subject } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Search query is required',
        timestamp: new Date().toISOString()
      });
    }

    console.log('🎓 Academic search request:', {
      query: query.substring(0, 100),
      num_results,
      publication_year,
      subject
    });

    // Mock academic results
    const mockAcademicResults = generateMockAcademicResults(query, num_results);

    res.json({
      query: query,
      results: mockAcademicResults,
      subject: subject || 'general',
      publication_year: publication_year,
      timestamp: new Date().toISOString(),
      metadata: {
        total_results: mockAcademicResults.length,
        journals: [...new Set(mockAcademicResults.map(r => r.journal))],
        citation_count: mockAcademicResults.reduce((sum, r) => sum + (r.citations || 0), 0)
      }
    });

  } catch (error) {
    console.error('❌ Academic search error:', error.message);
    
    res.status(500).json({
      error: 'Academic search failed',
      message: 'Unable to search academic content at this time',
      timestamp: new Date().toISOString()
    });
  }
});

// UTILITY FUNCTIONS

function generateMockSearchResults(query, count) {
  const results = [];
  const domains = ['wikipedia.org', 'stackoverflow.com', 'github.com', 'medium.com', 'reddit.com', 'quora.com'];
  
  for (let i = 0; i < count; i++) {
    const domain = domains[i % domains.length];
    results.push({
      title: `${query} - Comprehensive Guide and Solutions`,
      url: `https://${domain}/${query.toLowerCase().replace(/\s+/g, '-')}-${i + 1}`,
      snippet: `Detailed information about ${query}. This resource provides comprehensive coverage of the topic including practical examples, best practices, and expert insights. Learn everything you need to know about ${query} with step-by-step guidance.`,
      domain: domain,
      ai_score: Math.random() * 0.3 + 0.7, // Score between 0.7-1.0
      relevance_reason: `Highly relevant to "${query}" with comprehensive coverage and practical examples.`,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() // Random time within last week
    });
  }
  
  return results;
}

function generateMockNewsResults(query, count) {
  const results = [];
  const newsSources = ['cnn.com', 'bbc.com', 'reuters.com', 'techcrunch.com', 'theverge.com', 'wired.com'];
  
  for (let i = 0; i < count; i++) {
    const domain = newsSources[i % newsSources.length];
    results.push({
      title: `Breaking: Latest Developments in ${query}`,
      url: `https://${domain}/news/${query.toLowerCase().replace(/\s+/g, '-')}-${i + 1}`,
      snippet: `Recent news and updates about ${query}. Stay informed with the latest developments, expert analysis, and breaking news coverage. This story covers the most recent events and their implications.`,
      domain: domain,
      published_date: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(), // Random time within last 3 days
      author: `News Reporter ${i + 1}`,
      category: 'technology',
      ai_score: Math.random() * 0.2 + 0.8
    });
  }
  
  return results;
}

function generateMockAcademicResults(query, count) {
  const results = [];
  const journals = ['Nature', 'Science', 'IEEE Transactions', 'ACM Computing', 'Journal of AI Research', 'PLOS ONE'];
  
  for (let i = 0; i < count; i++) {
    const journal = journals[i % journals.length];
    results.push({
      title: `Research on ${query}: A Comprehensive Study`,
      url: `https://academic.example.com/papers/${query.toLowerCase().replace(/\s+/g, '-')}-${i + 1}`,
      snippet: `Academic research paper examining ${query}. This peer-reviewed study presents novel findings, methodologies, and conclusions based on rigorous scientific investigation. The research contributes to the understanding of ${query} in the academic community.`,
      journal: journal,
      authors: [`Dr. Researcher ${i + 1}`, `Prof. Academic ${i + 2}`],
      publication_year: 2024 - Math.floor(Math.random() * 5), // Random year between 2019-2024
      citations: Math.floor(Math.random() * 500) + 10,
      doi: `10.1000/journal.${i + 1}`,
      abstract: `This study investigates ${query} through comprehensive analysis and experimental validation. Our findings contribute to the existing body of knowledge and provide new insights for future research.`,
      ai_score: Math.random() * 0.2 + 0.8
    });
  }
  
  return results;
}

async function generateSearchInsights(query, results) {
  try {
    // Generate AI insights using our text generation
    const insightPrompt = `Analyze these search results for "${query}" and provide a brief, helpful summary of the key insights and themes:

${results.slice(0, 3).map(r => `- ${r.title}: ${r.snippet.substring(0, 100)}...`).join('\n')}

Provide a concise 2-3 sentence summary of the main themes and insights.`;

    const response = await axios.post('http://localhost:3001/api/pollinations/generate-text', {
      prompt: insightPrompt
    });

    return response.data.text || `Based on the search results for "${query}", there are several key themes and insights that emerge from the available information.`;
  } catch (error) {
    return `Search results for "${query}" show comprehensive coverage across multiple sources and perspectives.`;
  }
}

function generateRelatedSearches(query) {
  const related = [
    `${query} tutorial`,
    `${query} examples`,
    `${query} best practices`,
    `${query} vs alternatives`,
    `how to use ${query}`,
    `${query} guide`,
    `${query} tips`,
    `latest ${query} news`
  ];
  
  return related.slice(0, 5);
}

module.exports = router;
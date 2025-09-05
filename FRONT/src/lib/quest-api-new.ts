import axios from 'axios'

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // Use relative path for Vercel deployment
  : 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for session cookies
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - return response.data for easier access
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

class QuestAPI {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  // Cache management
  private getCachedData(key: string) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCachedData(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // ===========================================
  // MAIN CHAT COMPLETION API (Backend Compatible)
  // ===========================================
  
  async chatCompletion(
    model: string, 
    messages: any[], 
    options: any = {}
  ): Promise<any> {
    try {
      const response: any = await api.post('/chat/completion', {
        model: model,
        messages: messages,
        useWebSearch: options.useWebSearch || false,
        imageFile: options.imageFile || null,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 4000
      });

      return {
        output: response.output || '',
        tokens: response.tokens || 0,
        model: response.model || model,
        quotaStatus: response.quotaStatus || {},
        sources: response.sources || [],
        imageUrl: response.imageUrl || null
      };
    } catch (error) {
      console.error('Chat Completion Error:', error);
      throw error;
    }
  }

  // ===========================================
  // SEARCH APIs
  // ===========================================

  async searchWeb(query: string, options: any = {}): Promise<any> {
    const cacheKey = `search:web:${query}:${JSON.stringify(options)}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response: any = await api.post('/search', {
        query,
        max_results: options.max_results || 10,
        search_depth: options.search_depth || 'advanced',
        include_answer: options.include_answer !== false,
        include_images: options.include_images || false
      });

      this.setCachedData(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Web Search Error:', error);
      throw error;
    }
  }

  async getAIOverview(query: string, options: any = {}): Promise<any> {
    try {
      const response: any = await api.post('/search/ai/overview', {
        query,
        ...options
      });
      return response;
    } catch (error) {
      console.error('AI Overview Error:', error);
      throw error;
    }
  }

  async getSearchSuggestions(query: string): Promise<string[]> {
    try {
      const response: any = await api.get(`/search/suggestions?q=${encodeURIComponent(query)}`);
      return response.suggestions || [];
    } catch (error) {
      console.error('Search Suggestions Error:', error);
      return [];
    }
  }

  // ===========================================
  // IMAGE GENERATION APIs
  // ===========================================

  async generateImage(prompt: string, options: any = {}): Promise<any> {
    try {
      const response: any = await api.post('/image/generate', {
        prompt,
        width: options.width || 1024,
        height: options.height || 1024,
        model: options.model || 'flux',
        enhance: options.enhance !== false,
        seed: options.seed || null
      });

      return {
        imageId: response.image?.url || null,
        imageUrl: response.image?.dataUrl || response.image?.url,
        prompt: response.image?.prompt || prompt,
        originalPrompt: response.image?.originalPrompt || prompt,
        model: response.image?.model || options.model,
        dimensions: response.image?.dimensions || { width: options.width || 1024, height: options.height || 1024 },
        enhanced: response.image?.enhanced || false,
        tokens: response.metadata?.generation_time || 0,
        quotaStatus: { remaining: 100 } // Mock quota for now
      };
    } catch (error) {
      console.error('Image Generation Error:', error);
      throw error;
    }
  }

  async generateImageStream(prompt: string, options: any = {}): Promise<any> {
    try {
      const response: any = await api.post('/image/generate/stream', {
        prompt,
        ...options
      });
      return response;
    } catch (error) {
      console.error('Image Stream Error:', error);
      throw error;
    }
  }

  async getImageModels(): Promise<any[]> {
    try {
      const response: any = await api.get('/image/models');
      return response.models || [];
    } catch (error) {
      console.error('Get Image Models Error:', error);
      return [];
    }
  }

  async enhanceImagePrompt(prompt: string): Promise<string> {
    try {
      const response: any = await api.post('/image/enhance-prompt', { prompt });
      return response.enhancedPrompt || prompt;
    } catch (error) {
      console.error('Enhance Prompt Error:', error);
      return prompt;
    }
  }

  // ===========================================
  // VOICE PROCESSING APIs
  // ===========================================

  async textToSpeech(text: string, options: any = {}): Promise<any> {
    try {
      const response: any = await api.post('/voice/tts', {
        text,
        voice: options.voice || 'alloy',
        speed: options.speed || 1.0
      });
      return response;
    } catch (error) {
      console.error('Text to Speech Error:', error);
      throw error;
    }
  }

  async speechToText(audioBlob: Blob): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.wav');
      
      const response: any = await api.post('/voice/stt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.text || '';
    } catch (error) {
      console.error('Speech to Text Error:', error);
      throw error;
    }
  }

  async processVoice(audioBlob: Blob, options: any = {}): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.wav');
      formData.append('model', options.model || 'azure');
      formData.append('voice', options.voice || 'alloy');
      
      const response: any = await api.post('/voice/process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response;
    } catch (error) {
      console.error('Voice Process Error:', error);
      throw error;
    }
  }

  async getVoices(): Promise<any[]> {
    try {
      const response: any = await api.get('/voice/voices');
      return response.voices || [];
    } catch (error) {
      console.error('Get Voices Error:', error);
      return [];
    }
  }

  // ===========================================
  // POLLINATIONS APIs
  // ===========================================

  async pollinationsChat(messages: any[], options: any = {}): Promise<any> {
    try {
      const response: any = await api.post('/pollinations/chat', {
        messages,
        model: options.model || 'llama-fast-roblox',
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 4000
      });
      return response;
    } catch (error) {
      console.error('Pollinations Chat Error:', error);
      throw error;
    }
  }

  async pollinationsChatStream(messages: any[], options: any = {}): Promise<any> {
    try {
      const response: any = await api.post('/pollinations/chat/stream', {
        messages,
        model: options.model || 'llama-fast-roblox',
        ...options
      });
      return response;
    } catch (error) {
      console.error('Pollinations Stream Error:', error);
      throw error;
    }
  }

  async getPollinationsModels(): Promise<any[]> {
    try {
      const response: any = await api.get('/pollinations/models');
      return response.models || [];
    } catch (error) {
      console.error('Get Pollinations Models Error:', error);
      return [];
    }
  }

  // ===========================================
  // USER MANAGEMENT APIs
  // ===========================================

  async getUserQuota(): Promise<any> {
    try {
      const response: any = await api.get('/user/quota');
      return response;
    } catch (error) {
      console.error('Get User Quota Error:', error);
      return {
        overall: { tokensUsed: 0, limit: 4000, remaining: 4000, exhausted: false },
        models: {}
      };
    }
  }

  async resetUserQuota(): Promise<any> {
    try {
      const response: any = await api.post('/user/quota/reset');
      return response;
    } catch (error) {
      console.error('Reset User Quota Error:', error);
      throw error;
    }
  }

  async getUserSettings(): Promise<any> {
    try {
      const response: any = await api.get('/user/settings');
      return response.settings || {};
    } catch (error) {
      console.error('Get User Settings Error:', error);
      return {};
    }
  }

  async updateUserSettings(settings: any): Promise<any> {
    try {
      const response: any = await api.post('/user/settings', { settings });
      return response;
    } catch (error) {
      console.error('Update User Settings Error:', error);
      throw error;
    }
  }

  async getUserProfile(): Promise<any> {
    try {
      const response: any = await api.get('/user/profile');
      return response;
    } catch (error) {
      console.error('Get User Profile Error:', error);
      return {};
    }
  }

  async getUserUsage(): Promise<any> {
    try {
      const response: any = await api.get('/user/usage');
      return response;
    } catch (error) {
      console.error('Get User Usage Error:', error);
      return {};
    }
  }

  // ===========================================
  // SYSTEM STATUS APIs
  // ===========================================

  async getSystemStatus(): Promise<any> {
    try {
      const response: any = await api.get('/status');
      return response;
    } catch (error) {
      console.error('Get System Status Error:', error);
      return { status: 'unknown' };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response: any = await api.get('/health');
      return response.status === 'healthy';
    } catch (error) {
      console.error('Health Check Error:', error);
      return false;
    }
  }

  // ===========================================
  // LEGACY COMPATIBILITY (for existing frontend)
  // ===========================================

  async chatWithAI(message: string, options: any = {}): Promise<any> {
    const messages = [
      { role: 'user', content: message }
    ];

    return this.chatCompletion(
      options.model || 'azure',
      messages,
      options
    );
  }

  async generateImageFromPrompt(prompt: string, options: any = {}): Promise<any> {
    return this.generateImage(prompt, options);
  }

  async search(params: any): Promise<any> {
    if (params.mode === 'image' || params.type === 'image') {
      return this.generateImage(params.query || params.prompt, params);
    } else if (params.mode === 'web' || params.type === 'web') {
      return this.searchWeb(params.query, params);
    } else {
      // Default to AI chat
      return this.chatWithAI(params.query || params.message, params);
    }
  }
}

const questAPI = new QuestAPI();

// Export the main API instance
export default questAPI;

// Named exports for specific functions
export { questAPI };

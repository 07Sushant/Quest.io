import axios from 'axios'

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // Use relative path for Vercel deployment
  : 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // Increased timeout for AI operations
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
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

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error.response?.data || error)
  }
)

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
}

export interface ChatResponse {
  output: string
  htmlOutput: string
  tokens: number
  model: string
  quotaStatus: {
    tokensUsed: number
    remaining: number
    limit: number
  }
  sources: any[]
  timestamp: string
}

export interface ImageGenerationRequest {
  prompt: string
  model?: string
  width?: number
  height?: number
  enhance?: boolean
  seed?: number
  nologo?: boolean
}

export interface ImageGenerationResponse {
  imageUrl: string
  prompt: string
  enhancedPrompt?: string
  model: string
  dimensions: {
    width: number
    height: number
  }
  timestamp: string
  metadata?: any
}

export interface ImageAnalysisRequest {
  imageUrl?: string
  imageFile?: File
  question?: string
  model?: string
}

export interface ImageAnalysisResponse {
  analysis: string
  model: string
  confidence?: number
  detectedObjects?: Array<{
    name: string
    confidence: number
    location?: { x: number; y: number; width: number; height: number }
  }>
  timestamp: string
}

export interface VoiceRequest {
  audioFile?: File
  audioUrl?: string
  model?: string
  language?: string
}

export interface VoiceResponse {
  text: string
  model: string
  language: string
  confidence?: number
  duration?: number
  timestamp: string
}

export interface TTSRequest {
  text: string
  voice?: string
  speed?: number
  language?: string
}

export interface TTSResponse {
  audioUrl: string
  voice: string
  duration?: number
  timestamp: string
}

export interface WeatherRequest {
  location: string
  units?: 'metric' | 'imperial'
  includeImage?: boolean
  includeForecast?: boolean
}

export interface WeatherResponse {
  location: {
    name: string
    coordinates: { lat: number; lon: number }
    timezone: string
    localTime: string
  }
  current: {
    temperature: number
    feelsLike: number
    humidity: number
    pressure: number
    visibility: number
    uvIndex: number
    wind: {
      speed: number
      direction: number
      directionText: string
    }
    condition: string
    description: string
  }
  analysis: string
  recommendations: Array<{
    type: string
    icon: string
    text: string
  }>
  image?: string
  forecast?: any[]
  timestamp: string
}

export interface WebSearchRequest {
  query: string
  num_results?: number
  safe_search?: 'off' | 'moderate' | 'strict'
  region?: string
  language?: string
}

export interface WebSearchResponse {
  query: string
  results: Array<{
    title: string
    url: string
    snippet: string
    domain: string
    ai_score?: number
    relevance_reason?: string
  }>
  insights: string
  related_searches: string[]
  timestamp: string
}

class QuestAPIEnhanced {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  // Cache management
  private getCachedData(key: string) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // Health check
  async healthCheck() {
    try {
      return await api.get('/health')
    } catch (error) {
      throw new Error('Backend service unavailable')
    }
  }

  // Enhanced Chat API
  async sendMessage(messages: ChatMessage[], model = 'pollinations-openai'): Promise<ChatResponse> {
    try {
      return await api.post('/chat/completion', {
        messages,
        model,
        temperature: 0.7,
        maxTokens: 1000
      })
    } catch (error) {
      throw new Error('Failed to send message')
    }
  }

  async streamMessage(messages: ChatMessage[], model = 'pollinations-openai', onChunk?: (chunk: string) => void) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/completion/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          model,
          temperature: 0.7,
          maxTokens: 1000
        }),
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to start streaming')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No reader available')
      }

      let fullMessage = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') return fullMessage
            
            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content || ''
              if (content) {
                fullMessage += content
                onChunk?.(content)
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }

      return fullMessage
    } catch (error) {
      throw new Error('Streaming failed')
    }
  }

  // Enhanced Image API
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      return await api.post('/image-enhanced/generate', request)
    } catch (error) {
      throw new Error('Failed to generate image')
    }
  }

  async analyzeImage(request: ImageAnalysisRequest): Promise<ImageAnalysisResponse> {
    try {
      const formData = new FormData()
      
      if (request.imageFile) {
        formData.append('image', request.imageFile)
      } else if (request.imageUrl) {
        formData.append('imageUrl', request.imageUrl)
      }
      
      if (request.question) {
        formData.append('question', request.question)
      }
      
      if (request.model) {
        formData.append('model', request.model)
      }

      return await api.post('/image-enhanced/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    } catch (error) {
      throw new Error('Failed to analyze image')
    }
  }

  async searchImages(query: string, count = 10): Promise<any> {
    try {
      return await api.post('/image-enhanced/search', { query, count })
    } catch (error) {
      throw new Error('Failed to search images')
    }
  }

  async enhancePrompt(prompt: string): Promise<{ enhancedPrompt: string }> {
    try {
      return await api.post('/image-enhanced/enhance-prompt', { prompt })
    } catch (error) {
      throw new Error('Failed to enhance prompt')
    }
  }

  // Enhanced Voice API
  async transcribeAudio(audioFile: File, model = 'whisper-large-v3'): Promise<VoiceResponse> {
    try {
      const formData = new FormData()
      formData.append('audio', audioFile)
      formData.append('model', model)

      return await api.post('/voice-enhanced/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    } catch (error) {
      throw new Error('Failed to transcribe audio')
    }
  }

  async synthesizeSpeech(request: TTSRequest): Promise<TTSResponse> {
    try {
      return await api.post('/voice-enhanced/synthesize', request)
    } catch (error) {
      throw new Error('Failed to synthesize speech')
    }
  }

  async startVoiceChat(audioFile: File, conversationHistory: ChatMessage[] = []): Promise<{
    transcription: string
    response: string
    audioUrl: string
    timestamp: string
  }> {
    try {
      const formData = new FormData()
      formData.append('audio', audioFile)
      formData.append('conversationHistory', JSON.stringify(conversationHistory))

      return await api.post('/voice-enhanced/chat', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    } catch (error) {
      throw new Error('Failed to process voice chat')
    }
  }

  async getVoiceSettings(): Promise<{
    voices: Array<{ id: string; name: string; language: string }>
    models: Array<{ id: string; name: string }>
  }> {
    try {
      return await api.get('/voice-enhanced/settings')
    } catch (error) {
      throw new Error('Failed to get voice settings')
    }
  }

  // Enhanced Weather API
  async getWeather(location: string, options: Partial<WeatherRequest> = {}): Promise<WeatherResponse> {
    try {
      const cacheKey = `weather:${location}:${JSON.stringify(options)}`
      const cached = this.getCachedData(cacheKey)
      if (cached) return cached

      const params = new URLSearchParams()
      if (options.units) params.append('units', options.units)
      if (options.includeImage !== undefined) params.append('includeImage', options.includeImage.toString())
      if (options.includeForecast !== undefined) params.append('includeForecast', options.includeForecast.toString())

      const result = await api.get(`/weather-enhanced/${encodeURIComponent(location)}?${params.toString()}`) as WeatherResponse
      this.setCachedData(cacheKey, result)
      return result
    } catch (error) {
      console.error('Weather data fetch error:', error);
      throw new Error('Failed to get weather data')
    }
  }

  async searchWeather(query: string, options: Partial<WeatherRequest> = {}): Promise<WeatherResponse & { query: string }> {
    try {
      if (!query.trim()) {
        throw new Error('Search query cannot be empty');
      }
      return await api.post('/weather-enhanced/search', {
        query,
        ...options
      }) as WeatherResponse & { query: string }
    } catch (error) {
      console.error('Weather search error:', error);
      throw new Error('Failed to search weather')
    }
  }

  async getWeatherForecast(location: string, days = 5, includeHourly = false): Promise<any> {
    try {
      if (!location.trim()) {
        throw new Error('Location cannot be empty');
      }
      if (days < 1 || days > 14) {
        throw new Error('Days must be between 1 and 14');
      }

      const params = new URLSearchParams()
      params.append('days', days.toString())
      if (includeHourly) params.append('includeHourly', 'true')

      return await api.get(`/weather-enhanced/${encodeURIComponent(location)}/forecast?${params.toString()}`) as any
    } catch (error) {
      console.error('Weather forecast error:', error);
      throw new Error('Failed to get weather forecast')
    }
  }

  async getWeatherAlerts(location: string): Promise<any> {
    try {
      if (!location.trim()) {
        throw new Error('Location cannot be empty');
      }
      return await api.get(`/weather-enhanced/${encodeURIComponent(location)}/alerts`) as any
    } catch (error) {
      console.error('Weather alerts error:', error);
      throw new Error('Failed to get weather alerts')
    }
  }

  // Enhanced Web Search API
  async searchWeb(request: WebSearchRequest): Promise<WebSearchResponse> {
    try {
      if (!request.query.trim()) {
        throw new Error('Search query cannot be empty');
      }

      const cacheKey = `web_search:${JSON.stringify(request)}`
      const cached = this.getCachedData(cacheKey)
      if (cached) return cached

      const result = await api.post('/web-search/search', request) as WebSearchResponse
      this.setCachedData(cacheKey, result)
      return result
    } catch (error) {
      console.error('Web search error:', error);
      throw new Error('Failed to perform web search')
    }
  }
  async searchNews(query: string, options: {
    num_results?: number
    time_range?: string
    category?: string
    region?: string
  } = {}): Promise<any> {
    try {
      return await api.post('/web-search/news', {
        query,
        ...options
      }) as any
    } catch (error) {
      console.error('News search error:', error);
      throw new Error('Failed to search news')
    }
  }

  async searchAcademic(query: string, options: {
    num_results?: number
    publication_year?: string
    subject?: string
  } = {}): Promise<any> {
    try {
      return await api.post('/web-search/academic', {
        query,
        ...options
      }) as any
    } catch (error) {
      console.error('Academic search error:', error);
      throw new Error('Failed to search academic content')
    }
  }

  // Unified Search API - handles all types of search
  async unifiedSearch(query: string, searchType: 'web' | 'news' | 'academic' | 'weather' | 'image' = 'web', options: any = {}): Promise<any> {
    try {
      switch (searchType) {
        case 'web':
          return await this.searchWeb({ query, ...options })
        case 'news':
          return await this.searchNews(query, options)
        case 'academic':
          return await this.searchAcademic(query, options)
        case 'weather':
          return await this.searchWeather(query, options)
        case 'image':
          return await this.searchImages(query, options.count || 10)
        default:
          return await this.searchWeb({ query, ...options })
      }
    } catch (error) {
      throw new Error(`Failed to perform ${searchType} search`)
    }
  }

  // Intelligent query classification
  async classifyQuery(query: string): Promise<{
    type: 'chat' | 'web_search' | 'image_generation' | 'image_analysis' | 'weather' | 'voice' | 'news'
    confidence: number
    suggestions: string[]
  }> {
    try {
      // Simple classification logic - can be enhanced with ML
      const lowerQuery = query.toLowerCase()
      
      if (lowerQuery.includes('weather') || lowerQuery.includes('temperature') || lowerQuery.includes('rain') || lowerQuery.includes('snow')) {
        return {
          type: 'weather',
          confidence: 0.8,
          suggestions: ['Get current weather', 'Check forecast', 'Weather alerts']
        } as const
      }
      
      if (lowerQuery.includes('generate') || lowerQuery.includes('create') || lowerQuery.includes('draw') || lowerQuery.includes('image of')) {
        return {
          type: 'image_generation',
          confidence: 0.7,
          suggestions: ['Generate image', 'Create artwork', 'Design concept']
        } as const
      }
      
      if (lowerQuery.includes('news') || lowerQuery.includes('breaking') || lowerQuery.includes('latest')) {
        return {
          type: 'news',
          confidence: 0.7,
          suggestions: ['Search news', 'Latest updates', 'Breaking news']
        } as const
      }
      
      if (lowerQuery.includes('search') || lowerQuery.includes('find') || lowerQuery.includes('look up')) {
        return {
          type: 'web_search',
          confidence: 0.6,
          suggestions: ['Web search', 'Find information', 'Research topic']
        } as const
      }
      
      return {
        type: 'chat',
        confidence: 0.5,
        suggestions: ['Chat with AI', 'Ask a question', 'Get assistance']
      } as const
    } catch (error) {
      return {
        type: 'chat',
        confidence: 0.3,
        suggestions: ['Try rephrasing your query']
      } as const
    }
  }

  // Smart search that automatically determines the best approach
  async smartSearch(query: string): Promise<{
    type: string
    result: any
    suggestions: string[]
    timestamp: string
  }> {
    try {
      const classification = await this.classifyQuery(query)
      let result: any
      
      switch (classification.type) {
        case 'weather':
          result = await this.searchWeather(query)
          break
        case 'image_generation':
          result = await this.generateImage({ prompt: query })
          break
        case 'news':
          result = await this.searchNews(query)
          break
        case 'web_search':
          result = await this.searchWeb({ query })
          break
        default:
          result = await this.sendMessage([{ role: 'user', content: query }])
      }
      
      return {
        type: classification.type,
        result,
        suggestions: classification.suggestions,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      throw new Error('Smart search failed')
    }
  }

  // Batch operations
  async batchGenerate(prompts: string[]): Promise<ImageGenerationResponse[]> {
    try {
      const promises = prompts.map(prompt => this.generateImage({ prompt }))
      return await Promise.all(promises) as ImageGenerationResponse[]
    } catch (error) {
      throw new Error('Batch generation failed')
    }
  }

  // Settings and configuration
  async getApiStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'down'
    services: Record<string, boolean>
    latency: Record<string, number>
  }> {
    try {
      return await api.get('/health/detailed') as {
        status: 'healthy' | 'degraded' | 'down'
        services: Record<string, boolean>
        latency: Record<string, number>
      }
    } catch (error) {
      return {
        status: 'down',
        services: {},
        latency: {}
      }
    }
  }
}

// Create and export the enhanced API instance
const questAPI = new QuestAPIEnhanced()
export default questAPI

import axios from 'axios'
import { SearchParams, SearchResponse, SearchResult } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
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
    return Promise.reject(error)
  }
)

export const searchAPI = {
  // Perform search with GET method (query parameters)
  search: async (params: SearchParams): Promise<SearchResponse> => {
    try {
      const searchParams = new URLSearchParams({
        q: params.query,
        mode: params.mode || 'web',
        page: (params.page || 1).toString(),
        limit: (params.limit || 10).toString(),
        ...(params.category && { category: params.category }),
        ...(params.dateRange && { dateRange: params.dateRange }),
        ...(params.sortBy && { sortBy: params.sortBy }),
      })
      
      const response: SearchResponse = await api.get(`/search?${searchParams.toString()}`)
      return response
    } catch (error) {
      // Fallback to mock data in development
      if (process.env.NODE_ENV === 'development') {
        return generateMockSearchResponse(params)
      }
      throw error
    }
  },

  // Get search suggestions
  getSuggestions: async (query: string): Promise<string[]> => {
    try {
      const response: any = await api.get(`/suggestions/autocomplete?q=${encodeURIComponent(query)}&limit=8`)
      return response.suggestions?.map((s: any) => s.text) || []
    } catch (error) {
      // Fallback suggestions
      return generateMockSuggestions(query)
    }
  },

  // Get trending searches
  getTrending: async (): Promise<string[]> => {
    try {
      const response: any = await api.get('/trending?limit=10')
      return response.trending?.map((t: any) => t.query) || []
    } catch (error) {
      return [
        'AI breakthrough 2024',
        'Quantum computing news',
        'Space exploration updates',
        'Climate tech innovations',
        'Cryptocurrency trends'
      ]
    }
  },

  // Analytics
  trackSearch: async (query: string, resultId?: string): Promise<void> => {
    try {
      await api.post('/analytics/search', { query, resultId })
    } catch (error) {
      console.warn('Failed to track search analytics:', error)
    }
  },
}

// Mock data generators for development
function generateMockSearchResponse(params: SearchParams): SearchResponse {
  const { query, mode, page = 1, limit = 10 } = params

  const mockResults: SearchResult[] = [
    {
      id: '1',
      title: `${mode === 'ai' ? '🤖 AI Enhanced: ' : ''}Advanced Solutions for "${query}"`,
      url: 'https://example.com/solutions',
      description: `Comprehensive guide and solutions related to ${query}. This detailed resource covers all aspects including implementation, best practices, and advanced techniques.`,
      timestamp: '2 hours ago',
      type: mode,
      category: 'Technology',
      relevanceScore: 0.95,
      domain: 'example.com',
      author: 'Tech Expert',
      publishedDate: '2024-01-15',
    },
    {
      id: '2',
      title: `${mode === 'ai' ? '🧠 AI Analysis: ' : ''}Latest Research on ${query}`,
      url: 'https://research.com/latest',
      description: `Cutting-edge research and developments in ${query}. Explore the latest findings from leading institutions and researchers worldwide.`,
      timestamp: '5 hours ago',
      type: mode,
      category: 'Research',
      relevanceScore: 0.89,
      domain: 'research.com',
      author: 'Research Team',
      publishedDate: '2024-01-14',
    },
    {
      id: '3',
      title: `${mode === 'ai' ? '⚡ AI Insights: ' : ''}Best Practices for ${query}`,
      url: 'https://bestpractices.com/guide',
      description: `Industry-proven best practices and methodologies for implementing ${query}. Learn from experts and avoid common pitfalls.`,
      timestamp: '1 day ago',
      type: mode,
      category: 'Guide',
      relevanceScore: 0.87,
      domain: 'bestpractices.com',
      author: 'Industry Expert',
      publishedDate: '2024-01-13',
    },
  ]

  return {
    query,
    mode: 'web',
    results: mockResults.slice((page - 1) * limit, page * limit),
    totalResults: mockResults.length,
    searchTime: 0.42,
    currentPage: page,
    hasNextPage: page * limit < mockResults.length,
    suggestions: generateMockSuggestions(query),
    timestamp: new Date().toISOString(),
  }
}

function generateMockSuggestions(query: string): string[] {
  const suggestions = [
    `${query} tutorial`,
    `${query} best practices`,
    `${query} examples`,
    `${query} implementation`,
    `${query} advanced techniques`,
  ]
  
  return suggestions.slice(0, 5)
}

// Utility function to construct proper image URLs
export const getImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return ''
  
  // If it's already a full URL, return as is
  if (imageUrl.startsWith('http')) {
    return imageUrl
  }
  
  // If it's a relative API path (our proxy), construct the full URL
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
  if (imageUrl.startsWith('/api/')) {
    // This is our image proxy URL that hides Pollinations
    return `${baseUrl.replace('/api', '')}${imageUrl}`
  }
  
  // Otherwise, assume it's a relative path from the API base
  return `${baseUrl}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`
}

export default api

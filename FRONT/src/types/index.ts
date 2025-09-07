export interface SearchResult {
  id: string
  title: string
  url: string
  description: string
  timestamp: string
  type: 'web' | 'ai' | 'academic' | 'news' | 'voice' | 'image' | 'speech'
  category?: string
  relevanceScore?: number
  snippet?: string
  imageUrl?: string
  audioUrl?: string
  audioData?: string
  author?: string
  domain?: string
  publishedDate?: string
}

export interface SearchParams {
  query: string
  mode: 'web' | 'ai' | 'academic' | 'news' | 'voice' | 'image' | 'speech'
  page?: number
  limit?: number
  category?: string
  dateRange?: string
  sortBy?: 'relevance' | 'date' | 'popularity'
}

export interface SearchResponse {
  results: SearchResult[]
  totalResults: number
  searchTime: number
  currentPage: number
  hasNextPage: boolean
  query: string
  mode: string
  filters?: any
  timestamp: string
  aiInsights?: {
    summary: string
    confidence: number
    relatedConcepts: string[]
    suggestedQueries: string[]
  }
  suggestions?: string[]
}

export interface AIInsight {
  id: string
  type: 'summary' | 'analysis' | 'related' | 'clarification'
  title: string
  content: string
  confidence: number
  sources?: string[]
}

export interface Theme {
  name: string
  displayName: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    muted: string
  }
}

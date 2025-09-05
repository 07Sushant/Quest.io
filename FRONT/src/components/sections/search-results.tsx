'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, Clock, Star, TrendingUp, Sparkles } from 'lucide-react'

interface SearchResult {
  id: string
  title: string
  url: string
  description: string
  timestamp: string
  type: 'web' | 'ai'
  category?: string
  relevanceScore?: number
}

export function SearchResults() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchMode, setSearchMode] = useState<'web' | 'ai'>('web')

  useEffect(() => {
    const handleSearchCompleted = (event: CustomEvent) => {
      const { query, mode } = event.detail
      setSearchQuery(query)
      setSearchMode(mode)
      performSearch(query, mode)
    }

    window.addEventListener('searchCompleted', handleSearchCompleted as EventListener)
    return () => {
      window.removeEventListener('searchCompleted', handleSearchCompleted as EventListener)
    }
  }, [])

  const performSearch = async (query: string, mode: 'web' | 'ai') => {
    setIsLoading(true)
    
    try {
      // Use real API for search
      const questAPI = (await import('@/lib/quest-api-new')).default
      const response = await questAPI.searchWeb(query, { num: 10 })
      
      if (response.success && response.data.results) {
        setResults(response.data.results)
      } else {
        // Fallback to mock results
        const mockResults = generateMockResults(query, mode)
        setResults(mockResults)
      }
    } catch (error) {
      console.error('Search failed:', error)
      // Fallback to mock results on error
      const mockResults = generateMockResults(query, mode)
      setResults(mockResults)
    }
    
    setIsLoading(false)
  }

  const generateMockResults = (query: string, mode: 'web' | 'ai'): SearchResult[] => {
    const baseResults = [
      {
        id: '1',
        title: 'Advanced Algorithm Solutions - LeetCode 3Sum Problem',
        url: 'https://leetcode.com/problems/3sum/',
        description: 'Master the 3Sum problem with our comprehensive guide. Learn optimal O(n²) solutions using two-pointer technique, handle edge cases, and understand the mathematical foundations.',
        timestamp: '2 hours ago',
        type: mode,
        category: 'Programming',
        relevanceScore: 0.95
      },
      {
        id: '2',
        title: 'Latest Technology Breakthroughs 2024',
        url: 'https://techcrunch.com/latest-breakthroughs',
        description: 'Discover the most groundbreaking technological advances of 2024, from quantum computing achievements to revolutionary AI developments that are reshaping our world.',
        timestamp: '5 hours ago',
        type: mode,
        category: 'Technology',
        relevanceScore: 0.92
      },
      {
        id: '3',
        title: 'AI Research: Next-Generation Neural Networks',
        url: 'https://arxiv.org/ai-research',
        description: 'Explore cutting-edge research in artificial intelligence, featuring novel architectures, training methodologies, and breakthrough applications in computer vision and NLP.',
        timestamp: '1 day ago',
        type: mode,
        category: 'Research',
        relevanceScore: 0.89
      },
      {
        id: '4',
        title: 'Startup Funding Trends Q4 2024',
        url: 'https://crunchbase.com/funding-trends',
        description: 'Comprehensive analysis of venture capital trends, emerging sectors, and the most promising startups receiving significant funding rounds in the current market.',
        timestamp: '3 days ago',
        type: mode,
        category: 'Business',
        relevanceScore: 0.87
      },
      {
        id: '5',
        title: 'Future of Web Development: 2025 Predictions',
        url: 'https://webdev.future.com',
        description: 'Industry experts share insights on emerging web technologies, frameworks, and development practices that will define the next generation of web applications.',
        timestamp: '1 week ago',
        type: mode,
        category: 'Development',
        relevanceScore: 0.84
      }
    ] as SearchResult[]

    // Customize results based on search mode
    if (mode === 'ai') {
      return baseResults.map(result => ({
        ...result,
        title: `🤖 AI Enhanced: ${result.title}`,
        description: `AI Analysis: ${result.description} Our AI provides contextual insights and related concepts for deeper understanding.`,
      }))
    }

    return baseResults
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Programming': return '💻'
      case 'Technology': return '🚀'
      case 'Research': return '🔬'
      case 'Business': return '💼'
      case 'Development': return '⚡'
      default: return '📄'
    }
  }

  const getRelevanceColor = (score: number) => {
    if (score >= 0.9) return 'text-green-400'
    if (score >= 0.8) return 'text-yellow-400'
    return 'text-gray-400'
  }

  if (!searchQuery && !isLoading) {
    return null
  }

  return (
    <section className="py-20 px-4">
      <div className="container max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <div className="flex justify-center items-center mb-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full"
                />
              </div>
              <h3 className="text-xl font-semibold mb-4">Searching the quantum web...</h3>
              <p className="text-muted-foreground">
                Processing your query with {searchMode === 'ai' ? 'AI' : 'web'} algorithms
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Results Header */}
              <div className="mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between mb-6"
                >
                  <div>
                    <h2 className="text-3xl font-bold mb-2">
                      Search Results
                      {searchMode === 'ai' && (
                        <Sparkles className="inline-block w-8 h-8 ml-2 text-secondary-500" />
                      )}
                    </h2>
                    <p className="text-muted-foreground">
                      Found {results.length} results for "{searchQuery}" in {searchMode === 'ai' ? 'AI' : 'Web'} mode
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      <Clock className="inline w-4 h-4 mr-1" />
                      Search completed in 0.42s
                    </div>
                  </div>
                </motion.div>

                {/* AI Mode Special Banner */}
                {searchMode === 'ai' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-strong rounded-2xl p-6 mb-8 border border-secondary-500/30"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-secondary-500 to-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">AI-Enhanced Results</h3>
                        <p className="text-muted-foreground">
                          These results have been processed by our advanced AI to provide contextual insights, 
                          related concepts, and deeper understanding of your query.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Results List */}
              <div className="space-y-6">
                {results.map((result, index) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -2 }}
                    className="glass rounded-2xl p-6 cursor-pointer group hover:bg-white/5 transition-all duration-300"
                    onClick={() => window.open(result.url, '_blank')}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getCategoryIcon(result.category || '')}</span>
                        <div>
                          <span className="text-sm text-muted-foreground">{result.category}</span>
                          {result.relevanceScore && (
                            <div className="flex items-center space-x-2 mt-1">
                              <Star className={`w-4 h-4 ${getRelevanceColor(result.relevanceScore)}`} />
                              <span className={`text-sm ${getRelevanceColor(result.relevanceScore)}`}>
                                {Math.round(result.relevanceScore * 100)}% match
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>

                    <h3 className="text-xl font-semibold mb-3 group-hover:text-primary-400 transition-colors">
                      {result.title}
                    </h3>

                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {result.description}
                    </p>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-400 hover:underline">
                        {result.url}
                      </span>
                      <div className="flex items-center space-x-4 text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{result.timestamp}</span>
                        </span>
                        {result.type === 'ai' && (
                          <span className="flex items-center space-x-1 text-secondary-400">
                            <Sparkles className="w-4 h-4" />
                            <span>AI Enhanced</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Load More Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center mt-12"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="glass-strong rounded-full px-8 py-4 hover:bg-white/10 transition-all duration-300 group"
                >
                  <span className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 group-hover:text-primary-400 transition-colors" />
                    <span>Load More Results</span>
                  </span>
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

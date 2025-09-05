'use client'

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/layout/navigation'
import { BackgroundElements } from '@/components/ui/background-elements'
import { SingleSearchBox } from '@/components/ui/single-search-box'
import { MessagesDisplay } from '@/components/ui/messages-display'
import { motion, AnimatePresence } from 'framer-motion'

export default function HomePage() {
  const [hasSearched, setHasSearched] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [lastQuery, setLastQuery] = useState('')
  const [lastResponse, setLastResponse] = useState<any>(null)

  const handleSearch = async (query: string, mode: string) => {
    setIsSearching(true)
    setHasSearched(true)
    
    try {
      // Import the enhanced API client
      const questAPI = (await import('@/lib/quest-api-enhanced')).default
      
      let response
      
      if (mode === 'web') {
        // Use web search
        response = await questAPI.searchWeb({
          query,
          num_results: 10
        })
        
        // Generate AI summary of search results
        const summaryResponse = await questAPI.sendMessage([
          { role: 'user', content: `Summarize these search results for: ${query}\n\nResults: ${response.results.map(r => `${r.title}: ${r.snippet}`).join('\n')}` }
        ])
        
        const responseData = {
          content: summaryResponse.output || response.insights || 'Here are the search results.',
          tokens: 0,
          model: 'web-search',
          quotaStatus: {},
          sources: response.results || [],
          imageUrl: null,
          mode: mode,
          originalResponse: response
        }
        
        console.log('Processed Response Data:', responseData)
        setLastQuery(query)
        setLastResponse(responseData)
      } else if (mode === 'image') {
        // Use image generation
        response = await questAPI.generateImage({
          prompt: query,
          width: 1024,
          height: 768,
          enhance: true
        })
        
        const responseData = {
          content: 'Image generated successfully!',
          tokens: 0,
          model: 'image-generation',
          quotaStatus: {},
          sources: [],
          imageUrl: response.imageUrl,
          mode: mode,
          originalResponse: response
        }
        
        console.log('Processed Response Data:', responseData)
        setLastQuery(query)
        setLastResponse(responseData)
      } else {
        // Use AI chat
        response = await questAPI.sendMessage([
          { role: 'user', content: query }
        ])
        
        const responseData = {
          content: response.output || 'I received your message.',
          tokens: response.tokens || 0,
          model: response.model || 'ai-chat',
          quotaStatus: {},
          sources: [],
          imageUrl: null,
          mode: mode,
          originalResponse: response
        }
        
        console.log('Processed Response Data:', responseData)
        setLastQuery(query)
        setLastResponse(responseData)
      }
      
    } catch (error) {
      console.error('Search failed:', error)
      const errorResponse = { 
        content: 'Sorry, I encountered an error. Please try again.',
        error: true,
        mode: mode
      }
      
      setLastQuery(query)
      setLastResponse(errorResponse)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Background Elements */}
      <BackgroundElements />
      
      {/* Navigation */}
      <Navigation />
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <AnimatePresence mode="wait">
          {!hasSearched ? (
            /* Hero Search - Center of Screen */
            <motion.div
              key="hero-search"
              initial={{ opacity: 1 }}
              exit={{ 
                opacity: 0,
                y: -100,
                transition: { duration: 0.8, ease: "easeInOut" }
              }}
              className="flex-1 flex items-center justify-center px-4 py-20"
            >
              <motion.div
                layoutId="single-search"
                className="w-full max-w-4xl"
              >
                <SingleSearchBox
                  onSearch={handleSearch}
                  isSearching={isSearching}
                  isCompact={false}
                />
              </motion.div>
            </motion.div>
          ) : (
            /* Chat Mode - Messages + Search at Bottom */
            <motion.div
              key="chat-mode"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex-1 flex flex-col pt-16 pb-32"
            >
              {/* Messages Display */}
              <MessagesDisplay 
                newQuery={lastQuery}
                newResponse={lastResponse}
                isSearching={isSearching}
                className="flex-1"
              />

              {/* Fixed Single Search Box at Bottom */}
              <motion.div
                layoutId="single-search"
                className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-2xl border-t border-white/10 px-4 py-6 z-50"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ 
                  delay: 0.5,
                  duration: 0.8,
                  type: "spring",
                  stiffness: 100
                }}
              >
                <div className="max-w-4xl mx-auto">
                  <SingleSearchBox
                    onSearch={handleSearch}
                    isSearching={isSearching}
                    isCompact={true}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { Navigation } from '@/components/layout/navigation'
import { BackgroundElements } from '@/components/ui/background-elements'
import { SingleSearchBox } from '@/components/ui/single-search-box'
import { MessagesDisplay } from '@/components/ui/messages-display'
import { motion, AnimatePresence } from 'framer-motion'

export default function HomePage() {
  const [hasSearched, setHasSearched] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [lastQuery, setLastQuery] = useState('')
  const [lastResponse, setLastResponse] = useState<any>(null)

  const handleSearch = async (query: string, mode: string, opts?: { files?: File[]; imageUrls?: string[]; previewUrls?: string[] }) => {
    // Prevent new searches while audio is playing
    if (isAudioPlaying) {
      return
    }
    
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
      } else if (mode === 'vision') {
        // Vision: send up to 4 images + question
        // 1) Show a user-side preview message immediately (WhatsApp-like)
        if (opts?.previewUrls?.length) {
          setLastQuery('(attached images)\n' + query)
          setLastResponse({
            content: '(images attached)',
            tokens: 0,
            model: 'vision-preview',
            quotaStatus: {},
            sources: [],
            imageUrl: null,
            images: opts.previewUrls,
            mode: mode,
            originalResponse: null
          })
        }

        try {
          const resp = await questAPI.analyzeVision({ files: opts?.files, imageUrls: opts?.imageUrls, question: query })
          const responseData = {
            content: resp.text || 'Done.',
            tokens: 0,
            model: 'vision',
            quotaStatus: {},
            sources: [],
            imageUrl: null,
            mode: mode,
            type: 'vision-result',
            originalResponse: resp
          }
          setLastQuery(query)
          setLastResponse(responseData)
        } catch (error) {
          console.error('Vision analyze error:', error)
          setLastQuery(query)
          setLastResponse({ content: 'Vision analysis failed.', mode, type: 'vision-result' })
        }
      } else if (mode === 'image') {
        // Use enhanced image generation with NLP parsing
        // Set initial loading state
        const loadingResponse = {
          content: 'Generating your image...',
          tokens: 0,
          model: 'flux-nlp-enhanced',
          quotaStatus: {},
          sources: [],
          imageUrl: null,
          isGeneratingImage: true,
          mode: mode,
          originalResponse: null
        }
        
        setLastQuery(query)
        setLastResponse(loadingResponse)
        
        try {
          response = await questAPI.generateImage({
            prompt: query
          })
          
          const responseData = {
            content: 'Image generated successfully!',
            tokens: 0,
            model: 'flux-nlp-enhanced',
            quotaStatus: {},
            sources: [],
            imageUrl: response.imageUrl,
            originalInput: response.originalInput,
            dimensions: response.dimensions,
            isGeneratingImage: false,
            mode: mode,
            originalResponse: response
          }
          
          console.log('Processed Response Data:', responseData)
          setLastResponse(responseData)
        } catch (error) {
          console.error('Image generation error:', error)
          setLastResponse({
            content: 'Failed to generate image. Please try again.',
            tokens: 0,
            model: 'flux-nlp-enhanced',
            quotaStatus: {},
            sources: [],
            imageUrl: null,
            isGeneratingImage: false,
            mode: mode,
            originalResponse: null
          })
        }
      } else if (mode === 'art') {
        // Art mode: user supplies 1 image + prompt, Gemini transforms and returns an image
        if (!(opts?.files && opts.files[0])) {
          setLastQuery(query)
          setLastResponse({ content: 'Please attach an image for Art mode.', mode })
          return
        }

        // Show loading placeholder
        setLastQuery(query)
        setLastResponse({ content: 'Creating artwork...', isGeneratingImage: true, mode })

        try {
          const resp = await questAPI.artTransform({ imageFile: opts.files[0], prompt: query })
          setLastResponse({
            content: resp.description || 'Artwork created!',
            tokens: 0,
            model: resp.model,
            quotaStatus: {},
            sources: [],
            imageUrl: resp.imageUrl,
            originalInput: query,
            dimensions: undefined,
            isGeneratingImage: false,
            mode,
            originalResponse: resp
          })
        } catch (error) {
          console.error('Art transform error:', error)
          setLastResponse({ content: 'Art generation failed. Please try again.', mode })
        }
      } else if (mode === 'speech') {
        // Use speech generation
        response = await questAPI.generateSpeech({
          text: query
        })
        
        const speechResponse = response as any
        
        const responseData = {
          content: 'Audio generated successfully!',
          tokens: 0,
          model: 'speech-synthesis',
          quotaStatus: {},
          sources: [],
          imageUrl: null,
          audioData: speechResponse.audioData,
          contentType: speechResponse.contentType,
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

  const footerRef = useRef<HTMLDivElement>(null)
  const [footerHeight, setFooterHeight] = useState(0)

  useEffect(() => {
    const update = () => setFooterHeight(footerRef.current?.clientHeight || 0)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

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
                  isSearching={isSearching || isAudioPlaying}
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
              className="flex-1 flex flex-col pt-16"
            >
              {/* Messages Display with dynamic bottom spacer */}
              <div className="flex-1">
                <MessagesDisplay 
                  newQuery={lastQuery}
                  newResponse={lastResponse}
                  isSearching={isSearching}
                  onAudioPlayingChange={setIsAudioPlaying}
                  className="h-full"
                  bottomSpacerPx={footerHeight + 48}
                />
              </div>

              {/* Fixed Single Search Box at Bottom */}
              <motion.div
                ref={footerRef}
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
                    isSearching={isSearching || isAudioPlaying}
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

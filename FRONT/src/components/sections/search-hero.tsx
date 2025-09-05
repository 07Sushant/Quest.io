'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { Search, Sparkles, Zap, Globe, Brain, Mic, Camera, ArrowRight, Image as ImageIcon } from 'lucide-react'
import { VoiceInterface } from '@/components/ui/voice-interface'
import { ImageGeneration } from '@/components/ui/image-generation'
import { useSettings } from '@/lib/hooks/use-settings'
import questAPI from '@/lib/quest-api-enhanced'

export function SearchHero() {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchMode, setSearchMode] = useState<'ai' | 'web' | 'voice' | 'image'>('ai')
  const [isFocused, setIsFocused] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [showVoiceInterface, setShowVoiceInterface] = useState(false)
  const [showImageGeneration, setShowImageGeneration] = useState(false)
  const [imagePrompt, setImagePrompt] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  
  const { searchSettings, voiceSettings } = useSettings()

  // Mouse position for magnetic effects
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springConfig = { damping: 25, stiffness: 150 }
  const x = useSpring(mouseX, springConfig)
  const y = useSpring(mouseY, springConfig)

  const suggestions = [
    { icon: <Sparkles className="w-4 h-4" />, text: 'Quantum computing breakthroughs', category: 'research' },
    { icon: <Globe className="w-4 h-4" />, text: 'Climate tech innovations', category: 'news' },
    { icon: <Brain className="w-4 h-4" />, text: 'AI consciousness theories', category: 'research' },
    { icon: <Zap className="w-4 h-4" />, text: 'Neural interface progress', category: 'technology' },
    { icon: <Search className="w-4 h-4" />, text: 'Space exploration updates', category: 'news' },
    { icon: <Brain className="w-4 h-4" />, text: 'Decode complex algorithms', category: 'coding' },
  ]

  const handleSearch = async () => {
    if (!query.trim()) return
    
    // Check for image generation keywords
    if (searchSettings.imageGeneration && 
        (query.toLowerCase().includes('generate') || 
         query.toLowerCase().includes('create') || 
         query.toLowerCase().includes('draw') || 
         query.toLowerCase().includes('make') ||
         query.toLowerCase().includes('image'))) {
      setImagePrompt(query)
      setShowImageGeneration(true)
      return
    }
    
    setIsSearching(true)
    
    try {
      if (searchMode === 'web' && searchSettings.webEnabled) {
        // Web search using enhanced backend
        const response = await questAPI.searchWeb({
          query,
          num_results: 10
        })
        
        window.dispatchEvent(new CustomEvent('searchCompleted', { 
          detail: { query, mode: 'web', results: response } 
        }))
      } else if (searchMode === 'voice' && voiceSettings.enabled) {
        // Voice mode - show voice interface
        setShowVoiceInterface(true)
      } else if (searchMode === 'image') {
        // Image generation mode
        setImagePrompt(query)
        setShowImageGeneration(true)
      } else {
        // AI mode (default) - use intelligent chat completion
        const response = await questAPI.sendMessage([
          { role: 'user', content: query }
        ])
        
        window.dispatchEvent(new CustomEvent('searchCompleted', { 
          detail: { query, mode: 'ai', response: response } 
        }))
      }
    } catch (error: any) {
      console.error('Search failed:', error)
      // Show error to user
      window.dispatchEvent(new CustomEvent('searchError', { 
        detail: { query, error: error?.message || 'Search failed' } 
      }))
    } finally {
      setIsSearching(false)
    }
  }

  const handleVoiceInput = (transcript: string) => {
    setQuery(transcript)
    setShowVoiceInterface(false)
    // Auto-search with voice input
    setTimeout(() => handleSearch(), 500)
  }

  const handleImageGenerated = (imageUrl: string) => {
    window.dispatchEvent(new CustomEvent('imageGenerated', {
      detail: { prompt: imagePrompt, imageUrl }
    }))
  }

  const detectSearchMode = (query: string) => {
    if (searchSettings.imageGeneration && 
        (query.toLowerCase().includes('generate') || 
         query.toLowerCase().includes('create') || 
         query.toLowerCase().includes('draw') || 
         query.toLowerCase().includes('make'))) {
      return 'image'
    }
    return searchSettings.webEnabled ? 'web' : 'ai'
  }

  // Update search mode based on query
  useEffect(() => {
    if (query) {
      const detectedMode = detectSearchMode(query)
      if (detectedMode !== searchMode) {
        setSearchMode(detectedMode as any)
      }
    }
  }, [query, searchSettings])

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setTimeout(() => handleSearch(), 100)
  }

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser')
      return
    }

    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setQuery(transcript)
    }

    recognition.start()
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isFocused) {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape' && isFocused) {
        inputRef.current?.blur()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isFocused])

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
      <div className="container max-w-5xl mx-auto text-center">
        {/* Hero Title with Advanced Typography */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="mb-16"
        >
          <motion.h1 
            className="text-7xl md:text-9xl font-black mb-8 relative"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <span className="gradient-text gradient-animate bg-gradient-to-r from-primary-400 via-secondary-400 via-accent-400 to-primary-400">
              Quest.io
            </span>
            {/* Glowing effect */}
            <motion.div
              className="absolute inset-0 text-7xl md:text-9xl font-black blur-lg opacity-30 gradient-text"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Quest.io
            </motion.div>
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-3xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Experience the{' '}
            <span className="gradient-text font-semibold">future of search</span>{' '}
            with quantum-powered AI insights and lightning-fast results
          </motion.p>
        </motion.div>

        {/* Enhanced Search Container */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          className="mb-16"
        >
          {/* Search Mode Selector */}
          <motion.div 
            className="flex justify-center mb-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="glass-card rounded-full p-1 flex relative overflow-hidden">
              <motion.div
                className="absolute inset-y-1 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-full"
                animate={{ 
                  x: searchMode === 'ai' ? '0%' : 
                     searchMode === 'web' ? '25%' : 
                     searchMode === 'voice' ? '50%' : '75%',
                  width: searchMode === 'ai' ? '25%' : 
                         searchMode === 'web' ? '25%' : 
                         searchMode === 'voice' ? '25%' : '25%'
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
              
              <button
                onClick={() => setSearchMode('ai')}
                className={`relative px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                  searchMode === 'ai'
                    ? 'text-white shadow-lg'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Brain className="w-4 h-4 inline mr-2" />
                AI
              </button>
              
              <button
                onClick={() => setSearchMode('web')}
                disabled={!searchSettings.webEnabled}
                className={`relative px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                  searchMode === 'web'
                    ? 'text-white shadow-lg'
                    : searchSettings.webEnabled 
                      ? 'text-muted-foreground hover:text-foreground'
                      : 'text-muted-foreground/50 cursor-not-allowed'
                }`}
              >
                <Globe className="w-4 h-4 inline mr-2" />
                Web
              </button>
              
              <button
                onClick={() => setSearchMode('voice')}
                disabled={!voiceSettings.enabled}
                className={`relative px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                  searchMode === 'voice'
                    ? 'text-white shadow-lg'
                    : voiceSettings.enabled 
                      ? 'text-muted-foreground hover:text-foreground'
                      : 'text-muted-foreground/50 cursor-not-allowed'
                }`}
              >
                <Mic className="w-4 h-4 inline mr-2" />
                Voice
              </button>
              
              <button
                onClick={() => setSearchMode('image')}
                disabled={!searchSettings.imageGeneration}
                className={`relative px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                  searchMode === 'image'
                    ? 'text-white shadow-lg'
                    : searchSettings.imageGeneration 
                      ? 'text-muted-foreground hover:text-foreground'
                      : 'text-muted-foreground/50 cursor-not-allowed'
                }`}
              >
                <ImageIcon className="w-4 h-4 inline mr-2" />
                Image
              </button>
            </div>
          </motion.div>

          {/* Advanced Search Input */}
          <div className="relative max-w-4xl mx-auto">
            <motion.div
              className="glass-card rounded-3xl p-3 border-2 border-transparent focus-within:border-primary-500/50 transition-all duration-500 relative overflow-hidden"
              style={{ x, y }}
              whileHover={{ scale: 1.02 }}
              whileFocus={{ scale: 1.02 }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const centerX = rect.left + rect.width / 2
                const centerY = rect.top + rect.height / 2
                mouseX.set((e.clientX - centerX) * 0.1)
                mouseY.set((e.clientY - centerY) * 0.1)
              }}
              onMouseLeave={() => {
                mouseX.set(0)
                mouseY.set(0)
              }}
            >
              {/* Animated border gradient */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/30 to-primary-500/0 opacity-0 rounded-3xl"
                animate={{ 
                  opacity: isFocused ? 1 : 0,
                  background: [
                    'linear-gradient(90deg, rgba(99,102,241,0) 0%, rgba(99,102,241,0.3) 50%, rgba(99,102,241,0) 100%)',
                    'linear-gradient(90deg, rgba(168,85,247,0) 0%, rgba(168,85,247,0.3) 50%, rgba(168,85,247,0) 100%)',
                    'linear-gradient(90deg, rgba(99,102,241,0) 0%, rgba(99,102,241,0.3) 50%, rgba(99,102,241,0) 100%)',
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              <div className="flex items-center relative z-10">
                {/* Voice Search Button */}
                <motion.button
                  onClick={() => setShowVoiceInterface(true)}
                  disabled={!voiceSettings.enabled}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`p-3 mr-3 rounded-full glass hover:glass-strong transition-all duration-300 group ${
                    !voiceSettings.enabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Mic className={`w-5 h-5 ${
                    !voiceSettings.enabled 
                      ? 'text-muted-foreground/50'
                      : 'text-muted-foreground group-hover:text-primary-400'
                  }`} />
                </motion.button>

                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Ask the universe anything... (Press / to focus)"
                  className="flex-1 bg-transparent border-none outline-none text-xl px-6 py-6 text-foreground placeholder-muted-foreground"
                />

                {/* Visual Search Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 mx-3 rounded-full glass hover:glass-strong transition-all duration-300 group"
                >
                  <Camera className="w-5 h-5 text-muted-foreground group-hover:text-secondary-400" />
                </motion.button>

                {/* Enhanced Search Button */}
                <motion.button
                  onClick={handleSearch}
                  disabled={isSearching || !query.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white p-4 rounded-full mr-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/25 relative overflow-hidden group"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-secondary-500 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    initial={false}
                  />
                  {isSearching ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-6 h-6 border-2 border-white border-t-transparent rounded-full relative z-10"
                    />
                  ) : (
                    <ArrowRight className="w-6 h-6 relative z-10" />
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Enhanced Search Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
          className="flex flex-wrap justify-center gap-4 mb-20"
        >
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={index}
              onClick={() => handleSuggestionClick(suggestion.text)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              whileHover={{ 
                scale: 1.05, 
                y: -4,
                boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)'
              }}
              whileTap={{ scale: 0.95 }}
              className="glass-card rounded-full px-6 py-3 flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground hover:glass-strong transition-all duration-300 group relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={false}
              />
              <span className="relative z-10">{suggestion.icon}</span>
              <span className="relative z-10">{suggestion.text}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Enhanced Loading Animation */}
        <AnimatePresence>
          {isSearching && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center space-y-6"
            >
              <div className="flex space-x-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 1, 0.3],
                      backgroundColor: [
                        'rgba(99, 102, 241, 0.6)',
                        'rgba(168, 85, 247, 0.8)',
                        'rgba(34, 197, 94, 0.6)',
                        'rgba(99, 102, 241, 0.6)',
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                    className="w-4 h-4 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                  />
                ))}
              </div>
              <motion.p
                className="text-muted-foreground text-lg"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <span className="typewriter">Quantum processing your query...</span>
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-gradient-to-b from-primary-500 to-transparent rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Voice Interface Modal */}
      <AnimatePresence>
        {showVoiceInterface && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowVoiceInterface(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <VoiceInterface
                onVoiceInput={handleVoiceInput}
                onVoiceResponse={(audio) => console.log('Voice response:', audio)}
                className="w-full"
              />
              <button
                onClick={() => setShowVoiceInterface(false)}
                className="w-full mt-6 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Generation Modal */}
      <AnimatePresence>
        {showImageGeneration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowImageGeneration(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ImageGeneration
                prompt={imagePrompt}
                onImageGenerated={handleImageGenerated}
                onClose={() => setShowImageGeneration(false)}
                className="max-w-4xl w-full"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

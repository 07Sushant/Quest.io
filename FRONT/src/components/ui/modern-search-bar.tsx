'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Sparkles, Zap } from 'lucide-react'
import { ModeSelector } from './mode-selector'

interface ModernSearchBarProps {
  onSearchStart: (query: string) => void
  isSearching: boolean
  className?: string
}

export function ModernSearchBar({ onSearchStart, isSearching, className = '' }: ModernSearchBarProps) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentMode, setCurrentMode] = useState<'ai' | 'web' | 'voice' | 'image'>('ai')
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus on mount
  useEffect(() => {
    if (inputRef.current && !isSearching) {
      inputRef.current.focus()
    }
  }, [isSearching])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearchStart(query.trim())
      setIsExpanded(true)
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
    setIsExpanded(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
    if (!query.trim() && !isSearching) {
      setIsExpanded(false)
    }
  }

  return (
    <motion.div 
      className={`${className}`}
      layout
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Logo - Hide when expanded */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center mb-12"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center space-x-3 mb-4"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary-500/25">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-6xl font-black gradient-text">Quest.io</h1>
            </motion.div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Your intelligent search companion powered by quantum AI
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <motion.form
        onSubmit={handleSubmit}
        layout
        className={`relative transition-all duration-500 ${
          isExpanded ? 'w-full max-w-4xl' : 'w-full max-w-2xl'
        } mx-auto`}
      >
        <motion.div
          layout
          className={`relative bg-white/5 backdrop-blur-xl border-2 transition-all duration-500 ${
            isFocused 
              ? 'border-primary-500/50 shadow-2xl shadow-primary-500/10' 
              : 'border-white/10 hover:border-white/20'
          } ${
            isExpanded ? 'rounded-xl' : 'rounded-3xl'
          } overflow-hidden`}
        >
          {/* Animated background gradient */}
          <motion.div
            className="absolute inset-0 opacity-0"
            animate={{
              opacity: isFocused ? 1 : 0,
              background: [
                'linear-gradient(90deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.1) 50%, rgba(99,102,241,0.1) 100%)',
                'linear-gradient(90deg, rgba(168,85,247,0.1) 0%, rgba(236,72,153,0.1) 50%, rgba(168,85,247,0.1) 100%)',
                'linear-gradient(90deg, rgba(236,72,153,0.1) 0%, rgba(99,102,241,0.1) 50%, rgba(236,72,153,0.1) 100%)',
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          <div className="relative flex items-center">
            {/* Search Icon */}
            <div className="pl-6 pr-3">
              <motion.div
                animate={isSearching ? { rotate: 360 } : {}}
                transition={{ duration: 2, repeat: isSearching ? Infinity : 0, ease: 'linear' }}
              >
                {isSearching ? (
                  <Sparkles className="w-6 h-6 text-primary-400" />
                ) : (
                  <Search className="w-6 h-6 text-muted-foreground" />
                )}
              </motion.div>
            </div>

            {/* Input Field */}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Ask anything..."
              disabled={isSearching}
              className={`flex-1 bg-transparent border-none outline-none transition-all duration-300 text-foreground placeholder-muted-foreground ${
                isExpanded ? 'text-lg py-4' : 'text-xl py-6'
              } pr-6`}
            />

            {/* Submit Button - Only show when typing */}
            <AnimatePresence>
              {query.trim() && !isSearching && (
                <motion.button
                  type="submit"
                  initial={{ opacity: 0, scale: 0.8, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 20 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mr-3 p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all duration-300"
                >
                  <Search className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Progress bar for searching */}
          <AnimatePresence>
            {isSearching && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                exit={{ scaleX: 0 }}
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary-500 to-secondary-500 origin-left"
                transition={{ duration: 0.5 }}
              />
            )}
          </AnimatePresence>
        </motion.div>

        {/* Mode Selector - Show when expanded or always in compact mode */}
        <AnimatePresence>
          {(isExpanded || className.includes('compact')) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4"
            >
              <ModeSelector
                currentMode={currentMode}
                onModeChange={setCurrentMode}
                className="justify-center"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search suggestions */}
        <AnimatePresence>
          {!isExpanded && !isSearching && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap justify-center gap-3 mt-8"
            >
              {[
                'Generate a cat image',
                'Latest AI breakthroughs',
                'Quantum computing news',
                'Space exploration updates'
              ].map((suggestion, index) => (
                <motion.button
                  key={suggestion}
                  onClick={() => {
                    setQuery(suggestion)
                    setTimeout(() => onSearchStart(suggestion), 100)
                  }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-300 hover:border-gray-400 dark:border-white/10 dark:hover:border-white/20 rounded-full text-sm text-gray-700 hover:text-gray-900 dark:text-muted-foreground dark:hover:text-foreground transition-all duration-300"
                >
                  {suggestion}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.form>

      {/* Keyboard shortcut hint */}
      <AnimatePresence>
        {!isExpanded && !isSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1 }}
            className="text-center mt-8"
          >
            <p className="text-sm text-muted-foreground">
              Press <kbd className="px-2 py-1 bg-white/10 rounded text-xs">Enter</kbd> to search
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

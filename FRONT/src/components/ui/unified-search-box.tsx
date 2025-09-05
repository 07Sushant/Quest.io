'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { Search, Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UnifiedSearchBoxProps {
  onSearch: (query: string) => void
  isSearching?: boolean
  isActive?: boolean
  placeholder?: string
  className?: string
}

export function UnifiedSearchBox({
  onSearch,
  isSearching = false,
  isActive = false,
  placeholder = "Ask me anything...",
  className
}: UnifiedSearchBoxProps) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Animation values
  const scale = useMotionValue(1)
  const opacity = useMotionValue(1)
  
  // Transform values for smooth scaling
  const scaleTransform = useTransform(scale, [0.95, 1, 1.05], [0.95, 1, 1.05])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim() && !isSearching) {
      onSearch(query.trim())
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
    scale.set(1.02)
  }

  const handleBlur = () => {
    setIsFocused(false)
    scale.set(1)
  }

  // Auto-focus when component becomes active
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isActive])

  return (
    <motion.div
      className={cn(
        "relative w-full transition-all duration-500 ease-out",
        className
      )}
      style={{ scale: scaleTransform }}
      layout
    >
      {/* Animated Background */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-xl"
        animate={{
          scale: isFocused ? 1.1 : 1,
          opacity: isFocused ? 0.8 : 0.4
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
      
      {/* Search Form */}
      <motion.form
        onSubmit={handleSubmit}
        className="relative"
        layout
      >
        <motion.div
          className={cn(
            "relative flex items-center rounded-2xl border transition-all duration-300",
            "bg-white/5 backdrop-blur-xl border-white/20",
            isFocused 
              ? "border-blue-400/50 bg-white/10 shadow-2xl shadow-blue-500/20" 
              : "border-white/10 hover:border-white/30"
          )}
          animate={{
            height: isFocused ? 64 : isActive ? 48 : 56
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          layout
        >
          {/* Search Icon */}
          <motion.div
            className="flex items-center justify-center pl-4 pr-2"
            animate={{
              scale: isFocused ? 1.1 : 1,
              color: isFocused ? "#60a5fa" : "#94a3b8"
            }}
            transition={{ duration: 0.2 }}
          >
            <Search className="w-5 h-5" />
          </motion.div>

          {/* Input Field */}
          <motion.input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={isSearching}
            className={cn(
              "flex-1 bg-transparent border-none outline-none",
              "text-white placeholder-white/60",
              "font-medium transition-all duration-300",
              isFocused ? "text-lg" : isActive ? "text-base" : "text-lg"
            )}
            layout
          />

          {/* Submit Button */}
          <AnimatePresence mode="wait">
            {(query.trim() || isSearching) && (
              <motion.button
                type="submit"
                disabled={isSearching || !query.trim()}
                className={cn(
                  "flex items-center justify-center mr-3 p-2 rounded-xl",
                  "bg-gradient-to-r from-blue-500 to-purple-600",
                  "hover:from-blue-600 hover:to-purple-700",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-all duration-200 shadow-lg"
                )}
                initial={{ opacity: 0, scale: 0.8, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 10 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Send className="w-4 h-4 text-white" />
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Animated Border Glow */}
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 blur-sm -z-10"
          animate={{
            opacity: isFocused ? 0.3 : 0,
            scale: isFocused ? 1.02 : 1
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.form>

      {/* Focus Ring */}
      <motion.div
        className="absolute inset-0 rounded-2xl border-2 border-blue-400/0 -z-10"
        animate={{
          borderColor: isFocused ? "rgba(96, 165, 250, 0.3)" : "rgba(96, 165, 250, 0)",
          scale: isFocused ? 1.01 : 1
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  )
}

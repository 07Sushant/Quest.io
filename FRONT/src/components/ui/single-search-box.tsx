'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Send, Mic, Globe, Brain, TrainFront, Image as ImageIcon, Sparkles, Volume2, Palette } from 'lucide-react'
import GeminiVoiceModal from './gemini-voice-modal'
import { Microscope } from "lucide-react";


interface SingleSearchBoxProps {
  onSearch: (query: string, mode: string, opts?: { files?: File[]; imageUrls?: string[]; previewUrls?: string[] }) => void
  isSearching: boolean
  isCompact?: boolean
  className?: string
}

export function SingleSearchBox({ onSearch, isSearching, isCompact = false, className = '' }: SingleSearchBoxProps) {
  const [query, setQuery] = useState('')
  const [selectedMode, setSelectedMode] = useState('ai')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Voice modal state
  const [voiceOpen, setVoiceOpen] = useState(false)

  // Transient STEM notice
  const [stemNotice, setStemNotice] = useState(false)

  // STEM notice auto-hide on select
  useEffect(() => {
    if (selectedMode === 'STEM') {
      setStemNotice(true)
      const t = setTimeout(() => setStemNotice(false), 3000)
      return () => clearTimeout(t)
    }
  }, [selectedMode])

  // Vision/Art local state for image inputs
  const [visionFiles, setVisionFiles] = useState<File[]>([])
  const [visionPreviews, setVisionPreviews] = useState<string[]>([])
  const [artFile, setArtFile] = useState<File | null>(null)
  const [artPreview, setArtPreview] = useState<string | null>(null)

  const addVisionFiles = (files: File[]) => {
    if (!files?.length) return
    if (selectedMode === 'art') {
      // For Art mode, keep only one image and override any existing
      const first = files[0]
      setVisionFiles([first])
      setVisionPreviews([URL.createObjectURL(first)])
      return
    }
    // Vision: allow up to 4 and merge
    const merged = [...visionFiles, ...files].slice(0, 4)
    setVisionFiles(merged)
    const urls = merged.map(f => URL.createObjectURL(f))
    setVisionPreviews(urls)
  }

  const removeVisionFile = (idx: number) => {
    const next = visionFiles.filter((_, i) => i !== idx)
    setVisionFiles(next)
    const urls = next.map(f => URL.createObjectURL(f))
    setVisionPreviews(urls)
  }

  const modes = [
    { id: 'ai', icon: TrainFront, name: 'Quest', color: 'from-green-400 to-blue-500' },
    { id: 'web', icon: Globe, name: 'Web Search', color: 'from-blue-400 to-purple-500' },
    { id: 'voice', icon: Mic, name: 'Voice', color: 'from-purple-400 to-pink-500' },
    { id: 'image', icon: ImageIcon, name: 'Image Gen', color: 'from-pink-400 to-red-500' },
    { id: 'vision', icon: ImageIcon, name: 'Vision', color: 'from-teal-400 to-emerald-500' },
    { id: 'art', icon: Palette, name: 'Art', color: 'from-fuchsia-400 to-rose-500' },
    { id: 'speech', icon: Volume2, name: 'Speech', color: 'from-orange-400 to-yellow-500' },
    { id: 'STEM', icon: Microscope, name: 'STEM', color: 'from-cyan-400 to-sky-500' },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim() && !isSearching) {
      // Pass files for vision and art modes (art uses only the first image)
      let opts: { files?: File[]; previewUrls?: string[] } | undefined
      if ((selectedMode === 'vision' || selectedMode === 'art') && (visionFiles.length || visionPreviews.length)) {
        const files = selectedMode === 'art' ? visionFiles.slice(0, 1) : visionFiles
        const previews = selectedMode === 'art' ? visionPreviews.slice(0, 1) : visionPreviews
        opts = { files, previewUrls: previews }
      }
      onSearch(query.trim(), selectedMode, opts)
      setQuery('')
    }
  }

  // Allow pasting images in vision or art mode on landing input
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    const onPaste = (evt: ClipboardEvent) => {
      if (selectedMode !== 'vision' && selectedMode !== 'art') return
      const items = evt.clipboardData?.items
      if (!items) return
      const files: File[] = []
      for (const it of items as any) {
        if (it.type?.startsWith('image/')) {
          const blob = it.getAsFile?.()
          if (blob) files.push(new File([blob], `pasted-${Date.now()}.png`, { type: blob.type }))
        }
      }
      if (files.length) addVisionFiles(selectedMode === 'art' ? [files[0]] : files)
    }
    el.addEventListener('paste', onPaste as any)
    return () => el.removeEventListener('paste', onPaste as any)
  }, [selectedMode, inputRef.current])

  useEffect(() => {
    if (!isCompact && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isCompact])

  return (
    <motion.div className={`w-full ${className}`} layout>
      {/* Hero Section - Only show when not compact */}
      <AnimatePresence>
        {!isCompact && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <motion.div
              className="inline-flex items-center space-x-4 mb-6"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="relative">
                <motion.div
                  className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                >
                  <img
                    src="https://raw.githubusercontent.com/07Sushant/dump/main/quest.png"
                    alt="Quest logo"
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </motion.div>
              </div>
              <h1 className="text-7xl font-black bg-gradient-to-r from-foreground via-primary-300 to-secondary-300 bg-clip-text text-transparent dark:from-white dark:via-blue-200 dark:to-purple-200">
                Quest.io
              </h1>
            </motion.div>
            <motion.p 
              className="text-xl text-foreground/70 dark:text-white/70 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Your quantum-powered AI companion for search, creativity, and discovery
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dock wrapper start */}
      <motion.div className="relative mx-auto w-full max-w-4xl px-4">
        <motion.div
          layout
          className="rounded-3xl bg-foreground/[0.06] dark:bg-white/10 border border-foreground/10 dark:border-white/10 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.25)] px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6"
        >
      {/* Enhanced Mode Selector */}
      <motion.div 
        className="mb-4"
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: isCompact ? 0 : 0.4 }}
      >
        <div className="flex justify-center flex-wrap gap-2">
          {modes.map((mode) => {
            const Icon = mode.icon
            return (
              <motion.button
                key={mode.id}
                onClick={() => {
                  setSelectedMode(mode.id)
                  if (mode.id === 'voice') setVoiceOpen(true)
                  else setVoiceOpen(false)
                }}
                className={`
                  relative px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-300
                  ${selectedMode === mode.id 
                    ? 'text-white shadow-2xl scale-105' 
                    : 'text-foreground/70 hover:text-foreground hover:scale-105 bg-foreground/5 hover:bg-foreground/10 dark:text-white/70 dark:hover:text-white dark:bg-white/5 dark:hover:bg-white/10'
                  }
                  ${mode.id === 'voice' && selectedMode === 'voice' ? 'ring-2 ring-purple-400/60 ring-offset-2 ring-offset-transparent' : ''}
                `}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                layout
              >
                {selectedMode === mode.id && (
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ${mode.color} rounded-2xl`}
                    layoutId="activeMode"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <div className="relative flex items-center space-x-2">
                  <Icon className="w-4 h-4" />
                  <span>{mode.name}</span>
                </div>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Voice Modal */}
      {voiceOpen && selectedMode === 'voice' && (
        <GeminiVoiceModal open={voiceOpen} onClose={() => setVoiceOpen(false)} />
      )}

      {/* STEM Transient Notice (bottom-right toast) */}
      <AnimatePresence>
        {stemNotice && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <div className="rounded-xl border border-red-500/40 bg-red-50/90 text-red-800 dark:bg-red-500/20 dark:text-red-200 px-4 py-3 text-sm shadow-2xl backdrop-blur-md max-w-xs">

              From Hugging Face, Fathom R1 14B will be used for complex STEM problem solving and it may take longer. Coming soon.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Search Input */}
      {/* Vision small inline previews row */}
      {selectedMode === 'vision' && visionPreviews.length > 0 && (
        <div className="flex items-center gap-2 mb-3 px-2">
          {visionPreviews.map((src, idx) => (
            <div key={idx} className="relative w-10 h-10 shrink-0 rounded-md overflow-hidden border border-white/10">
              <img src={src} className="object-cover w-full h-full" />
              <button onClick={() => removeVisionFile(idx)} className="absolute -top-1 -right-1 text-[10px] leading-none px-1 bg-black/70 text-white rounded-full">×</button>
            </div>
          ))}
        </div>
      )}

      {/* Art single preview row */}
      {selectedMode === 'art' && visionPreviews.length > 0 && (
        <div className="flex items-center gap-2 mb-3 px-2">
          <div className="relative w-10 h-10 shrink-0 rounded-md overflow-hidden border border-white/10">
            <img src={visionPreviews[0]} className="object-cover w-full h-full" />
            <button onClick={() => { setVisionFiles([]); setVisionPreviews([]) }} className="absolute -top-1 -right-1 text-[10px] leading-none px-1 bg-black/70 text-white rounded-full">×</button>
          </div>
        </div>
      )}

      <motion.form 
        onSubmit={handleSubmit}
        className="relative"
        layout
      >
        <motion.div
          className={`
            relative backdrop-blur-2xl border-2 transition-all duration-500 overflow-hidden
            ${isFocused 
              ? 'shadow-2xl shadow-blue-500/20 scale-[1.02]' 
              : ''
            }
            ${isCompact ? 'rounded-xl' : 'rounded-3xl'}
            bg-foreground/[0.07] border-foreground/20 hover:border-foreground/25 dark:bg-white/10 dark:border-white/20 dark:hover:border-white/25
          `}
          animate={{
            height: isCompact ? 56 : 72
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Animated Background */}
          <motion.div
            className="absolute inset-0 opacity-30"
            animate={{
              background: isFocused ? [
                'linear-gradient(90deg, rgba(59,130,246,0.1) 0%, rgba(147,51,234,0.1) 50%, rgba(236,72,153,0.1) 100%)',
                'linear-gradient(90deg, rgba(147,51,234,0.1) 0%, rgba(236,72,153,0.1) 50%, rgba(59,130,246,0.1) 100%)',
                'linear-gradient(90deg, rgba(236,72,153,0.1) 0%, rgba(59,130,246,0.1) 50%, rgba(147,51,234,0.1) 100%)',
              ] : 'linear-gradient(90deg, transparent 0%, transparent 100%)'
            }}
            transition={{ duration: 3, repeat: isFocused ? Infinity : 0 }}
          />

          <div className="relative flex items-center h-full">
            {/* Search Icon */}
            <div className={`${isCompact ? 'pl-4 pr-3' : 'pl-6 pr-4'}`}>
              <motion.div
                animate={{ 
                  rotate: isSearching ? 360 : 0,
                  scale: isFocused ? 1.1 : 1
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: isSearching ? Infinity : 0, ease: 'linear' },
                  scale: { duration: 0.2 }
                }}
              >
                {isSearching ? (
                  <Sparkles className="w-6 h-6 text-blue-400" />
                ) : (
                  <Search className="w-6 h-6 text-foreground/60 dark:text-white/60" />
                )}
              </motion.div>
            </div>

            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={`Ask ${modes.find(m => m.id === selectedMode)?.name.toLowerCase()}...`}
              disabled={isSearching}
              className={`
                flex-1 bg-transparent border-none outline-none text-foreground placeholder-foreground/50
                font-medium transition-all duration-300
                ${isCompact ? 'text-base py-4' : 'text-xl py-6'}
                ${isCompact ? 'pr-4' : 'pr-6'}
                dark:text-white dark:placeholder-white/50
              `}
            />

            {/* Vision/Art Attach Button (right corner) */}
            {(selectedMode === 'vision' || selectedMode === 'art') && (
              <label className={`${isCompact ? 'mr-2 p-2' : 'mr-3 p-3'} bg-foreground/10 hover:bg-foreground/20 dark:bg-white/10 dark:hover:bg-white/20 text-foreground/80 dark:text-white/80 rounded-xl cursor-pointer transition-colors duration-200 flex items-center gap-2`}>
                <input
                  type="file"
                  accept="image/*"
                  multiple={selectedMode === 'vision'}
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []) as File[]
                    if (files.length) addVisionFiles(selectedMode === 'vision' ? files : [files[0]])
                    e.currentTarget.value = ''
                  }}
                />
                <ImageIcon className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Attach</span>
              </label>
            )}

            {/* Send Button */}
            <AnimatePresence>
              {query.trim() && !isSearching && (
                <motion.button
                  type="submit"
                  initial={{ opacity: 0, scale: 0.5, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.5, x: 20 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`
                    ${isCompact ? 'mr-3 p-2' : 'mr-4 p-3'} 
                    bg-gradient-to-r from-blue-500 to-purple-600 
                    hover:from-blue-600 hover:to-purple-700
                    text-white rounded-xl shadow-lg hover:shadow-xl
                    transition-all duration-200
                  `}
                >
                  <Send className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Progress Bar */}
          <AnimatePresence>
            {isSearching && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                exit={{ scaleX: 0 }}
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 origin-left"
                transition={{ duration: 0.5 }}
              />
            )}
          </AnimatePresence>

          {/* Glow Effect */}
          <motion.div
            className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl -z-10"
            animate={{
              opacity: isFocused ? 0.6 : 0,
              scale: isFocused ? 1.05 : 1
            }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      </motion.form>
      </motion.div>
      </motion.div>
      {/* Dock wrapper end */}

      {/* Quick Suggestions - Only for main search */}
      <AnimatePresence>
        {!isCompact && !isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-3 mt-8"
          >
            {[
              'Generate a futuristic cityscape',
              'Latest AI breakthroughs 2025',
              'Quantum computing explained',
              'Best coding practices'
            ].map((suggestion, index) => (
              <motion.button
                key={suggestion}
                onClick={() => {
                  setQuery(suggestion)
                  setTimeout(() => onSearch(suggestion, selectedMode), 100)
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-300 hover:border-gray-400 dark:border-white/10 dark:hover:border-white/20 rounded-full text-sm text-gray-700 hover:text-gray-900 dark:text-white/70 dark:hover:text-white transition-all duration-300"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
              >
                {suggestion}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, User, Loader2 } from 'lucide-react'
import { getImageUrl } from '@/lib/api'
import { CodeBlock } from './code-block'
import { parseMessageContent, MessageBlock } from '@/lib/message-parser'
import { AudioPlayer } from './audio-player'
import { EnhancedImageDisplay } from './enhanced-image-display'
import { ImageGenerationLoading } from './image-generation-loading'
import { WebSearchLoading } from './web-search-loading'
import { WebSearchSources } from './web-search-sources'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  imageUrl?: string
  images?: string[]
  audioData?: string
  contentType?: string
  originalInput?: string
  dimensions?: { width: number; height: number }
  type?: string
  isGeneratingImage?: boolean
  mode?: string
  sources?: Array<{
    title: string
    url: string
    snippet: string
    domain?: string
    ai_score?: number
    relevance_reason?: string
  }>
}

interface MessagesDisplayProps {
  newQuery?: string
  newResponse?: any
  isSearching?: boolean
  className?: string
  onMessagesUpdate?: (messages: Message[]) => void
  onAudioPlayingChange?: (isPlaying: boolean) => void
  bottomSpacerPx?: number
  searchMode?: string
}

export function MessagesDisplay({ 
  newQuery, 
  newResponse, 
  isSearching, 
  className = '',
  onMessagesUpdate,
  onAudioPlayingChange,
  bottomSpacerPx = 0,
  searchMode = 'ai'
}: MessagesDisplayProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const lastProcessedQuery = useRef<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  // Scroll helpers: only auto-scroll if user is near bottom
  const scrollToBottom = (smooth = true) => {
    if (smooth) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    else messagesEndRef.current?.scrollIntoView()
  }

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom(true)
    }
  }, [messages, isAtBottom])

  // Track scroll position to avoid locking user scroll
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onScroll = () => {
      const threshold = 80 // px from bottom to consider "at bottom"
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
      setIsAtBottom(atBottom)
    }
    el.addEventListener('scroll', onScroll)
    // Initialize state
    onScroll()
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // Add messages when new query and response arrive
  useEffect(() => {
    if (!newQuery || !newResponse) return

    const isPreview = Array.isArray(newResponse.images) && newResponse.images.length > 0
    const isVisionResult = newResponse?.type === 'vision-result'
    if (!isVisionResult && newQuery === lastProcessedQuery.current && !isPreview) return
    if (isSearching && !isPreview) return

    console.log('Adding new message:', { newQuery, newResponse })

    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random()}`,
      role: 'user',
      content: newQuery,
      timestamp: new Date()
    }

    const aiMessage: Message = {
      id: `ai-${Date.now()}-${Math.random()}`,
      role: 'assistant',
      content: newResponse.description || newResponse.content || newResponse.response || newResponse.output || newResponse.message || 'I processed your request.',
      timestamp: new Date(),
      imageUrl: newResponse.imageUrl,
      audioData: newResponse.audioData,
      contentType: newResponse.contentType,
      originalInput: newResponse.originalInput,
      dimensions: newResponse.dimensions,
      type: newResponse.type,
      mode: newResponse.mode || searchMode,
      sources: newResponse.sources || []
    }

    // Vision preview message injection: if newResponse.images exist and content is a preview marker
    if (Array.isArray(newResponse.images) && newResponse.images.length) {
      const previewMsg: Message = {
        id: `user-vision-preview-${Date.now()}-${Math.random()}`,
        role: 'user',
        content: newQuery || '(images attached)',
        timestamp: new Date(),
        // @ts-ignore - extend type with images
        images: newResponse.images
      }
      setMessages(prev => {
        const withPreview = [...prev, previewMsg]
        onMessagesUpdate?.(withPreview)
        return withPreview
      })
      lastProcessedQuery.current = newQuery
      return
    }

    setMessages(prev => {
      const newMessages = [...prev, userMessage, aiMessage]
      onMessagesUpdate?.(newMessages)
      return newMessages
    })

    lastProcessedQuery.current = newQuery
  }, [newQuery, newResponse, isSearching, onMessagesUpdate])

  return (
    <div
      ref={containerRef}
      className={`flex-1 overflow-y-auto px-4 py-6 ${className}`}
      style={{
        paddingBottom: (bottomSpacerPx || 0) + 64, // extra bottom room so content isn't hidden
        scrollPaddingBottom: (bottomSpacerPx || 0) + 96,
      }}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ 
                delay: index * 0.1,
                duration: 0.4,
                ease: "easeOut"
              }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[85%] p-5 rounded-3xl backdrop-blur-xl border relative
                  ${message.role === 'user' 
                    ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-400/20 text-foreground dark:from-blue-500/20 dark:to-purple-500/20 dark:border-blue-400/30 dark:text-blue-50' 
                    : 'bg-foreground/[0.06] border-foreground/15 text-foreground dark:bg-white/10 dark:border-white/20 dark:text-white'
                  }
                `}
              >
                {/* Avatar */}
                <div className={`
                  absolute -top-2 ${message.role === 'user' ? '-right-2' : '-left-2'} 
                  w-8 h-8 rounded-full flex items-center justify-center
                  ${message.role === 'user' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                    : 'bg-gradient-to-r from-green-500 to-blue-500'
                  }
                `}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>

                {/* Message Content */}
                <div className="pt-2">
                  {/* Parse and render message content with code blocks */}
                  {!(message.images?.length && message.role === 'user') && (
                    <div className="text-sm leading-relaxed">
                      {parseMessageContent(message.content).map((block, blockIndex) => {
                        if (block.type === 'code') {
                          return (
                            <CodeBlock
                              key={blockIndex}
                              code={block.code}
                              language={block.language}
                              filename={block.filename}
                            />
                          )
                        } else {
                          return (
                            <div key={blockIndex} className="whitespace-pre-wrap mb-2">
                              {block.content}
                            </div>
                          )
                        }
                      })}
                    </div>
                  )}
                  
                  {/* Enhanced Image Display for Image Generation and Vision previews */}
                  {(message.imageUrl || message.images?.length || (message.role === 'assistant' && message.isGeneratingImage)) && (
                    <div className="mt-4 space-y-3">
                      {/* Vision multiple previews */}
                      {message.images?.length ? (
                        <div className="grid grid-cols-2 gap-2">
                          {message.images.map((src, i) => (
                            <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-white/10">
                              <img src={src} className="object-cover w-full h-full" />
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {/* Generated image */}
                      {message.imageUrl ? (
                        <EnhancedImageDisplay
                          imageUrl={message.imageUrl}
                          prompt={newQuery || message.content || 'Generated image'}
                          originalInput={message.originalInput}
                          dimensions={message.dimensions}
                          showControls={true}
                          autoPreview={true}
                        />
                      ) : (!message.images?.length ? (
                        <ImageGenerationLoading 
                          prompt={newQuery || message.content || 'Generating image...'}
                          show={true}
                        />
                      ) : null)}
                    </div>
                  )}

                  {/* Audio Display for Speech Generation */}
                  {message.audioData && (
                    <div className="mt-4">
                      <AudioPlayer
                        audioData={message.audioData}
                        contentType={message.contentType}
                        text={newQuery || 'Generated speech'}
                        autoPlay={true}
                        onPlayStart={() => onAudioPlayingChange?.(true)}
                        onPlayEnd={() => onAudioPlayingChange?.(false)}
                      />
                    </div>
                  )}

                  {/* Web Search Sources - Only show for web search mode and assistant messages */}
                  {message.role === 'assistant' && message.mode === 'web' && message.sources && message.sources.length > 0 && (
                    <WebSearchSources 
                      sources={message.sources} 
                      query={newQuery || ''} 
                      className="mt-4"
                    />
                  )}
                  
                  <p className="text-xs opacity-60 mt-3">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Loading indicator */}
        {isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-foreground/[0.06] border border-foreground/15 p-5 rounded-3xl backdrop-blur-xl relative dark:bg-white/10 dark:border-white/20">
              {/* Bot Avatar */}
              <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              
              <div className="pt-2">
                {searchMode === 'web' ? (
                  <WebSearchLoading show={isSearching} query={newQuery} />
                ) : (
                  <>
                    <div className="flex items-center space-x-3">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Questing...</p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Welcome message if no messages */}
        {messages.length === 0 && !isSearching && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Ready to help!</h3>
            <p className="text-white/60">Ask me anything using the search box below.</p>
          </motion.div>
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
        {/* Bottom spacer to allow comfortable scroll beyond last message */}
        <div style={{ height: 160 }} />
      </div>
    </div>
  )
}

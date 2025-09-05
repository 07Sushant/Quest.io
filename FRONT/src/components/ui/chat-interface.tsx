'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mic, Image as ImageIcon, Globe, Brain, Loader2, Volume2 } from 'lucide-react'
import { useSettings } from '@/lib/hooks/use-settings'
import { ModeSelector } from '@/components/ui/mode-selector'
import { EnhancedMessage } from '@/components/ui/enhanced-message'
import { ModelSelector } from '@/components/ui/ai-model-selector'
import { PollinationsModelSelector } from '@/components/ui/pollinations-model-selector'
import { ScrollButtons } from '@/components/ui/scroll-buttons'
import questAPI from '@/lib/quest-api-enhanced'

interface Message {
  id: string
  type: 'user' | 'ai' | 'image' | 'web'
  content: string
  htmlContent?: string // For formatted HTML content
  timestamp: Date
  imageUrl?: string
  isGenerating?: boolean
  audioUrl?: string
}

interface ChatInterfaceProps {
  className?: string
  initialQuery?: string
  initialResponse?: any
}

export function ChatInterface({ className = '', initialQuery, initialResponse }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  
  // Add initial message when provided
  useEffect(() => {
    if (initialQuery && initialResponse && messages.length === 0) {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: initialQuery,
        timestamp: new Date()
      }
      
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: initialResponse.response || initialResponse.output || 'Sorry, I couldn\'t process your request.',
        htmlContent: initialResponse.htmlOutput,
        timestamp: new Date()
      }
      
      setMessages([userMessage, aiMessage])
    }
  }, [initialQuery, initialResponse, messages.length])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentMode, setCurrentMode] = useState<'ai' | 'web' | 'voice' | 'image'>('ai')
  const [currentModel, setCurrentModel] = useState<'azure' | 'pollinations-openai'>('azure')
  const [pollinationsModel, setPollinationsModel] = useState<string>('llama-fast-roblox')
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  
  const { searchSettings, voiceSettings } = useSettings()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Detect message type from input
  const detectMessageType = (text: string): 'ai' | 'web' | 'image' => {
    const lowerText = text.toLowerCase()
    if (searchSettings.imageGeneration && 
        (lowerText.includes('generate') || lowerText.includes('create') || 
         lowerText.includes('draw') || lowerText.includes('make'))) {
      return 'image'
    }
    if (searchSettings.webEnabled && 
        (lowerText.includes('search') || lowerText.includes('latest') || 
         lowerText.includes('news') || lowerText.includes('recent'))) {
      return 'web'
    }
    return 'ai'
  }

  // Handle message send
  const handleSend = async () => {
    if (!input.trim() || isProcessing) return

    const messageType = detectMessageType(input)
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsProcessing(true)

    // Create AI response placeholder
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: messageType,
      content: '',
      timestamp: new Date(),
      isGenerating: true
    }

    setMessages(prev => [...prev, aiMessage])

    try {
      if (messageType === 'image') {
        await handleImageGeneration(userMessage.content, aiMessage.id)
      } else if (messageType === 'web') {
        await handleWebSearch(userMessage.content, aiMessage.id)
      } else {
        await handleAIChat(userMessage.content, aiMessage.id)
      }
    } catch (error) {
      console.error('Error processing message:', error)
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessage.id 
          ? { ...msg, content: 'Sorry, something went wrong. Please try again.', isGenerating: false }
          : msg
      ))
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle AI chat
  const handleAIChat = async (content: string, messageId: string) => {
    try {
      let response: any
      
      if (currentModel === 'pollinations-openai') {
        // Use enhanced API for chat
        const messages: Array<{role: 'user' | 'system' | 'assistant', content: string}> = [
          { role: 'system', content: 'You are a helpful AI assistant.' },
          { role: 'user', content }
        ]
        
        response = await questAPI.sendMessage(messages)
        
        if (!response || !response.output) {
          console.error('Invalid response from API:', response)
          setMessages(prev => prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, content: 'Sorry, I encountered an error. Please try again.', isGenerating: false }
              : msg
          ))
          return
        }
        
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                content: response.output, 
                htmlContent: response.htmlOutput,
                isGenerating: false 
              }
            : msg
        ))
      } else {
        // Use enhanced API for chat completion
        response = await questAPI.sendMessage([
          { role: 'user', content }
        ])
        
        if (!response || !response.output) {
          console.error('Invalid response from API:', response)
          setMessages(prev => prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, content: 'Sorry, I encountered an error. Please try again.', isGenerating: false }
              : msg
          ))
          return
        }
        
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                content: response.output, 
                htmlContent: response.htmlOutput,
                isGenerating: false 
              }
            : msg
        ))
      }

      // Generate audio if voice is enabled
      if (voiceSettings.enabled && response.output) {
        generateAudioResponse(response.output, messageId)
      }
    } catch (error) {
      console.error('AI chat error:', error)
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: 'Sorry, I encountered an error. Please try again.', isGenerating: false }
          : msg
      ))
    }
  }

  // Handle web search
  const handleWebSearch = async (content: string, messageId: string) => {
    try {
      const response = await questAPI.searchWeb({ 
        query: content,
        num_results: 10
      })
      
      // Get AI summary of search results
      const summaryResponse = await questAPI.sendMessage([
        { role: 'user', content: `Summarize these search results for: ${content}\n\nResults: ${response.results.map(r => `${r.title}: ${r.snippet}`).join('\n')}` }
      ])
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              content: summaryResponse.output || response.insights || 'Here are the search results.',
              isGenerating: false 
            }
          : msg
      ))
    } catch (error) {
      throw error
    }
  }

  // Handle image generation
  const handleImageGeneration = async (content: string, messageId: string) => {
    try {
      // Update message to show generating state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: 'Generating your image...', isGenerating: true }
          : msg
      ))

      const response = await questAPI.generateImage({
        prompt: content,
        width: 1024,
        height: 768,
        enhance: true
      })
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              content: 'Image generated successfully!',
              imageUrl: response.imageUrl,
              isGenerating: false 
            }
          : msg
      ))
    } catch (error) {
      throw error
    }
  }

  // Generate audio response
  const generateAudioResponse = async (text: string, messageId: string) => {
    try {
      const response = await questAPI.synthesizeSpeech({
        text,
        voice: voiceSettings.voice || 'alloy',
        language: voiceSettings.language || 'en'
      })
      
      if (response.audioUrl) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, audioUrl: response.audioUrl }
            : msg
        ))
      }
    } catch (error) {
      console.error('Audio generation failed:', error)
    }
  }

  // Handle voice input
  const toggleVoiceInput = async () => {
    if (isVoiceActive) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
      }
      setIsVoiceActive(false)
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        
        const audioChunks: Blob[] = []
        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data)
        }
        
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
          const audioFile = new File([audioBlob], 'voice.webm', { type: 'audio/webm' })
          
          try {
            const response = await questAPI.transcribeAudio(audioFile)
            if (response && response.text) {
              setInput(response.text)
            }
          } catch (error) {
            console.error('Speech recognition failed:', error)
          }
          
          stream.getTracks().forEach(track => track.stop())
        }
        
        mediaRecorder.start()
        setIsVoiceActive(true)
      } catch (error) {
        console.error('Voice input failed:', error)
      }
    }
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Play audio message
  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl)
    audio.play()
  }

  return (
    <div className={`chat-interface flex flex-col h-full ${className}`}>
      {/* Mode and Model Selectors - Fixed at top */}
      <div className="flex justify-center items-center gap-4 py-4 border-b border-white/10">
        <ModeSelector 
          currentMode={currentMode}
          onModeChange={setCurrentMode}
        />
        {currentMode === 'ai' && (
          <ModelSelector
            currentModel={currentModel}
            onModelChange={setCurrentModel}
            className="w-48"
          />
        )}
        {currentModel === 'pollinations-openai' && (
            <PollinationsModelSelector
              selectedModel={pollinationsModel}
              onModelSelect={setPollinationsModel}
              className="w-48"
            />
        )}
      </div>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-6"
      >
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                transition: {
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                  mass: 0.5
                }
              }}
              exit={{ 
                opacity: 0, 
                y: -20, 
                scale: 0.95,
                transition: { duration: 0.2 }
              }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${
                message.type === 'user' 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-white/5 backdrop-blur-sm border border-white/10'
              } rounded-2xl px-4 py-3 relative`}>
                
                {/* Message content */}
                <div className="space-y-3">
                  {message.content && (
                    <EnhancedMessage 
                      content={message.content}
                      htmlContent={message.htmlContent}
                      className="text-sm leading-relaxed"
                    />
                  )}
                  
                  {/* Image display */}
                  {message.imageUrl && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-lg overflow-hidden"
                    >
                      <img 
                        src={message.imageUrl} 
                        alt="Generated image"
                        className="w-full max-w-sm object-cover"
                      />
                    </motion.div>
                  )}

                  {/* Loading animation for generating messages */}
                  {message.isGenerating && (
                    <div className="flex items-center space-x-2">
                      {message.type === 'image' ? (
                        <motion.div
                          className="flex space-x-1"
                          animate={{
                            background: [
                              'linear-gradient(45deg, #3b82f6, #8b5cf6)',
                              'linear-gradient(45deg, #8b5cf6, #ec4899)',
                              'linear-gradient(45deg, #ec4899, #f59e0b)',
                              'linear-gradient(45deg, #f59e0b, #10b981)',
                              'linear-gradient(45deg, #10b981, #3b82f6)'
                            ]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {[...Array(4)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="w-3 h-3 bg-current rounded-full"
                              animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.5, 1, 0.5]
                              }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: i * 0.2
                              }}
                            />
                          ))}
                        </motion.div>
                      ) : (
                        <div className="flex space-x-1">
                          {[...Array(3)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 bg-primary-400 rounded-full"
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 1, 0.5]
                              }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: i * 0.2
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Audio player */}
                  {message.audioUrl && message.type !== 'user' && (
                    <button
                      onClick={() => playAudio(message.audioUrl!)}
                      className="flex items-center space-x-2 text-xs opacity-70 hover:opacity-100 transition-opacity"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Play audio</span>
                    </button>
                  )}
                </div>

                {/* Message type indicator */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-white/10 flex items-center justify-center">
                  {message.type === 'image' && <ImageIcon className="w-3 h-3 text-purple-400" />}
                  {message.type === 'web' && <Globe className="w-3 h-3 text-blue-400" />}
                  {message.type === 'ai' && <Brain className="w-3 h-3 text-green-400" />}
                  {message.type === 'user' && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <motion.div 
        className="border-t border-white/10 p-4"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex items-end space-x-3">
          {/* Voice button */}
          <motion.button
            onClick={toggleVoiceInput}
            disabled={!voiceSettings.enabled}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-3 rounded-full transition-all duration-300 ${
              isVoiceActive 
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/25' 
                : voiceSettings.enabled
                  ? 'bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-primary-400'
                  : 'bg-white/5 text-muted-foreground/50 cursor-not-allowed'
            }`}
          >
            <motion.div
              animate={isVoiceActive ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Mic className="w-5 h-5" />
            </motion.div>
          </motion.button>

          {/* Input field */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Message Quest.io... (Shift+Enter for new line)"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 pr-12 resize-none outline-none focus:border-primary-500/50 transition-all duration-300 text-sm leading-relaxed max-h-32"
              rows={1}
              style={{
                minHeight: '44px',
                height: Math.min(input.split('\n').length * 20 + 24, 128) + 'px'
              }}
            />
            
            {/* Send button */}
            <motion.button
              onClick={handleSend}
              disabled={!input.trim() || isProcessing}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="absolute right-2 bottom-2 p-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-300"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Voice indicator */}
        <AnimatePresence>
          {isVoiceActive && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex flex-col items-center mt-3 space-y-3"
            >
              {/* Fluid wave animation */}
              <div className="relative w-64 h-16 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-full overflow-hidden">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute bottom-0 bg-gradient-to-t from-red-500 to-pink-500 rounded-t-full"
                    style={{
                      left: `${i * 20}%`,
                      width: '20%'
                    }}
                    animate={{
                      height: ['20%', '80%', '20%'],
                      opacity: [0.3, 1, 0.3]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: 'easeInOut'
                    }}
                  />
                ))}
                
                {/* Floating particles */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={`particle-${i}`}
                    className="absolute w-2 h-2 bg-red-400 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`
                    }}
                    animate={{
                      y: [-10, -30, -10],
                      opacity: [0, 1, 0],
                      scale: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: 'easeInOut'
                    }}
                  />
                ))}
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-red-400">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-2 h-2 bg-red-400 rounded-full"
                />
                <span>Listening... Speak now</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Scroll Buttons */}
      <ScrollButtons 
        scrollContainerRef={messagesContainerRef}
        className="bottom-24" // Position above the input area
      />
    </div>
  )
}

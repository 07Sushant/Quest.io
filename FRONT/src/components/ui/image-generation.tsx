'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image, Download, Loader2, Sparkles, Zap, Palette, Settings, X } from 'lucide-react'
import questAPI from '@/lib/quest-api-enhanced'
import { useSettings } from '@/lib/hooks/use-settings'

interface ImageGenerationProps {
  prompt: string
  onImageGenerated?: (imageUrl: string) => void
  onClose?: () => void
  className?: string
}

interface GenerationProgress {
  stage: string
  progress: number
  message: string
}

export function ImageGeneration({ prompt, onImageGenerated, onClose, className = '' }: ImageGenerationProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [progress, setProgress] = useState<GenerationProgress>({
    stage: 'initializing',
    progress: 0,
    message: 'Preparing to generate...'
  })
  const [selectedModel, setSelectedModel] = useState('flux')
  const [selectedSize, setSelectedSize] = useState('1024x1024')
  const [enhancedPrompt, setEnhancedPrompt] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  
  const { searchSettings } = useSettings()
  const abortControllerRef = useRef<AbortController | null>(null)

  // Available models
  const models = [
    { id: 'flux', name: 'Flux', description: 'High-quality, versatile', icon: Sparkles },
    { id: 'turbo', name: 'Turbo', description: 'Fast generation', icon: Zap },
    { id: 'artistic', name: 'Artistic', description: 'Creative, stylized', icon: Palette }
  ]

  // Available sizes
  const sizes = [
    { id: '512x512', name: '512×512', aspect: 'Square' },
    { id: '768x768', name: '768×768', aspect: 'Square HD' },
    { id: '1024x1024', name: '1024×1024', aspect: 'Square Full' },
    { id: '1024x768', name: '1024×768', aspect: 'Landscape' },
    { id: '768x1024', name: '768×1024', aspect: 'Portrait' },
    { id: '1280x720', name: '1280×720', aspect: 'Widescreen' }
  ]

  // Enhance prompt on component mount
  useEffect(() => {
    if (prompt && searchSettings.imageGeneration) {
      enhancePrompt()
    }
  }, [prompt, searchSettings.imageGeneration])

  // Enhance the prompt
  const enhancePrompt = async () => {
    try {
      const response = await questAPI.enhancePrompt(prompt)
      if (response.enhancedPrompt) {
        setEnhancedPrompt(response.enhancedPrompt)
      } else {
        setEnhancedPrompt(prompt)
      }
    } catch (error) {
      console.error('Failed to enhance prompt:', error)
      setEnhancedPrompt(prompt)
    }
  }

  // Start image generation
  const generateImage = async () => {
    if (!searchSettings.imageGeneration || isGenerating) return

    setIsGenerating(true)
    setGeneratedImage(null)
    abortControllerRef.current = new AbortController()

    try {
      const [width, height] = selectedSize.split('x').map(Number)
      
      // Generate image using enhanced API
      const response = await questAPI.generateImage({
        prompt: enhancedPrompt || prompt,
        model: selectedModel,
        width,
        height,
        enhance: true,
        nologo: true
      })

      if (response.imageUrl) {
        setGeneratedImage(response.imageUrl)
        onImageGenerated?.(response.imageUrl)
        setProgress({
          stage: 'complete',
          progress: 100,
          message: 'Image generated successfully!'
        })
      } else {
        throw new Error('No image URL in response')
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Image generation failed:', error)
        setProgress({
          stage: 'error',
          progress: 0,
          message: error.message || 'Generation failed'
        })
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // Cancel generation
  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsGenerating(false)
  }

  // Download image
  const downloadImage = async () => {
    if (!generatedImage) return

    try {
      const response = await fetch(generatedImage)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `quest-ai-image-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download image:', error)
    }
  }

  // Progress animation variants
  const progressVariants = {
    initial: { width: '0%' },
    animate: { width: `${progress.progress}%` }
  }

  // Liquid animation for generation
  const liquidVariants = {
    animate: {
      background: [
        'linear-gradient(45deg, #3b82f6, #8b5cf6)',
        'linear-gradient(45deg, #8b5cf6, #ec4899)',
        'linear-gradient(45deg, #ec4899, #f59e0b)',
        'linear-gradient(45deg, #f59e0b, #10b981)',
        'linear-gradient(45deg, #10b981, #3b82f6)'
      ],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  }

  if (!searchSettings.imageGeneration) {
    return null
  }

  return (
    <div className={`image-generation ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-2xl w-full"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-500/20 rounded-lg">
              <Image className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">AI Image Generation</h3>
              <p className="text-sm text-muted-foreground">
                {isGenerating ? 'Generating your image...' : 'Create stunning visuals from text'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Model Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Model</label>
                  <div className="space-y-2">
                    {models.map((model) => {
                      const Icon = model.icon
                      return (
                        <button
                          key={model.id}
                          onClick={() => setSelectedModel(model.id)}
                          className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors text-left ${
                            selectedModel === model.id
                              ? 'border-primary-500 bg-primary-500/10'
                              : 'border-white/10 hover:border-white/20'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <div>
                            <p className="font-medium">{model.name}</p>
                            <p className="text-xs text-muted-foreground">{model.description}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Size Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Size</label>
                  <div className="space-y-1">
                    {sizes.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setSelectedSize(size.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg border transition-colors text-left text-sm ${
                          selectedSize === size.id
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <span>{size.name}</span>
                        <span className="text-xs text-muted-foreground">{size.aspect}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prompt Display */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            {enhancedPrompt ? 'Enhanced Prompt' : 'Original Prompt'}
          </label>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <p className="text-sm">{enhancedPrompt || prompt}</p>
          </div>
        </div>

        {/* Generation Area */}
        <div className="mb-6">
          {!generatedImage && !isGenerating && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Image className="w-8 h-8 text-white" />
              </div>
              <p className="text-muted-foreground mb-4">Ready to create your image</p>
              <button
                onClick={generateImage}
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium"
              >
                Generate Image
              </button>
            </div>
          )}

          {/* Generation Progress */}
          {isGenerating && (
            <div className="text-center py-12">
              <div className="relative w-24 h-24 mx-auto mb-6">
                {/* Liquid animation background */}
                <motion.div
                  variants={liquidVariants}
                  animate="animate"
                  className="absolute inset-0 rounded-full opacity-60"
                />
                
                {/* Progress ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="rgba(59,130,246,0.8)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: progress.progress / 100 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    style={{
                      pathLength: progress.progress / 100,
                      strokeDasharray: '251.2 251.2'
                    }}
                  />
                </svg>
                
                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="font-medium">{progress.message}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {progress.stage} • {Math.round(progress.progress)}%
                </p>
                
                {/* Progress bar */}
                <div className="w-64 mx-auto h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    variants={progressVariants}
                    animate="animate"
                    className="h-full bg-gradient-to-r from-primary-500 to-purple-600"
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                  />
                </div>
                
                <button
                  onClick={cancelGeneration}
                  className="mt-4 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel Generation
                </button>
              </div>
            </div>
          )}

          {/* Generated Image */}
          {generatedImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="relative inline-block rounded-xl overflow-hidden shadow-2xl">
                <img
                  src={generatedImage}
                  alt="Generated image"
                  className="max-w-full max-h-96 object-contain"
                />
                
                {/* Download overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={downloadImage}
                    className="flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-center space-x-4">
                <button
                  onClick={generateImage}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                >
                  Generate Another
                </button>
                <button
                  onClick={downloadImage}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Download
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

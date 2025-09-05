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
  const [selectedSize, setSelectedSize] = useState('1024x768')
  const [enhancedPrompt, setEnhancedPrompt] = useState('')
  const [isEnhancing, setIsEnhancing] = useState(false)
  
  const { searchSettings } = useSettings()
  const abortControllerRef = useRef<AbortController | null>(null)

  const models = [
    { id: 'flux', name: 'Flux', description: 'High quality, fast generation' },
    { id: 'turbo', name: 'Turbo', description: 'Ultra-fast generation' },
    { id: 'flux-realism', name: 'Flux Realism', description: 'Photorealistic images' },
    { id: 'flux-anime', name: 'Flux Anime', description: 'Anime-style images' }
  ]

  const sizes = [
    { id: '512x512', name: 'Square (512x512)', aspect: '1:1' },
    { id: '768x512', name: 'Landscape (768x512)', aspect: '3:2' },
    { id: '512x768', name: 'Portrait (512x768)', aspect: '2:3' },
    { id: '1024x768', name: 'HD Landscape (1024x768)', aspect: '4:3' },
    { id: '768x1024', name: 'HD Portrait (768x1024)', aspect: '3:4' },
    { id: '1536x1024', name: 'Wide (1536x1024)', aspect: '3:2' }
  ]

  // Auto-enhance prompt when component mounts
  useEffect(() => {
    if (prompt && searchSettings.imageGeneration) {
      enhancePrompt()
    }
  }, [prompt, searchSettings.imageGeneration])

  // Enhance the prompt
  const enhancePrompt = async () => {
    if (!prompt.trim()) return

    setIsEnhancing(true)
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
    } finally {
      setIsEnhancing(false)
    }
  }

  // Generate image
  const generateImage = async () => {
    if (!prompt.trim() || isGenerating) return

    setIsGenerating(true)
    setProgress({
      stage: 'generating',
      progress: 10,
      message: 'Starting image generation...'
    })

    try {
      const [width, height] = selectedSize.split('x').map(Number)
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
          message: prev.progress < 30 ? 'Processing prompt...' :
                   prev.progress < 60 ? 'Generating image...' :
                   'Finalizing...'
        }))
      }, 1000)

      // Generate image using enhanced API
      const response = await questAPI.generateImage({
        prompt: enhancedPrompt || prompt,
        model: selectedModel,
        width,
        height,
        enhance: true,
        nologo: true
      })

      clearInterval(progressInterval)

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
      console.error('Image generation failed:', error)
      setProgress({
        stage: 'error',
        progress: 0,
        message: error.message || 'Generation failed. Please try again.'
      })
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
    setProgress({
      stage: 'cancelled',
      progress: 0,
      message: 'Generation cancelled'
    })
  }

  // Download image
  const downloadImage = async () => {
    if (!generatedImage) return

    try {
      const response = await fetch(generatedImage)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `quest-generated-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to download image:', error)
    }
  }

  // Auto-generate when component mounts if prompt exists
  useEffect(() => {
    if (prompt && searchSettings.imageGeneration && !generatedImage) {
      generateImage()
    }
  }, [prompt, searchSettings.imageGeneration])

  if (!searchSettings.imageGeneration) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Image generation is disabled in settings</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <Image className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Image Generation</h3>
            <p className="text-sm text-gray-500">Create AI-generated images</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Prompt Display */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Original Prompt
          </label>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300">
            {prompt}
          </div>
        </div>

        {/* Enhanced Prompt */}
        {enhancedPrompt && enhancedPrompt !== prompt && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Enhanced Prompt {isEnhancing && <Loader2 className="w-4 h-4 animate-spin inline ml-2" />}
            </label>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-gray-700 dark:text-gray-300 border border-blue-200 dark:border-blue-800">
              {enhancedPrompt}
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={isGenerating}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name} - {model.description}
                </option>
              ))}
            </select>
          </div>

          {/* Size Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Size
            </label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              disabled={isGenerating}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {sizes.map(size => (
                <option key={size.id} value={size.id}>
                  {size.name} ({size.aspect})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Progress Bar */}
        {isGenerating && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {progress.message}
              </span>
              <span className="text-sm text-gray-500">
                {progress.progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-pink-500 to-purple-600"
                initial={{ width: '0%' }}
                animate={{ width: `${progress.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Generated Image */}
        <AnimatePresence>
          {generatedImage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="relative group">
                <img
                  src={generatedImage}
                  alt="Generated image"
                  className="w-full rounded-lg shadow-lg"
                  onLoad={() => setProgress(prev => ({ ...prev, stage: 'complete' }))}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <button
                    onClick={downloadImage}
                    className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isGenerating ? (
            <button
              onClick={generateImage}
              disabled={!prompt.trim()}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {generatedImage ? 'Regenerate' : 'Generate Image'}
            </button>
          ) : (
            <button
              onClick={cancelGeneration}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          )}

          {!isEnhancing && (
            <button
              onClick={enhancePrompt}
              disabled={!prompt.trim() || isGenerating}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Enhance
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

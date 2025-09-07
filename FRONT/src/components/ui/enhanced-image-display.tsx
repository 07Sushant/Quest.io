'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Download,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react'

interface EnhancedImageDisplayProps {
  imageUrl: string
  prompt: string
  originalInput?: string
  dimensions?: { width: number; height: number }
  className?: string
  showControls?: boolean
  autoPreview?: boolean
}

export function EnhancedImageDisplay({
  imageUrl,
  prompt,
  originalInput,
  dimensions,
  className = '',
  showControls = true,
  autoPreview = true
}: EnhancedImageDisplayProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showFullSize, setShowFullSize] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [previewVisible] = useState(true) // Always show preview
  
  const getFullImageUrl = (url: string) => {
    if (url.startsWith('http')) return url
    // If URL starts with '/', treat as absolute path on same origin and do not prepend base
    if (url.startsWith('/')) return url
    // Otherwise, prepend API base for relative paths like 'image-enhanced/serve/...'
    const API_BASE_URL = process.env.NODE_ENV === 'production' 
      ? '/api'
      : 'http://localhost:3001/api'
    return `${API_BASE_URL}/${url}`
  }

  const fullImageUrl = getFullImageUrl(imageUrl)
  const imageRef = useRef<HTMLImageElement>(null)

  const handleImageLoad = () => {
    setImageLoaded(true)
    setImageError(false)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(false)
  }

  // Open image in a new tab instead of downloading
  const openImageInNewTab = useCallback(() => {
    if (!fullImageUrl) return
    window.open(fullImageUrl, '_blank')
  }, [fullImageUrl])

  return (
    <div className={`enhanced-image-display ${className}`}>
      {/* Image Container */}
      <motion.div
        className="relative overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        {/* Main Image */}
        {previewVisible && (
          <div className="relative">
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            )}
            
            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Failed to load image</p>
                </div>
              </div>
            )}
            
            <motion.img
              ref={imageRef}
              src={fullImageUrl}
              alt={prompt}
              className={`w-full h-auto transition-transform duration-300 ${
                isHovered ? 'scale-105' : 'scale-100'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ display: imageError ? 'none' : 'block' }}
            />
          </div>
        )}
      </motion.div>

      {/* Image Info */}
      <div className="mt-4 space-y-2">
        {/* Prompt Display */}
        <div className="text-sm">
          <p className="font-medium text-gray-900 dark:text-white">Generated Image</p>
          <p className="text-gray-600 dark:text-gray-400 italic">"{prompt}"</p>
          {originalInput && originalInput !== prompt && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Original: "{originalInput}"
            </p>
          )}
        </div>
        
        {/* Dimensions */}
        {dimensions && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {dimensions.width} × {dimensions.height} pixels
          </div>
        )}
        
        {/* Controls: Only a small icon that opens the image in a new tab */}
        {showControls && (
          <div className="flex items-center justify-end">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openImageInNewTab}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Open in new tab"
            >
              <Download className="w-4 h-4" />
            </motion.button>
          </div>
        )}
      </div>

      {/* Full Size Modal (kept in case it's triggered elsewhere) */}
      <AnimatePresence>
        {showFullSize && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setShowFullSize(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-screen-lg max-h-screen-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={fullImageUrl}
                alt={prompt}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              
              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowFullSize(false)}
                className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

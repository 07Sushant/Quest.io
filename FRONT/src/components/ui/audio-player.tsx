'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Download, Volume2, Loader2 } from 'lucide-react'

interface AudioPlayerProps {
  audioData: string
  contentType?: string
  text: string
  className?: string
  autoPlay?: boolean
  onPlayStart?: () => void
  onPlayEnd?: () => void
}

export function AudioPlayer({
  audioData,
  contentType = 'audio/mpeg',
  text,
  className = '',
  autoPlay = false,
  onPlayStart,
  onPlayEnd
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioSrc, setAudioSrc] = useState<string>('')
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (audioData) {
      // Convert base64 to audio URL
      const byteCharacters = atob(audioData)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: contentType })
      const url = URL.createObjectURL(blob)
      setAudioSrc(url)

      // Auto play if enabled
      if (autoPlay && audioRef.current) {
        setTimeout(() => {
          handlePlay()
        }, 500)
      }

      return () => {
        URL.revokeObjectURL(url)
      }
    }
  }, [audioData, contentType, autoPlay])

  const handlePlay = async () => {
    if (!audioRef.current) return

    setIsLoading(true)
    onPlayStart?.()

    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        await audioRef.current.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error('Audio play error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (audioSrc) {
      const link = document.createElement('a')
      link.href = audioSrc
      link.download = `speech-${Date.now()}.mp3`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
    onPlayEnd?.()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!audioData) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`audio-player bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-xl p-4 ${className}`}
    >
      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      <div className="flex items-center space-x-4">
        {/* Play/Pause Button */}
        <motion.button
          onClick={handlePlay}
          disabled={isLoading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-full shadow-lg transition-all duration-200"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </motion.button>

        {/* Audio Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <Volume2 className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-foreground">
              Audio Response
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
            <motion.div
              className="bg-gradient-to-r from-orange-500 to-yellow-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
              transition={{ duration: 0.1 }}
            />
          </div>

          {/* Time Display */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Download Button */}
        <motion.button
          onClick={handleDownload}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg transition-all duration-200"
          title="Download audio"
        >
          <Download className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Text Preview */}
      {text && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ delay: 0.2 }}
          className="mt-3 pt-3 border-t border-orange-500/20"
        >
          <p className="text-sm text-muted-foreground italic">
            &quot;{text.length > 100 ? text.substring(0, 100) + '...' : text}&quot;
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}

export default AudioPlayer

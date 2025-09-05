'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Volume2, VolumeX, Loader2, Play, Pause, Square } from 'lucide-react'
import questAPI from '@/lib/quest-api-new'
import { useSettings } from '@/lib/hooks/use-settings'

interface VoiceInterfaceProps {
  onVoiceInput?: (text: string) => void
  onVoiceResponse?: (audioData: string) => void
  className?: string
}

export function VoiceInterface({ onVoiceInput, onVoiceResponse, className = '' }: VoiceInterfaceProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [recordingTime, setRecordingTime] = useState(0)
  const [transcription, setTranscription] = useState('')
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const animationRef = useRef<number | null>(null)
  
  const { voiceSettings } = useSettings()

  // Initialize audio context and check permissions
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
        setVoiceEnabled(true)
        
        // Initialize audio context for visualizations
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (error) {
        console.error('Microphone access denied:', error)
        setVoiceEnabled(false)
      }
    }

    initializeAudio()

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Audio level visualization
  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return

    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyserRef.current.getByteFrequencyData(dataArray)

    let sum = 0
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i]
    }
    const average = sum / bufferLength
    setAudioLevel(Math.min(average / 128, 1))

    if (isRecording) {
      animationRef.current = requestAnimationFrame(updateAudioLevel)
    }
  }, [isRecording])

  // Start recording
  const startRecording = async () => {
    if (!voiceEnabled || !voiceSettings.enabled) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      })
      
      micStreamRef.current = stream
      
      // Setup audio analyzer for visualization
      if (audioContextRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream)
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 256
        source.connect(analyserRef.current)
        updateAudioLevel()
      }

      // Setup media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await processAudioInput(audioBlob)
        
        // Cleanup
        stream.getTracks().forEach(track => track.stop())
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
      }

      setIsRecording(true)
      setRecordingTime(0)
      mediaRecorder.start()

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setAudioLevel(0)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  // Process audio input
  const processAudioInput = async (audioBlob: Blob) => {
    setIsProcessing(true)
    setTranscription('')
    
    try {
      // Convert to file
      const audioFile = new File([audioBlob], 'voice_input.webm', { type: 'audio/webm' })
      
      // Process voice input (STT + AI + TTS)
      const response = await questAPI.processVoice(audioFile, {
        voice: voiceSettings.voice,
        language: voiceSettings.language
      })

      if (response.data) {
        // Update transcription
        if (response.data.transcription) {
          setTranscription(response.data.transcription)
          onVoiceInput?.(response.data.transcription)
        }

        // Play AI response if available
        if (response.data.audioData) {
          await playAudioResponse(response.data.audioData)
          onVoiceResponse?.(response.data.audioData)
        }
      }
    } catch (error) {
      console.error('Failed to process voice input:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Play audio response
  const playAudioResponse = async (audioData: string) => {
    try {
      const audio = new Audio(`data:audio/wav;base64,${audioData}`)
      audioRef.current = audio
      
      audio.onplay = () => setIsPlaying(true)
      audio.onended = () => setIsPlaying(false)
      audio.onerror = () => setIsPlaying(false)
      
      await audio.play()
    } catch (error) {
      console.error('Failed to play audio response:', error)
      setIsPlaying(false)
    }
  }

  // Stop audio playback
  const stopAudioPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Audio level visualization rings
  const getAudioLevelRings = () => {
    const rings = []
    for (let i = 0; i < 3; i++) {
      const scale = 1 + (audioLevel * 0.5 * (i + 1))
      const opacity = audioLevel * 0.3 * (3 - i)
      rings.push(
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border-2 border-primary-400"
          style={{
            transform: `scale(${scale})`,
            opacity
          }}
        />
      )
    }
    return rings
  }

  if (!voiceEnabled || !voiceSettings.enabled) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="text-center text-muted-foreground">
          <MicOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Voice input disabled</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`voice-interface ${className}`}>
      {/* Voice Control Button */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          {/* Audio level rings */}
          {isRecording && (
            <div className="absolute inset-0 -m-4">
              {getAudioLevelRings()}
            </div>
          )}
          
          {/* Main voice button */}
          <motion.button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25'
                : 'bg-primary-500 hover:bg-primary-600 shadow-lg shadow-primary-500/25'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isProcessing ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : isRecording ? (
              <Square className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </motion.button>
        </div>

        {/* Recording timer */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center space-x-2 text-sm text-muted-foreground"
            >
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span>Recording: {formatTime(recordingTime)}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Audio playback controls */}
        <AnimatePresence>
          {isPlaying && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center space-x-3"
            >
              <button
                onClick={stopAudioPlayback}
                className="flex items-center space-x-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <VolumeX className="w-4 h-4" />
                <span className="text-sm">Stop</span>
              </button>
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Volume2 className="w-4 h-4" />
                <span>Playing response...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing status */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="text-center"
            >
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground mb-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing voice input...</span>
              </div>
              <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary-500"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transcription display */}
        <AnimatePresence>
          {transcription && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="max-w-md p-3 bg-white/5 border border-white/10 rounded-lg"
            >
              <p className="text-sm text-muted-foreground mb-1">You said:</p>
              <p className="text-sm">{transcription}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions */}
        {!isRecording && !isProcessing && !transcription && (
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Tap and hold to record</p>
            <p className="text-xs opacity-70">Voice: {voiceSettings.voice}</p>
          </div>
        )}
      </div>
    </div>
  )
}

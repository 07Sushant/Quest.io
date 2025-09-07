"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, X } from 'lucide-react'

interface GeminiVoiceModalProps {
  open: boolean
  onClose: () => void
}

export default function GeminiVoiceModal({ open, onClose }: GeminiVoiceModalProps) {
  const [connected, setConnected] = useState(false)
  const [inCall, setInCall] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [micLevel, setMicLevel] = useState(0)
  const [aiSpeaking, setAiSpeaking] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const playingRef = useRef(false)

  // Connect WS when modal opens
  useEffect(() => {
    if (!open) {
      cleanup()
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const host = window.location.hostname
    const port = window.location.port || (protocol === 'wss' ? '443' : '80')
    const backendPort = host === 'localhost' || host === '127.0.0.1' ? '3001' : port
    const wsUrl = `${protocol}://${host}:${backendPort}/ws/gemini-voice`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = (e) => { console.warn('WS closed', e.code, e.reason); setConnected(false); stopCall(); }
    ws.onerror = (e) => { console.error('WS error', e); setConnected(false) }

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data?.type === 'status') return
        // Try parse audio payload location; fallback ignore
        const candidate = data?.candidates?.[0]
        const part = candidate?.content?.parts?.[0]
        const base64 = part?.audioData?.data || part?.inlineData?.data
        const mime = part?.audioData?.mimeType || part?.inlineData?.mimeType || 'audio/mp3'
        if (base64) {
          setAiSpeaking(true)
          const audio = new Audio(`data:${mime};base64,${base64}`)
          audio.volume = volume
          audio.onended = () => setAiSpeaking(false)
          try { await audio.play() } catch {}
        }
      } catch {
        // Not JSON or different shape; ignore
      }
    }

    // Note: avoid auto-closing in effect cleanup to prevent StrictMode double-invoke races
    // Cleanup is handled when modal actually closes via `cleanup()`
    // return () => {
    //   try { ws.close() } catch {}
    // }
  }, [open, volume])

  const startCall = useCallback(async () => {
    if (!connected || inCall) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      micStreamRef.current = stream
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 })
      audioCtxRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      sourceRef.current = source
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      // Load AudioWorklet processor and stream PCM16 frames via port
      try {
        await audioCtx.audioWorklet.addModule('/audio-worklet/mic-processor.js')
      } catch (err) {
        console.error('Failed to load AudioWorklet module', err)
        throw err
      }
      const workletNode = new (window as any).AudioWorkletNode(audioCtx, 'mic-processor') as AudioWorkletNode
      // Forward PCM16 buffers as base64 to backend
      workletNode.port.onmessage = (event) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
        if (muted) return
        const buf = event.data as ArrayBuffer
        const b64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(buf)) as any))
        wsRef.current.send(JSON.stringify({ media: { data: b64, mimeType: 'audio/pcm;rate=16000' } }))
      }

      source.connect(workletNode)
      // Do not connect to destination to avoid echo
      // workletNode.connect(audioCtx.destination)

      // mic visualization
      const buf = new Uint8Array(analyser.frequencyBinCount)
      const raf = () => {
        if (!inCall) return
        analyser.getByteFrequencyData(buf)
        let sum = 0
        for (let i = 0; i < buf.length; i++) sum += buf[i]
        setMicLevel(Math.min(sum / buf.length / 128, 1))
        requestAnimationFrame(raf)
      }
      setInCall(true)
      requestAnimationFrame(raf)

      // Send initial system instruction
      wsRef.current?.send(JSON.stringify({
        contents: { role: 'user', parts: [{ text: 'You are a helpful voice assistant.' }] },
        generationConfig: { stopSequences: ['user_says'] }
      }))
    } catch (e) {
      console.error('Failed to start call', e)
    }
  }, [connected, inCall, muted])

  const stopCall = useCallback(() => {
    setInCall(false)
    setAiSpeaking(false)
    if (processorRef.current) { try { processorRef.current.disconnect() } catch {} }
    if (sourceRef.current) { try { sourceRef.current.disconnect() } catch {} }
    if (audioCtxRef.current) { try { audioCtxRef.current.close() } catch {} }
    if (micStreamRef.current) { try { micStreamRef.current.getTracks().forEach(t => t.stop()) } catch {} }
  }, [])

  const cleanup = useCallback(() => {
    stopCall()
    try { wsRef.current?.close() } catch {}
    wsRef.current = null
  }, [stopCall])

  useEffect(() => {
    if (!open) cleanup()
  }, [open, cleanup])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 30, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 30, scale: 0.95, opacity: 0 }}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-foreground/[0.06] dark:bg-white/10 p-5 relative"
          >
            {/* Close */}
            <button onClick={onClose} className="absolute top-3 right-3 p-2 bg-white/10 rounded-full"><X className="w-4 h-4" /></button>

            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">Quest Call</h3>
              <p className="text-xs opacity-70">{connected ? 'Connected' : 'Connecting...'}</p>
            </div>

            {/* Mic visualization */}
            <div className="relative mx-auto mb-6 w-32 h-32">
              <div className="absolute inset-0 rounded-full border border-white/20" />
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30"
                animate={{ scale: 1 + micLevel * 0.4, opacity: 0.6 + micLevel * 0.3 }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              />
              <div className="absolute inset-4 rounded-full bg-black/40 flex items-center justify-center">
                {inCall ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />}
              </div>
            </div>

            {/* AI speaking indicator */}
            {aiSpeaking && (
              <div className="flex items-center justify-center text-xs mb-3 opacity-80">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                AI speaking...
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              {!inCall ? (
                <button onClick={startCall} className="px-4 py-2 rounded-xl bg-green-600 text-white flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Start Call
                </button>
              ) : (
                <button onClick={stopCall} className="px-4 py-2 rounded-xl bg-red-600 text-white flex items-center gap-2">
                  <PhoneOff className="w-4 h-4" /> End Call
                </button>
              )}

              <button onClick={() => setMuted(m => !m)} className="px-3 py-2 rounded-xl bg-white/10">
                {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10">
                <Volume2 className="w-4 h-4" />
                <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
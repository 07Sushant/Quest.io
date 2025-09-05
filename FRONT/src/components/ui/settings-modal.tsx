'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Settings, Globe, Mic, Image, Brain, Volume2, VolumeX } from 'lucide-react'
import questAPI from '@/lib/quest-api-new'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface VoiceSettings {
  enabled: boolean
  voice: string
  language: string
  speed: number
  pitch: number
}

interface SearchSettings {
  webEnabled: boolean
  aiOverview: boolean
  voiceMode: boolean
  imageGeneration: boolean
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState('search')
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    enabled: false,
    voice: 'meera',
    language: 'en-IN',
    speed: 1.0,
    pitch: 1.0
  })
  const [searchSettings, setSearchSettings] = useState<SearchSettings>({
    webEnabled: false,
    aiOverview: true,
    voiceMode: false,
    imageGeneration: true
  })
  const [voices, setVoices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Load settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedVoiceSettings = localStorage.getItem('quest_voice_settings')
      const savedSearchSettings = localStorage.getItem('quest_search_settings')
      
      if (savedVoiceSettings) {
        setVoiceSettings(JSON.parse(savedVoiceSettings))
      }
      if (savedSearchSettings) {
        setSearchSettings(JSON.parse(savedSearchSettings))
      }
    }
  }, [])

  // Load available voices
  useEffect(() => {
    const loadVoices = async () => {
      try {
        const voices = await questAPI.getVoices()
        if (voices && voices.length > 0) {
          setVoices(voices)
        } else {
          setVoices([
            { id: 'meera', name: 'Meera', gender: 'female' },
            { id: 'arjun', name: 'Arjun', gender: 'male' },
            { id: 'kavya', name: 'Kavya', gender: 'female' }
          ])
        }
      } catch (error) {
        console.error('Failed to load voices:', error)
        // Set default voices if API fails
        setVoices([
          { id: 'meera', name: 'Meera', gender: 'female' },
          { id: 'arjun', name: 'Arjun', gender: 'male' },
          { id: 'kavya', name: 'Kavya', gender: 'female' }
        ])
      }
    }

    if (isOpen) {
      loadVoices()
    }
  }, [isOpen])

  // Save settings to localStorage
  const saveSettings = () => {
    localStorage.setItem('quest_voice_settings', JSON.stringify(voiceSettings))
    localStorage.setItem('quest_search_settings', JSON.stringify(searchSettings))
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('settingsUpdated', {
      detail: { voiceSettings, searchSettings }
    }))
    
    onClose()
  }

  // Test voice
  const testVoice = async () => {
    if (!voiceSettings.enabled) return
    
    setLoading(true)
    try {
      const response = await questAPI.textToSpeech(
        'Hello! This is a voice test from Quest.io AI.',
        {
          voice: voiceSettings.voice,
          language: voiceSettings.language,
          speed: voiceSettings.speed,
          pitch: voiceSettings.pitch
        }
      )
      
      if (response.data && response.data.audioData) {
        // Play the audio
        const audio = new Audio(`data:audio/wav;base64,${response.data.audioData}`)
        audio.play()
      }
    } catch (error) {
      console.error('Voice test failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'search', label: 'Search', icon: Globe },
    { id: 'voice', label: 'Voice', icon: Mic },
    { id: 'image', label: 'Image', icon: Image },
    { id: 'ai', label: 'AI', icon: Brain }
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-500/20 rounded-lg">
                    <Settings className="w-5 h-5 text-primary-400" />
                  </div>
                  <h2 className="text-xl font-semibold">Quest.io Settings</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex">
                {/* Sidebar */}
                <div className="w-48 p-4 border-r border-white/10">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${
                          activeTab === tab.id
                            ? 'bg-primary-500/20 text-primary-400'
                            : 'hover:bg-white/5 text-muted-foreground'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{tab.label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Content */}
                <div className="flex-1 p-6 max-h-[60vh] overflow-y-auto">
                  {/* Search Settings */}
                  {activeTab === 'search' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium">Search Settings</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="font-medium">Web Search</label>
                            <p className="text-sm text-muted-foreground">
                              Enable real web search using SerpAPI (limited usage)
                            </p>
                          </div>
                          <button
                            onClick={() => setSearchSettings(prev => ({ ...prev, webEnabled: !prev.webEnabled }))}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              searchSettings.webEnabled ? 'bg-primary-500' : 'bg-gray-600'
                            }`}
                          >
                            <div
                              className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                                searchSettings.webEnabled ? 'translate-x-6' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <label className="font-medium">AI Overview</label>
                            <p className="text-sm text-muted-foreground">
                              Generate AI summaries of search results
                            </p>
                          </div>
                          <button
                            onClick={() => setSearchSettings(prev => ({ ...prev, aiOverview: !prev.aiOverview }))}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              searchSettings.aiOverview ? 'bg-primary-500' : 'bg-gray-600'
                            }`}
                          >
                            <div
                              className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                                searchSettings.aiOverview ? 'translate-x-6' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <label className="font-medium">Voice Mode</label>
                            <p className="text-sm text-muted-foreground">
                              Enable voice input and output
                            </p>
                          </div>
                          <button
                            onClick={() => setSearchSettings(prev => ({ ...prev, voiceMode: !prev.voiceMode }))}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              searchSettings.voiceMode ? 'bg-primary-500' : 'bg-gray-600'
                            }`}
                          >
                            <div
                              className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                                searchSettings.voiceMode ? 'translate-x-6' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <label className="font-medium">Image Generation</label>
                            <p className="text-sm text-muted-foreground">
                              Enable AI image generation from text prompts
                            </p>
                          </div>
                          <button
                            onClick={() => setSearchSettings(prev => ({ ...prev, imageGeneration: !prev.imageGeneration }))}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              searchSettings.imageGeneration ? 'bg-primary-500' : 'bg-gray-600'
                            }`}
                          >
                            <div
                              className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                                searchSettings.imageGeneration ? 'translate-x-6' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Voice Settings */}
                  {activeTab === 'voice' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Voice Settings</h3>
                        <button
                          onClick={testVoice}
                          disabled={!voiceSettings.enabled || loading}
                          className="flex items-center space-x-2 px-3 py-1 bg-primary-500/20 text-primary-400 rounded-lg disabled:opacity-50"
                        >
                          {loading ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          <span className="text-sm">Test Voice</span>
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="font-medium">Enable Voice</label>
                            <p className="text-sm text-muted-foreground">
                              Enable voice input and text-to-speech output
                            </p>
                          </div>
                          <button
                            onClick={() => setVoiceSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              voiceSettings.enabled ? 'bg-primary-500' : 'bg-gray-600'
                            }`}
                          >
                            <div
                              className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                                voiceSettings.enabled ? 'translate-x-6' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                        </div>

                        {voiceSettings.enabled && (
                          <>
                            <div>
                              <label className="block text-sm font-medium mb-2">Voice</label>
                              <select
                                value={voiceSettings.voice}
                                onChange={(e) => setVoiceSettings(prev => ({ ...prev, voice: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
                              >
                                {/* Sarvam AI Voices */}
                                <optgroup label="Indian Accents">
                                  <option value="meera">Meera (Female, Hindi/English)</option>
                                  <option value="arjun">Arjun (Male, Hindi/English)</option>
                                  <option value="kavya">Kavya (Female, Hindi/English)</option>
                                </optgroup>
                                
                                {/* Pollinations AI Voices */}
                                <optgroup label="Foregin Accents">
                                  <option value="pollination_voice_1">Voice 1 (Natural)</option>
                                  <option value="pollination_voice_2">Voice 2 (Energetic)</option>
                                  <option value="pollination_voice_3">Voice 3 (Calm)</option>
                                  <option value="pollination_voice_4">Voice 4 (Professional)</option>
                                  <option value="pollination_voice_5">Voice 5 (Friendly)</option>
                                </optgroup>

                                {/* Custom voices from API */}
                                {voices.filter(voice => !['meera', 'arjun', 'kavya'].includes(voice.id)).map((voice) => (
                                  <option key={voice.id} value={voice.id}>
                                    {voice.name} ({voice.gender})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-2">Language</label>
                              <select
                                value={voiceSettings.language}
                                onChange={(e) => setVoiceSettings(prev => ({ ...prev, language: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
                              >
                                <option value="en-IN">English (India)</option>
                                <option value="hi-IN">Hindi (India)</option>
                                <option value="bn-IN">Bengali (India)</option>
                                <option value="ta-IN">Tamil (India)</option>
                                <option value="te-IN">Telugu (India)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Speed: {voiceSettings.speed.toFixed(1)}x
                              </label>
                              <input
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={voiceSettings.speed}
                                onChange={(e) => setVoiceSettings(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                                className="w-full"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Pitch: {voiceSettings.pitch.toFixed(1)}x
                              </label>
                              <input
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={voiceSettings.pitch}
                                onChange={(e) => setVoiceSettings(prev => ({ ...prev, pitch: parseFloat(e.target.value) }))}
                                className="w-full"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Image Settings */}
                  {activeTab === 'image' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium">Image Generation</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-4">
                            Configure image generation settings. Use keywords like "generate", "create", "draw" to trigger image generation.
                          </p>
                        </div>

                        <div className="bg-white/5 rounded-lg p-4">
                          <h4 className="font-medium mb-2">Supported Commands</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• "generate image of a cat"</li>
                            <li>• "create picture 1024x768"</li>
                            <li>• "draw a sunset using flux"</li>
                            <li>• "make illustration of space"</li>
                          </ul>
                        </div>

                        <div className="bg-white/5 rounded-lg p-4">
                          <h4 className="font-medium mb-2">Available Models</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• <strong>Flux:</strong> High-quality, versatile (default)</li>
                            <li>• <strong>Turbo:</strong> Fast generation</li>
                            <li>• <strong>DALL-E Style:</strong> Creative, artistic</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Settings */}
                  {activeTab === 'ai' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium">AI Configuration</h3>
                      
                      <div className="space-y-4">
                        <div className="bg-white/5 rounded-lg p-4">
                          <h4 className="font-medium mb-2">AI Features</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• GPT-4 powered conversations</li>
                            <li>• AI overview of search results</li>
                            <li>• Intelligent image generation detection</li>
                            <li>• Context-aware responses</li>
                          </ul>
                        </div>

                        <div className="bg-white/5 rounded-lg p-4">
                          <h4 className="font-medium mb-2">Search Modes</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• <strong>AI Mode:</strong> GPT-4 responses (default)</li>
                            <li>• <strong>Web Mode:</strong> Real web results (when enabled)</li>
                            <li>• <strong>Voice Mode:</strong> Speech input/output</li>
                            <li>• <strong>Image Mode:</strong> Generate images from text</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-white/10">
                <p className="text-sm text-muted-foreground">
                  Settings are saved automatically
                </p>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveSettings}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

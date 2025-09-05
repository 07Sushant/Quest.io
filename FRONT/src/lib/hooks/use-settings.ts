import { useState, useEffect } from 'react'

export interface VoiceSettings {
  enabled: boolean
  voice: string
  language: string
  speed: number
  pitch: number
}

export interface SearchSettings {
  webEnabled: boolean
  aiOverview: boolean
  voiceMode: boolean
  imageGeneration: boolean
}

export function useSettings() {
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

  // Listen for settings updates
  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent) => {
      if (event.detail.voiceSettings) {
        setVoiceSettings(event.detail.voiceSettings)
      }
      if (event.detail.searchSettings) {
        setSearchSettings(event.detail.searchSettings)
      }
    }

    window.addEventListener('settingsUpdated', handleSettingsUpdate as EventListener)
    
    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate as EventListener)
    }
  }, [])

  // Save settings
  const updateVoiceSettings = (newSettings: Partial<VoiceSettings>) => {
    const updated = { ...voiceSettings, ...newSettings }
    setVoiceSettings(updated)
    localStorage.setItem('quest_voice_settings', JSON.stringify(updated))
    
    window.dispatchEvent(new CustomEvent('settingsUpdated', {
      detail: { voiceSettings: updated, searchSettings }
    }))
  }

  const updateSearchSettings = (newSettings: Partial<SearchSettings>) => {
    const updated = { ...searchSettings, ...newSettings }
    setSearchSettings(updated)
    localStorage.setItem('quest_search_settings', JSON.stringify(updated))
    
    window.dispatchEvent(new CustomEvent('settingsUpdated', {
      detail: { voiceSettings, searchSettings: updated }
    }))
  }

  return {
    voiceSettings,
    searchSettings,
    updateVoiceSettings,
    updateSearchSettings
  }
}

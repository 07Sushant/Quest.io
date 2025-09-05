'use client'

import { motion } from 'framer-motion'
import { Brain, Globe, Mic, Image as ImageIcon } from 'lucide-react'
import { useSettings } from '@/lib/hooks/use-settings'

interface ModeSelector {
  currentMode: 'ai' | 'web' | 'voice' | 'image'
  onModeChange: (mode: 'ai' | 'web' | 'voice' | 'image') => void
  className?: string
}

export function ModeSelector({ currentMode, onModeChange, className = '' }: ModeSelector) {
  const { searchSettings, voiceSettings } = useSettings()

  const modes = [
    {
      id: 'ai' as const,
      name: 'AI',
      icon: Brain,
      color: 'text-green-400',
      bgColor: 'rgba(34, 197, 94, 0.2)',
      enabled: true,
      description: 'GPT-4 powered responses'
    },
    {
      id: 'web' as const,
      name: 'Web',
      icon: Globe,
      color: 'text-blue-400',
      bgColor: 'rgba(59, 130, 246, 0.2)',
      enabled: searchSettings.webEnabled,
      description: 'Real web search results'
    },
    {
      id: 'voice' as const,
      name: 'Voice',
      icon: Mic,
      color: 'text-purple-400',
      bgColor: 'rgba(147, 51, 234, 0.2)',
      enabled: voiceSettings.enabled,
      description: 'Voice input & output'
    },
    {
      id: 'image' as const,
      name: 'Image',
      icon: ImageIcon,
      color: 'text-pink-400',
      bgColor: 'rgba(236, 72, 153, 0.2)',
      enabled: searchSettings.imageGeneration,
      description: 'AI image generation'
    }
  ]

  const selectedIndex = modes.findIndex(mode => mode.id === currentMode)

  return (
    <div className={`mode-selector ${className}`}>
      <div className="flex items-center space-x-1 bg-white/5 backdrop-blur-sm rounded-2xl p-1 relative overflow-hidden">
        {/* Animated background */}
        <motion.div
          className="absolute inset-y-1 rounded-xl"
          animate={{
            x: selectedIndex * 70,
            backgroundColor: modes[selectedIndex]?.bgColor || 'rgba(99, 102, 241, 0.2)'
          }}
          transition={{ 
            type: 'spring', 
            stiffness: 400, 
            damping: 40,
            mass: 0.8
          }}
          style={{ width: '66px' }}
        />

        {modes.map((mode) => {
          const Icon = mode.icon
          const isSelected = currentMode === mode.id
          const isEnabled = mode.enabled

          return (
            <motion.button
              key={mode.id}
              onClick={() => isEnabled && onModeChange(mode.id)}
              disabled={!isEnabled}
              whileHover={isEnabled ? { 
                scale: 1.05,
                transition: { duration: 0.2, ease: "easeOut" }
              } : {}}
              whileTap={isEnabled ? { 
                scale: 0.95,
                transition: { duration: 0.1, ease: "easeOut" }
              } : {}}
              className={`relative z-10 flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all duration-300 ${
                isSelected
                  ? `${mode.color} shadow-lg`
                  : isEnabled
                    ? 'text-muted-foreground hover:text-foreground'
                    : 'text-muted-foreground/30 cursor-not-allowed'
              }`}
              title={isEnabled ? mode.description : `${mode.name} disabled`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{mode.name}</span>

              {/* Disabled overlay */}
              {!isEnabled && (
                <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center">
                  <div className="w-0.5 h-8 bg-red-500 transform rotate-45" />
                </div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Mode description */}
      <motion.p
        key={currentMode}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs text-muted-foreground text-center mt-2"
      >
        {modes.find(m => m.id === currentMode)?.description}
      </motion.p>
    </div>
  )
}

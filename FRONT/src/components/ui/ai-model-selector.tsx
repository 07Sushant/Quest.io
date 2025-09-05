'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Brain, Bot } from 'lucide-react'

interface ModelSelectorProps {
  currentModel: 'azure' | 'pollinations-openai'
  onModelChange: (model: 'azure' | 'pollinations-openai') => void
  className?: string
}

export function ModelSelector({ currentModel, onModelChange, className = '' }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const models = [
    {
      id: 'azure' as const,
      name: 'Azure GPT-4',
      description: 'Advanced AI model',
      icon: Brain,
      color: 'text-blue-400',
      bgColor: 'rgba(59, 130, 246, 0.1)'
    },
    {
      id: 'pollinations-openai' as const,
      name: 'Quest Chat',
      description: 'Alternative AI model',
      icon: Bot,
      color: 'text-green-400',
      bgColor: 'rgba(34, 197, 94, 0.1)'
    }
  ]

  const currentModelData = models.find(m => m.id === currentModel) || models[0]

  return (
    <div className={`relative ${className}`}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all duration-200"
      >
        <div className="flex items-center space-x-2">
          <currentModelData.icon className={`w-4 h-4 ${currentModelData.color}`} />
          <div className="text-left">
            <div className="text-sm font-medium text-white">
              {currentModelData.name}
            </div>
            <div className="text-xs text-gray-400">
              {currentModelData.description}
            </div>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.div>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden z-50"
          >
            {models.map((model) => (
              <motion.button
                key={model.id}
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                onClick={() => {
                  onModelChange(model.id)
                  setIsOpen(false)
                }}
                className={`w-full px-3 py-3 flex items-center space-x-3 text-left transition-colors ${
                  currentModel === model.id 
                    ? 'bg-white/10' 
                    : 'hover:bg-white/5'
                }`}
              >
                <div 
                  className={`w-8 h-8 rounded-lg flex items-center justify-center`}
                  style={{ backgroundColor: model.bgColor }}
                >
                  <model.icon className={`w-4 h-4 ${model.color}`} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">
                    {model.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {model.description}
                  </div>
                </div>
                {currentModel === model.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 bg-green-400 rounded-full"
                  />
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

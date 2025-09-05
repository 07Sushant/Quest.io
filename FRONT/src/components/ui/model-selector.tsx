'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Bot, Sparkles } from 'lucide-react'

interface ModelSelectorProps {
  selectedModel: string
  onModelChange: (model: string) => void
  className?: string
}

const models = [
  {
    id: 'azure',
    name: 'Azure',
    description: 'GPT-4 powered by Azure AI',
    icon: Bot,
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    description: 'Advanced conversational AI',
    icon: Sparkles,
    gradient: 'from-green-500 to-emerald-500'
  }
]

export function ModelSelector({ selectedModel, onModelChange, className = '' }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const selectedModelData = models.find(m => m.id === selectedModel) || models[0]

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-300"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className={`w-6 h-6 rounded-lg bg-gradient-to-r ${selectedModelData.gradient} flex items-center justify-center`}>
          <selectedModelData.icon className="w-3 h-3 text-white" />
        </div>
        <span className="text-sm font-medium">{selectedModelData.name}</span>
        <ChevronDown 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 w-64 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden shadow-2xl z-50"
          >
            {models.map((model) => (
              <motion.button
                key={model.id}
                onClick={() => {
                  onModelChange(model.id)
                  setIsOpen(false)
                }}
                className={`
                  w-full p-4 text-left transition-all duration-200 flex items-center space-x-3
                  ${selectedModel === model.id 
                    ? 'bg-white/20 border-l-4 border-l-blue-400' 
                    : 'hover:bg-white/10'
                  }
                `}
                whileHover={{ x: 4 }}
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${model.gradient} flex items-center justify-center flex-shrink-0`}>
                  <model.icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-white font-medium text-sm">{model.name}</div>
                  <div className="text-gray-400 text-xs">{model.description}</div>
                </div>
                {selectedModel === model.id && (
                  <div className="ml-auto w-2 h-2 bg-blue-400 rounded-full"></div>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

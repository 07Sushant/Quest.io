'use client'

import { useState, useEffect } from 'react'
import { Button } from './button'
import { Loader2, Settings, Zap, Bot, Brain } from 'lucide-react'
import { questAPI } from '@/lib/quest-api-new'

interface PollinationsModel {
  name: string
  description: string
  input_modalities: string[]
  output_modalities: string[]
  tier: string
  tools?: boolean
  vision?: boolean
  audio?: boolean
  quota: {
    used: number
    remaining: number
    limit: number
    resetTime: number
    exhausted: boolean
  }
}

interface PollinationsModelSelectorProps {
  selectedModel: string
  onModelSelect: (model: string) => void
  className?: string
}

export function PollinationsModelSelector({ 
  selectedModel, 
  onModelSelect, 
  className = '' 
}: PollinationsModelSelectorProps) {
  const [models, setModels] = useState<PollinationsModel[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    fetchModels()
  }, [])

  const fetchModels = async () => {
    setIsLoading(true)
    try {
      const models = await questAPI.getPollinationsModels()
      setModels(models || [])
    } catch (error) {
      console.error('Failed to fetch models:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleModelSelect = (modelName: string) => {
    onModelSelect(modelName)
    setIsOpen(false)
  }

  const getModelIcon = (model?: PollinationsModel) => {
    if (!model) return <Bot className="w-4 h-4" />
    if (model.vision) return <Brain className="w-4 h-4" />
    if (model.audio) return <Zap className="w-4 h-4" />
    return <Bot className="w-4 h-4" />
  }

  const currentModel = models.find(m => m.name === selectedModel)

  return (
    <div className="relative">
      <Button
        variant="outline"
        className={`flex items-center gap-2 ${className}`}
        disabled={isLoading}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          getModelIcon(currentModel)
        )}
        <span className="hidden sm:inline">
          {currentModel?.name || selectedModel || 'Select Model'}
        </span>
        <Settings className="w-4 h-4" />
      </Button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Select Pollinations AI Model
            </h3>
          </div>
          
          <div className="p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Loading models...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {models.map((model) => (
                  <div
                    key={model.name}
                    className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedModel === model.name 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-600'
                    } ${model.quota?.exhausted ? 'opacity-50' : ''}`}
                    onClick={() => !model.quota?.exhausted && handleModelSelect(model.name)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getModelIcon(model)}
                      <span className="font-medium">{model.name}</span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        model.tier === 'anonymous' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {model.tier}
                      </span>
                      {model.quota?.exhausted && (
                        <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">
                          Quota Exhausted
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {model.description}
                    </p>
                    
                    {model.quota && (
                      <div className="text-xs text-gray-500">
                        Usage: {model.quota.used}/{model.quota.limit} tokens
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {models.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No models available</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={fetchModels}
                >
                  Retry
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

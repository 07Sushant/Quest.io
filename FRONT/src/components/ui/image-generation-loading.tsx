'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Zap, Palette, Image } from 'lucide-react'

interface ImageGenerationLoadingProps {
  prompt: string
  show: boolean
}

export function ImageGenerationLoading({ prompt, show }: ImageGenerationLoadingProps) {
  const loadingStages = [
    { icon: Sparkles, text: "Analyzing your prompt...", color: "text-blue-400" },
    { icon: Palette, text: "Mixing colors and textures...", color: "text-purple-400" },
    { icon: Zap, text: "Generating your image...", color: "text-yellow-400" },
    { icon: Image, text: "Adding final touches...", color: "text-green-400" }
  ]

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl p-6 border border-indigo-200 dark:border-indigo-700"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center"
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Creating Your Image
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
              "{prompt}"
            </p>
          </div>

          {/* Loading Stages */}
          <div className="space-y-4">
            {loadingStages.map((stage, index) => {
              const Icon = stage.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    transition: { delay: index * 0.5 }
                  }}
                  className="flex items-center space-x-3"
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      delay: index * 0.3
                    }}
                    className={`p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm ${stage.color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </motion.div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {stage.text}
                  </span>
                </motion.div>
              )
            })}
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center space-x-2 mt-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
                className="w-2 h-2 bg-gradient-to-r from-indigo-400 to-purple-600 rounded-full"
              />
            ))}
          </div>

          {/* Fun fact */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="text-center mt-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg"
          >
            <p className="text-xs text-gray-600 dark:text-gray-400">
              ✨ AI is painting millions of pixels just for you!
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

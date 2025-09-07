'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface WebSearchLoadingProps {
  show: boolean
  query?: string
}

export function WebSearchLoading({ show, query = '' }: WebSearchLoadingProps) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    if (!show) return

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return ''
        return prev + '.'
      })
    }, 500)

    return () => clearInterval(interval)
  }, [show])

  if (!show) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center justify-center py-8 px-4"
    >
      {/* Circular cropped glowing Google-like icon with GIF */}
      <div className="relative mb-6">
        <motion.div
          animate={{
            scale: [1, 1.06, 1],
            opacity: [0.9, 1, 0.9]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 via-green-500 to-red-500 p-1 shadow-[0_0_30px_rgba(66,133,244,0.35)]"
        >
          <div className="w-full h-full rounded-full bg-white overflow-hidden">
            <img
              src="https://cdn.dribbble.com/userupload/41765203/file/original-0831f410f7be4445a90160e8898abdb0.gif"
              alt="Google loading animation"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </motion.div>

        {/* Outer glow effect */}
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.25, 0.5, 0.25]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
          className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 via-green-500 to-red-500 blur-lg -z-10"
        />
      </div>

      {/* Loading text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <h3 className="text-lg font-semibold text-foreground dark:text-white mb-1">
          Questing{dots}
        </h3>
        <p className="text-sm text-foreground/70 dark:text-white/70 max-w-sm">
          Searching the web for: <span className="font-medium">"{query}"</span>
        </p>
      </motion.div>

      {/* Animated search progress */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ duration: 3, ease: "easeInOut" }}
        className="mt-4 h-1 bg-gradient-to-r from-blue-500 via-green-500 to-red-500 rounded-full max-w-xs"
      />
    </motion.div>
  )
}

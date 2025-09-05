'use client'

import { motion } from 'framer-motion'

export function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full mx-auto mb-4"
        />
        <motion.h2
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-xl font-semibold gradient-text"
        >
          Initializing Quest.io...
        </motion.h2>
      </motion.div>
    </div>
  )
}

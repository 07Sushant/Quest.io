'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useMounted } from '@/hooks/use-mounted'

export function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const mounted = useMounted()

  useEffect(() => {
    // Only run on client side
    if (!mounted) return

    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    const handleMouseEnter = () => setIsHovering(true)
    const handleMouseLeave = () => setIsHovering(false)

    // Add event listeners
    document.addEventListener('mousemove', updateMousePosition)
    
    // Add hover listeners for interactive elements
    const interactiveElements = document.querySelectorAll('button, a, [role="button"], input, textarea')
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleMouseEnter)
      el.addEventListener('mouseleave', handleMouseLeave)
    })

    return () => {
      document.removeEventListener('mousemove', updateMousePosition)
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter)
        el.removeEventListener('mouseleave', handleMouseLeave)
      })
    }
  }, [mounted])

  // Don't render cursor during SSR to prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <>
      {/* Main cursor */}
      <motion.div
        className="fixed top-0 left-0 w-5 h-5 pointer-events-none z-[9999] mix-blend-difference"
        animate={{
          x: mousePosition.x - 10,
          y: mousePosition.y - 10,
          scale: isHovering ? 2 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 28,
          mass: 0.1,
        }}
      >
        <div 
          className={`w-full h-full rounded-full border-2 transition-all duration-200 ${
            isHovering 
              ? 'bg-secondary-500/30 border-secondary-500/50' 
              : 'bg-primary-500/20 border-primary-500/40'
          }`}
        />
      </motion.div>

      {/* Trailing cursor */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 pointer-events-none z-[9998]"
        animate={{
          x: mousePosition.x - 16,
          y: mousePosition.y - 16,
        }}
        transition={{
          type: "spring",
          stiffness: 150,
          damping: 15,
          mass: 0.2,
        }}
      >
        <div 
          className={`w-full h-full rounded-full border transition-all duration-300 ${
            isHovering 
              ? 'border-secondary-500/30' 
              : 'border-primary-500/20'
          }`}
        />
      </motion.div>
    </>
  )
}

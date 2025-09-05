'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useMounted } from '@/hooks/use-mounted'

export function BackgroundElements() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mounted = useMounted()

  useEffect(() => {
    // Only run on client side
    if (!mounted) return
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Particle system
    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      opacity: number
      canvasElement: HTMLCanvasElement

      constructor(canvasElement: HTMLCanvasElement) {
        this.canvasElement = canvasElement
        this.x = Math.random() * canvasElement.width
        this.y = Math.random() * canvasElement.height
        this.size = Math.random() * 3 + 1
        this.speedX = (Math.random() - 0.5) * 0.5
        this.speedY = (Math.random() - 0.5) * 0.5
        this.opacity = Math.random() * 0.5 + 0.2
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        if (this.x > this.canvasElement.width) this.x = 0
        if (this.x < 0) this.x = this.canvasElement.width
        if (this.y > this.canvasElement.height) this.y = 0
        if (this.y < 0) this.y = this.canvasElement.height
      }

      draw() {
        if (!ctx) return
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(99, 102, 241, ${this.opacity})`
        ctx.fill()
      }
    }

    // Create particles
    const particles: Particle[] = []
    for (let i = 0; i < 100; i++) {
      particles.push(new Particle(canvas))
    }

    // Animation loop
    function animate() {
      if (!ctx || !canvas) return
      
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach(particle => {
        particle.update()
        particle.draw()
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [mounted])

  // Don't render during SSR to prevent hydration mismatch
  if (!mounted) {
    return <div className="fixed inset-0 -z-10 bg-gradient-to-br from-background via-background to-background/90" />
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Animated canvas particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 opacity-30"
      />
      
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-secondary-500/10" />
      
      {/* Animated orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-primary-500/20 to-transparent rounded-full blur-3xl"
      />
      
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-radial from-secondary-500/20 to-transparent rounded-full blur-3xl"
      />
      
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 4,
        }}
        className="absolute top-3/4 left-1/2 w-72 h-72 bg-gradient-radial from-accent-500/20 to-transparent rounded-full blur-3xl"
      />
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  )
}

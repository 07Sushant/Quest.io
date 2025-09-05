'use client'

import { useEffect } from 'react'
import { useMounted } from '@/hooks/use-mounted'

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const mounted = useMounted()

  useEffect(() => {
    // Only run on client side
    if (!mounted) return

    // Initialize Lenis smooth scrolling
    const initSmoothScroll = async () => {
      const Lenis = (await import('@studio-freight/lenis')).default
      
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      })

      // Prevent Lenis from interfering with elements that have data-lenis-prevent
      lenis.on('scroll', () => {
        // Additional logic can be added here if needed
      })

      function raf(time: number) {
        lenis.raf(time)
        requestAnimationFrame(raf)
      }

      requestAnimationFrame(raf)
    }

    initSmoothScroll()
  }, [mounted])

  return <>{children}</>
}

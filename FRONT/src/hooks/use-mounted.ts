'use client'

import { useEffect, useState } from 'react'

/**
 * Hook to detect if component is mounted on client side
 * Useful for preventing hydration errors with browser-specific APIs
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted
}

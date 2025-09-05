'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { useMounted } from '@/hooks/use-mounted'

export function ThemeProvider({ 
  children, 
  ...props 
}: React.ComponentProps<typeof NextThemesProvider>) {
  const mounted = useMounted()
  
  // Prevent hydration mismatch by not rendering theme until client-side
  if (!mounted) {
    return <>{children}</>
  }
  
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

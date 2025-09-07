import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { SmoothScrollProvider } from '@/components/providers/smooth-scroll-provider'
import { CustomCursor } from '@/components/ui/custom-cursor'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Quest.io - Futuristic Search Engine',
  description: 'Experience the future of search with Quest.io - an AI-powered, intuitive search engine designed for the modern web.',
  keywords: 'search engine, AI, Quest.io, futuristic, web search',
  authors: [{ name: 'Quest.io Team' }],
  icons: {
    icon: 'https://raw.githubusercontent.com/07Sushant/dump/main/quest.png',
    shortcut: 'https://raw.githubusercontent.com/07Sushant/dump/main/quest.png',
    apple: 'https://raw.githubusercontent.com/07Sushant/dump/main/quest.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.className} antialiased`} style={{ cursor: 'none' }}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {/* <SmoothScrollProvider> */}
            <CustomCursor />
            {children}
          {/* </SmoothScrollProvider> */}
        </ThemeProvider>
      </body>
    </html>
  )
}

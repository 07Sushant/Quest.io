'use client'

import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check } from 'lucide-react'
import { motion } from 'framer-motion'

interface CodeBlockProps {
  code: string
  language: string
  filename?: string
}

export function CodeBlock({ code, language, filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  return (
    <div className="relative my-4 rounded-xl overflow-hidden bg-gray-900/50 backdrop-blur-sm border border-gray-700/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800/60 border-b border-gray-700/50">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          {filename && (
            <span className="text-sm text-gray-300 ml-2">{filename}</span>
          )}
          <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
            {language}
          </span>
        </div>
        
        <motion.button
          onClick={handleCopy}
          className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700/50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </motion.button>
      </div>
      
      {/* Code Content */}
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '14px',
            lineHeight: '1.5'
          }}
          showLineNumbers={true}
          lineNumberStyle={{ 
            color: '#6b7280',
            paddingRight: '1rem',
            minWidth: '2rem'
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

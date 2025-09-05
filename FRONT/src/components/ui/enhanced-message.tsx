'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { motion } from 'framer-motion'

interface EnhancedMessageProps {
  content: string
  htmlContent?: string // HTML formatted content
  className?: string
}

export function EnhancedMessage({ content, htmlContent, className = '' }: EnhancedMessageProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Function to copy code to clipboard
  const copyToClipboard = async (code: string, language: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(`${language}-${code.slice(0, 50)}`)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  // Function to detect programming language
  const detectLanguage = (code: string): string => {
    // Remove common markdown code block indicators
    const cleanCode = code.trim()
    
    // Language detection patterns
    if (/^\s*(function|const|let|var|class|import|export)/m.test(cleanCode)) return 'javascript'
    if (/^\s*(def|import|from|class|if __name__|print\()/m.test(cleanCode)) return 'python'
    if (/^\s*(public|private|class|interface|import|package)/m.test(cleanCode)) return 'java'
    if (/^\s*(#include|int main|cout|cin|std::)/m.test(cleanCode)) return 'cpp'
    if (/^\s*(using|namespace|public class|Console\.)/m.test(cleanCode)) return 'csharp'
    if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER)/i.test(cleanCode)) return 'sql'
    if (/^\s*(<\?php|\$[a-zA-Z_])/m.test(cleanCode)) return 'php'
    if (/^\s*(func|package|import|var|const)/m.test(cleanCode)) return 'go'
    if (/^\s*(fn|let|mut|use|struct|impl)/m.test(cleanCode)) return 'rust'
    if (/^\s*(<html|<head|<body|<div|<script)/i.test(cleanCode)) return 'html'
    if (/^\s*(\.|\#|@media|body|html)/m.test(cleanCode)) return 'css'
    if (/^\s*(\{|\[|"[^"]*":\s*)/m.test(cleanCode)) return 'json'
    if (/^\s*(npm|yarn|pip|git|cd|ls|mkdir)/m.test(cleanCode)) return 'bash'
    
    return 'plaintext'
  }

  // Function to get language display name
  const getLanguageDisplayName = (lang: string): string => {
    const langMap: { [key: string]: string } = {
      javascript: 'JavaScript',
      python: 'Python',
      java: 'Java',
      cpp: 'C++',
      csharp: 'C#',
      sql: 'SQL',
      php: 'PHP',
      go: 'Go',
      rust: 'Rust',
      html: 'HTML',
      css: 'CSS',
      json: 'JSON',
      bash: 'Bash',
      plaintext: 'Text'
    }
    return langMap[lang] || lang.toUpperCase()
  }

  // Function to apply syntax highlighting
  const highlightCode = (code: string, language: string): string => {
    if (language === 'plaintext') return code

    let highlighted = code
    
    // Basic syntax highlighting patterns
    const patterns: { [key: string]: Array<{ pattern: RegExp, replacement: string }> } = {
      javascript: [
        { pattern: /\b(function|const|let|var|class|import|export|if|else|for|while|return|true|false|null|undefined)\b/g, replacement: '<span class="text-blue-400">$1</span>' },
        { pattern: /(['"`])((?:(?!\1)[^\\]|\\.)*)(\1)/g, replacement: '<span class="text-green-400">$1$2$3</span>' },
        { pattern: /\/\/.*$/gm, replacement: '<span class="text-gray-500">$&</span>' },
        { pattern: /\/\*[\s\S]*?\*\//g, replacement: '<span class="text-gray-500">$&</span>' },
        { pattern: /\b\d+\b/g, replacement: '<span class="text-purple-400">$&</span>' }
      ],
      python: [
        { pattern: /\b(def|class|import|from|if|elif|else|for|while|return|True|False|None|and|or|not|in|is)\b/g, replacement: '<span class="text-blue-400">$1</span>' },
        { pattern: /(['"`])((?:(?!\1)[^\\]|\\.)*)(\1)/g, replacement: '<span class="text-green-400">$1$2$3</span>' },
        { pattern: /#.*$/gm, replacement: '<span class="text-gray-500">$&</span>' },
        { pattern: /\b\d+\b/g, replacement: '<span class="text-purple-400">$&</span>' }
      ],
      java: [
        { pattern: /\b(public|private|protected|static|final|class|interface|import|package|if|else|for|while|return|true|false|null)\b/g, replacement: '<span class="text-blue-400">$1</span>' },
        { pattern: /(['"`])((?:(?!\1)[^\\]|\\.)*)(\1)/g, replacement: '<span class="text-green-400">$1$2$3</span>' },
        { pattern: /\/\/.*$/gm, replacement: '<span class="text-gray-500">$&</span>' },
        { pattern: /\/\*[\s\S]*?\*\//g, replacement: '<span class="text-gray-500">$&</span>' },
        { pattern: /\b\d+\b/g, replacement: '<span class="text-purple-400">$&</span>' }
      ]
    }

    const langPatterns = patterns[language] || patterns.javascript
    
    langPatterns.forEach(({ pattern, replacement }) => {
      highlighted = highlighted.replace(pattern, replacement)
    })

    return highlighted
  }

  // Parse content to separate text and code blocks
  const parseContent = (text: string) => {
    const parts = []
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g
    const inlineCodeRegex = /`([^`]+)`/g
    
    let lastIndex = 0
    let match

    // Handle code blocks
    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const textContent = text.slice(lastIndex, match.index)
        // Handle inline code in text
        const textWithInlineCode = textContent.replace(inlineCodeRegex, 
          '<code class="bg-gray-700 text-green-400 px-1 py-0.5 rounded text-xs">$1</code>'
        )
        parts.push({ type: 'text', content: textWithInlineCode })
      }

      // Add code block
      const language = match[1] || 'plaintext'
      const code = match[2].trim()
      parts.push({ type: 'code', content: code, language })
      
      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const textContent = text.slice(lastIndex)
      const textWithInlineCode = textContent.replace(inlineCodeRegex, 
        '<code class="bg-gray-700 text-green-400 px-1 py-0.5 rounded text-xs">$1</code>'
      )
      parts.push({ type: 'text', content: textWithInlineCode })
    }

    return parts
  }

  const contentParts = parseContent(content)

  // If htmlContent is provided, render it directly with some basic styling
  if (htmlContent && htmlContent.trim() !== '') {
    console.log('Rendering HTML content:', htmlContent); // Debug log
    return (
      <div 
        className={`enhanced-message-content space-y-3 ${className}`}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    )
  }

  console.log('Rendering parsed content:', content); // Debug log

  return (
    <div className={`space-y-3 ${className}`}>
      {contentParts.map((part, index) => {
        if (part.type === 'text') {
          return (
            <div 
              key={index}
              className="text-sm leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: part.content }}
            />
          )
        }

        if (part.type === 'code') {
          const language = part.language || 'plaintext'
          const displayLanguage = getLanguageDisplayName(language)
          const highlightedCode = highlightCode(part.content, language)
          const copyId = `${language}-${part.content.slice(0, 50)}`

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative bg-gray-900 rounded-lg overflow-hidden border border-gray-700"
            >
              {/* Code header */}
              <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700">
                <span className="text-xs font-medium text-gray-300">
                  {displayLanguage}
                </span>
                <button
                  onClick={() => copyToClipboard(part.content, language)}
                  className="flex items-center space-x-1 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  {copiedCode === copyId ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code content */}
              <div className="p-4 overflow-x-auto">
                <pre className="text-sm">
                  <code 
                    className="text-gray-100 font-mono leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: highlightedCode }}
                  />
                </pre>
              </div>
            </motion.div>
          )
        }

        return null
      })}
    </div>
  )
}

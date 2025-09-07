'use client'

import { motion } from 'framer-motion'
import { ExternalLink, Globe, Star, Clock } from 'lucide-react'
import { useState } from 'react'

interface Source {
  title: string
  url: string
  snippet: string
  domain?: string
  ai_score?: number
  relevance_reason?: string
}

interface WebSearchSourcesProps {
  sources: Source[]
  query?: string
  className?: string
}

export function WebSearchSources({ sources, query = '', className = '' }: WebSearchSourcesProps) {
  const [expandedSource, setExpandedSource] = useState<number | null>(null)

  if (!sources || sources.length === 0) return null

  const handleSourceClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const formatDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname
      return domain.replace('www.', '')
    } catch {
      return url
    }
  }

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400'
    if (score >= 0.8) return 'text-green-400'
    if (score >= 0.6) return 'text-yellow-400'
    return 'text-orange-400'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={`mt-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center">
          <Globe className="w-3 h-3 text-white" />
        </div>
        <h3 className="text-sm font-semibold text-foreground/80 dark:text-white/80">
          Sources & Citations
        </h3>
        <span className="text-xs text-foreground/60 dark:text-white/60 bg-foreground/10 dark:bg-white/10 px-2 py-1 rounded-full">
          {sources.length} results
        </span>
      </div>

      {/* Sources Grid */}
      <div className="space-y-3">
        {sources.slice(0, 5).map((source, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            className="group relative"
          >
            <div
              onClick={() => handleSourceClick(source.url)}
              className="p-4 rounded-xl border border-foreground/10 dark:border-white/10 bg-foreground/5 dark:bg-white/5 hover:bg-foreground/10 dark:hover:bg-white/10 transition-all duration-200 cursor-pointer hover:border-blue-400/30 hover:shadow-lg"
            >
              {/* Source Header */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-foreground dark:text-white line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {source.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-foreground/60 dark:text-white/60">
                      {formatDomain(source.url)}
                    </span>
                    {source.ai_score && (
                      <div className="flex items-center gap-1">
                        <Star className={`w-3 h-3 ${getScoreColor(source.ai_score)}`} />
                        <span className={`text-xs ${getScoreColor(source.ai_score)}`}>
                          {Math.round(source.ai_score * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <ExternalLink className="w-4 h-4 text-foreground/40 dark:text-white/40 group-hover:text-blue-400 transition-colors shrink-0" />
              </div>

              {/* Snippet */}
              <p className="text-xs text-foreground/70 dark:text-white/70 line-clamp-2 mb-2">
                {source.snippet}
              </p>

              {/* Relevance reason (if available) */}
              {source.relevance_reason && (
                <div className="text-xs text-foreground/50 dark:text-white/50 bg-foreground/5 dark:bg-white/5 px-2 py-1 rounded-md border border-foreground/10 dark:border-white/10">
                  <span className="font-medium">Why relevant: </span>
                  {source.relevance_reason}
                </div>
              )}

              {/* Expand/Collapse for mobile */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setExpandedSource(expandedSource === index ? null : index)
                }}
                className="sm:hidden mt-2 text-xs text-blue-400 hover:text-blue-300"
              >
                {expandedSource === index ? 'Show less' : 'Show more'}
              </button>
            </div>

            {/* Mobile expanded view */}
            {expandedSource === index && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="sm:hidden mt-2 p-3 bg-foreground/10 dark:bg-white/10 rounded-lg border border-foreground/10 dark:border-white/10"
              >
                <p className="text-xs text-foreground/80 dark:text-white/80 mb-2">
                  {source.snippet}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground/60 dark:text-white/60">
                    {formatDomain(source.url)}
                  </span>
                  <button
                    onClick={() => handleSourceClick(source.url)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    Visit <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Show more button if there are more sources */}
      {sources.length > 5 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-full mt-3 py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          Show {sources.length - 5} more sources
        </motion.button>
      )}

      {/* Footer note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-4 flex items-center gap-2 text-xs text-foreground/50 dark:text-white/50"
      >
        <Clock className="w-3 h-3" />
        <span>Sources verified in real-time</span>
      </motion.div>
    </motion.div>
  )
}

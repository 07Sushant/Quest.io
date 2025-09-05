'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUp, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react'

interface ScrollButtonsProps {
  scrollContainerRef: React.RefObject<HTMLElement>
  className?: string
}

export function ScrollButtons({ scrollContainerRef, className = '' }: ScrollButtonsProps) {
  console.log('ScrollButtons component mounted')
  
  return (
    <div 
      className="fixed top-4 right-4 z-[9999] bg-red-500 p-4 text-white rounded"
      style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, backgroundColor: 'red' }}
    >
      <div>SCROLL BUTTONS TEST</div>
      <button 
        onClick={() => console.log('Up clicked')}
        className="block bg-blue-500 text-white p-2 m-1 rounded"
      >
        UP
      </button>
      <button 
        onClick={() => console.log('Down clicked')}
        className="block bg-green-500 text-white p-2 m-1 rounded"
      >
        DOWN
      </button>
    </div>
  )
}

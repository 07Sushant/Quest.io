// Framer Motion variants for smooth animations
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 }
}

export const slideInFromRight = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 }
}

export const slideInFromLeft = {
  initial: { opacity: 0, x: -100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 100 }
}

// Smooth spring transitions
export const smoothSpring = {
  type: 'spring',
  stiffness: 300,
  damping: 30
}

export const gentleSpring = {
  type: 'spring',
  stiffness: 200,
  damping: 25
}

// Liquid animation variants
export const liquidFlow = {
  animate: {
    background: [
      'linear-gradient(45deg, #3b82f6, #8b5cf6)',
      'linear-gradient(45deg, #8b5cf6, #ec4899)',
      'linear-gradient(45deg, #ec4899, #f59e0b)',
      'linear-gradient(45deg, #f59e0b, #10b981)',
      'linear-gradient(45deg, #10b981, #3b82f6)'
    ],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
}

// Magma-like fluid animation for image generation
export const magmaFlow = {
  animate: {
    background: [
      'radial-gradient(circle at 20% 20%, #ff6b35 0%, #f7931e 25%, #ffcc02 50%, #ff6b35 75%, #c7522a 100%)',
      'radial-gradient(circle at 80% 20%, #f7931e 0%, #ffcc02 25%, #ff6b35 50%, #c7522a 75%, #ff6b35 100%)',
      'radial-gradient(circle at 80% 80%, #ffcc02 0%, #ff6b35 25%, #c7522a 50%, #f7931e 75%, #ffcc02 100%)',
      'radial-gradient(circle at 20% 80%, #ff6b35 0%, #c7522a 25%, #f7931e 50%, #ffcc02 75%, #ff6b35 100%)',
      'radial-gradient(circle at 20% 20%, #ff6b35 0%, #f7931e 25%, #ffcc02 50%, #ff6b35 75%, #c7522a 100%)'
    ],
    transform: [
      'scale(1) rotate(0deg)',
      'scale(1.1) rotate(90deg)',
      'scale(1) rotate(180deg)',
      'scale(1.1) rotate(270deg)',
      'scale(1) rotate(360deg)'
    ],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
}

// Wave animation for voice input
export const voiceWave = {
  animate: {
    height: ['20%', '80%', '20%'],
    opacity: [0.3, 1, 0.3]
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut'
  }
}

// Typing indicator animation
export const typingDots = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.5, 1, 0.5]
  },
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: 'easeInOut'
  }
}

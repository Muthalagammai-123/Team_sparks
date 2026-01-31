'use client'

import { useEffect, useMemo } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { Bot, FileText, Truck } from 'lucide-react'
import Link from 'next/link'

interface CinematicLayoutProps {
  children: React.ReactNode
  showNavigation?: boolean
}

export default function CinematicLayout({ children, showNavigation = true }: CinematicLayoutProps) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 30, damping: 30 })
  const springY = useSpring(mouseY, { stiffness: 30, damping: 30 })

  // Memoize random positions to prevent recalculation on every render
  const randomPositions = useMemo(() => ({
    lines: Array.from({ length: 8 }, () => ({
      x1: Math.random() * 1920,
      y1: Math.random() * 1080,
      x2: Math.random() * 1920,
      y2: Math.random() * 1080,
    })),
    nodes: Array.from({ length: 3 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
    }))
  }), [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const { innerWidth, innerHeight } = window
      const x = (clientX / innerWidth - 0.5) * 2
      const y = (clientY / innerHeight - 0.5) * 2
      
      mouseX.set(x * 5) // Further reduced parallax effect
      mouseY.set(y * 5)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Minimal Background */}
      <div className="fixed inset-0 z-0">
        {/* Simplified Neural Network Background */}
        <div className="absolute inset-0 opacity-8">
          <svg className="w-full h-full" viewBox="0 0 1920 1080">
            <defs>
              <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f5ff" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            {/* Reduced to 8 lines for better performance */}
            {randomPositions.lines.map((pos, i) => (
              <motion.line
                key={i}
                x1={pos.x1}
                y1={pos.y1}
                x2={pos.x2}
                y2={pos.y2}
                stroke="url(#neuralGradient)"
                strokeWidth="1"
                opacity="0.12"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 8 + i * 2, // Slower, staggered animations
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: i * 1
                }}
              />
            ))}
          </svg>
        </div>

        {/* Minimal Floating Elements */}
        <motion.div
          className="absolute inset-0"
          style={{ x: springX, y: springY }}
        >
          {/* Only 2 floating documents */}
          {Array.from({ length: 2 }).map((_, i) => (
            <motion.div
              key={`doc-${i}`}
              className="absolute w-8 h-10 bg-gradient-to-br from-cyan-500/8 to-purple-500/8 backdrop-blur-sm border border-cyan-500/12 rounded-lg"
              style={{
                left: `${25 + (i * 40)}%`,
                top: `${30 + (i % 2) * 25}%`,
              }}
              animate={{
                y: [-8, 8, -8],
                rotate: [-1, 1, -1],
              }}
              transition={{
                duration: 10 + i * 2, // Very slow animations
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <FileText className="w-3 h-3 text-cyan-400/40 m-2.5" />
            </motion.div>
          ))}

          {/* Single moving truck */}
          <motion.div
            className="absolute"
            style={{
              left: '-50px',
              top: '45%',
            }}
            animate={{
              x: ['0vw', '110vw'],
            }}
            transition={{
              duration: 30, // Very slow movement
              repeat: Infinity,
              ease: "linear",
              delay: 3
            }}
          >
            <div className="w-6 h-4 bg-gradient-to-r from-teal-500/15 to-blue-500/15 backdrop-blur-sm border border-teal-400/25 rounded flex items-center justify-center">
              <Truck className="w-3 h-3 text-teal-400/50" />
            </div>
          </motion.div>

          {/* Only 3 glowing nodes */}
          {randomPositions.nodes.map((pos, i) => (
            <motion.div
              key={`node-${i}`}
              className="absolute w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400"
              style={{
                left: `${pos.left}%`,
                top: `${pos.top}%`,
                boxShadow: '0 0 8px currentColor'
              }}
              animate={{
                scale: [0.8, 1.2, 0.8],
                opacity: [0.3, 0.7, 0.3]
              }}
              transition={{
                duration: 5 + i * 2, // Slower animations
                repeat: Infinity,
                delay: i * 2
              }}
            />
          ))}
        </motion.div>

        {/* Static Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80" />
      </div>

      {/* Simplified Navbar */}
      {showNavigation && (
        <motion.header
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }} // Faster animation
          className="relative z-50 bg-black/25 backdrop-blur-sm border-b border-white/10"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  NegotiateX
                </span>
              </Link>
              
              <nav className="hidden md:flex space-x-8">
                <Link href="/" className="text-gray-300 hover:text-cyan-400 transition-colors duration-200">Home</Link>
                <Link href="/role-selection" className="text-gray-300 hover:text-cyan-400 transition-colors duration-200">Get Started</Link>
                <a href="#features" className="text-gray-300 hover:text-cyan-400 transition-colors duration-200">Features</a>
              </nav>

              <div className="text-sm text-gray-400">
                AI-Powered Negotiations
              </div>
            </div>
          </div>
        </motion.header>
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
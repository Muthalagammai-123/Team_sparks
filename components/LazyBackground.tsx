'use client'

import { motion } from 'framer-motion'
import { FileText, Truck } from 'lucide-react'
import { useMemo } from 'react'

interface LazyBackgroundProps {
  springX: any
  springY: any
}

export default function LazyBackground({ springX, springY }: LazyBackgroundProps) {
  // Memoize random positions to prevent recalculation
  const positions = useMemo(() => ({
    lines: Array.from({ length: 6 }, () => ({
      x1: Math.random() * 1920,
      y1: Math.random() * 1080,
      x2: Math.random() * 1920,
      y2: Math.random() * 1080,
    })),
    nodes: Array.from({ length: 2 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
    }))
  }), [])

  return (
    <div className="fixed inset-0 z-0">
      {/* Minimal Neural Network */}
      <div className="absolute inset-0 opacity-6">
        <svg className="w-full h-full" viewBox="0 0 1920 1080">
          <defs>
            <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f5ff" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          {positions.lines.map((pos, i) => (
            <motion.line
              key={i}
              x1={pos.x1}
              y1={pos.y1}
              x2={pos.x2}
              y2={pos.y2}
              stroke="url(#neuralGradient)"
              strokeWidth="1"
              opacity="0.1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 10 + i * 3,
                repeat: Infinity,
                repeatType: "reverse",
                delay: i * 2
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
        {/* Single floating document */}
        <motion.div
          className="absolute w-6 h-8 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 backdrop-blur-sm border border-cyan-500/10 rounded-lg"
          style={{ left: '30%', top: '35%' }}
          animate={{
            y: [-5, 5, -5],
            rotate: [-1, 1, -1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <FileText className="w-2 h-2 text-cyan-400/30 m-2" />
        </motion.div>

        {/* Single truck */}
        <motion.div
          className="absolute"
          style={{ left: '-40px', top: '50%' }}
          animate={{ x: ['0vw', '110vw'] }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "linear",
            delay: 5
          }}
        >
          <div className="w-4 h-3 bg-gradient-to-r from-teal-500/10 to-blue-500/10 backdrop-blur-sm border border-teal-400/20 rounded flex items-center justify-center">
            <Truck className="w-2 h-2 text-teal-400/40" />
          </div>
        </motion.div>

        {/* Minimal nodes */}
        {positions.nodes.map((pos, i) => (
          <motion.div
            key={`node-${i}`}
            className="absolute w-1 h-1 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400"
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              boxShadow: '0 0 5px currentColor'
            }}
            animate={{
              scale: [0.5, 1, 0.5],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{
              duration: 6 + i * 3,
              repeat: Infinity,
              delay: i * 3
            }}
          />
        ))}
      </motion.div>

      {/* Static gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />
    </div>
  )
}
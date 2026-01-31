'use client'

import { motion } from 'framer-motion'
import { FileText, Truck } from 'lucide-react'

interface CinematicBackgroundProps {
  mouseX: any
  mouseY: any
}

export default function CinematicBackground({ mouseX, mouseY }: CinematicBackgroundProps) {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Neural Network Grid */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f5ff" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Animated Grid Lines */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.line
              key={`vertical-${i}`}
              x1={i * 96}
              y1="0"
              x2={i * 96}
              y2="1080"
              stroke="url(#neuralGradient)"
              strokeWidth="0.5"
              opacity="0.2"
              filter="url(#glow)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 2,
                delay: i * 0.1,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
          ))}
          
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.line
              key={`horizontal-${i}`}
              x1="0"
              y1={i * 90}
              x2="1920"
              y2={i * 90}
              stroke="url(#neuralGradient)"
              strokeWidth="0.5"
              opacity="0.2"
              filter="url(#glow)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 2,
                delay: i * 0.1,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
          ))}

          {/* Neural Network Connections */}
          {Array.from({ length: 30 }).map((_, i) => {
            const x1 = Math.random() * 1920
            const y1 = Math.random() * 1080
            const x2 = x1 + (Math.random() - 0.5) * 400
            const y2 = y1 + (Math.random() - 0.5) * 400
            
            return (
              <motion.line
                key={`connection-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="url(#neuralGradient)"
                strokeWidth="1"
                opacity="0.15"
                filter="url(#glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: [0, 1, 0],
                  opacity: [0, 0.3, 0]
                }}
                transition={{
                  duration: 4 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 5,
                  ease: "easeInOut"
                }}
              />
            )
          })}
        </svg>
      </div>

      {/* Parallax Moving Elements */}
      <motion.div
        className="absolute inset-0"
        style={{ x: mouseX, y: mouseY }}
      >
        {/* Floating Contract Documents */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={`doc-${i}`}
            className="absolute"
            style={{
              left: `${5 + (i * 8)}%`,
              top: `${10 + (i % 4) * 20}%`,
            }}
            animate={{
              y: [-30, 30, -30],
              rotate: [-10, 10, -10],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{
              duration: 6 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3
            }}
          >
            <div className="w-12 h-16 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 backdrop-blur-sm border border-cyan-500/20 rounded-lg shadow-lg shadow-cyan-500/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-cyan-400/60" />
            </div>
          </motion.div>
        ))}

        {/* Moving Delivery Trucks */}
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={`truck-${i}`}
            className="absolute"
            style={{
              left: '-120px',
              top: `${25 + i * 15}%`,
            }}
            animate={{
              x: ['0vw', '120vw'],
            }}
            transition={{
              duration: 20 + i * 8,
              repeat: Infinity,
              ease: "linear",
              delay: i * 6
            }}
          >
            <div className="relative">
              <div className="w-16 h-10 bg-gradient-to-r from-teal-500/20 to-blue-500/20 backdrop-blur-sm border border-teal-400/30 rounded-lg shadow-lg shadow-teal-500/10 flex items-center justify-center">
                <Truck className="w-8 h-8 text-teal-400/70" />
              </div>
              {/* Truck trail effect */}
              <motion.div
                className="absolute top-1/2 -left-8 w-8 h-1 bg-gradient-to-r from-transparent to-teal-400/30 rounded-full"
                animate={{
                  scaleX: [0, 1, 0],
                  opacity: [0, 0.6, 0]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
          </motion.div>
        ))}

        {/* Glowing Negotiation Nodes */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={`node-${i}`}
            className="absolute w-3 h-3 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `linear-gradient(45deg, #00f5ff, #8b5cf6, #06b6d4)`,
              boxShadow: '0 0 20px currentColor'
            }}
            animate={{
              scale: [0.5, 2, 0.5],
              opacity: [0.2, 1, 0.2],
              rotate: [0, 360]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut"
            }}
          />
        ))}

        {/* Digital Route Paths */}
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={`route-${i}`}
            className="absolute"
            style={{
              left: `${i * 16}%`,
              top: `${20 + (i % 2) * 40}%`,
              width: '200px',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #00f5ff, transparent)',
              transform: `rotate(${i * 30}deg)`
            }}
            animate={{
              scaleX: [0, 1, 0],
              opacity: [0, 0.8, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>

      {/* Atmospheric Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/10 via-transparent to-purple-900/10" />
      
      {/* Subtle Noise Texture */}
      <div 
        className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}
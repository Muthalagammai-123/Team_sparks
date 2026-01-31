'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { ArrowRight, Bot, FileText, Shield, Truck, Package, Clock, Github, Twitter, Linkedin, Play } from 'lucide-react'
import Link from 'next/link'

export default function CinematicLandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 30, damping: 40 })
  const springY = useSpring(mouseY, { stiffness: 30, damping: 40 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const { innerWidth, innerHeight } = window
      const x = (clientX / innerWidth - 0.5) * 2
      const y = (clientY / innerHeight - 0.5) * 2
      
      setMousePosition({ x: clientX, y: clientY })
      mouseX.set(x * 8)
      mouseY.set(y * 8)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  const stats = [
    { value: '10K+', label: 'AI Negotiations' },
    { value: '99.2%', label: 'Success Rate' },
    { value: '24/7', label: 'Availability' },
    { value: '< 5min', label: 'Avg. Time' }
  ]

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Animated Background - Optimized */}
      <div className="fixed inset-0 z-0">
        {/* Simplified Neural Network Background */}
        <div className="absolute inset-0 opacity-15">
          <svg className="w-full h-full" viewBox="0 0 1920 1080">
            <defs>
              <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f5ff" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            {/* Reduced from 50 to 20 lines for better performance */}
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.line
                key={i}
                x1={Math.random() * 1920}
                y1={Math.random() * 1080}
                x2={Math.random() * 1920}
                y2={Math.random() * 1080}
                stroke="url(#neuralGradient)"
                strokeWidth="1"
                opacity="0.2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 5 + Math.random() * 3, // Slower animations
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: Math.random() * 3
                }}
              />
            ))}
          </svg>
        </div>

        {/* Simplified Floating Elements */}
        <motion.div
          className="absolute inset-0"
          style={{ x: springX, y: springY }}
        >
          {/* Reduced Floating Contract Documents from 8 to 4 */}
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={`doc-${i}`}
              className="absolute w-12 h-16 bg-gradient-to-br from-cyan-500/15 to-purple-500/15 backdrop-blur-sm border border-cyan-500/25 rounded-lg"
              style={{
                left: `${15 + (i * 20)}%`,
                top: `${25 + (i % 2) * 30}%`,
              }}
              animate={{
                y: [-15, 15, -15],
                rotate: [-3, 3, -3],
                scale: [0.9, 1.1, 0.9]
              }}
              transition={{
                duration: 6 + i * 1, // Slower animations
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <FileText className="w-6 h-6 text-cyan-400/60 m-3" />
            </motion.div>
          ))}

          {/* Reduced Moving Trucks from 3 to 2 */}
          {Array.from({ length: 2 }).map((_, i) => (
            <motion.div
              key={`truck-${i}`}
              className="absolute"
              style={{
                left: '-100px',
                top: `${35 + i * 25}%`,
              }}
              animate={{
                x: ['0vw', '110vw'],
              }}
              transition={{
                duration: 20 + i * 8, // Slower movement
                repeat: Infinity,
                ease: "linear",
                delay: i * 8
              }}
            >
              <div className="w-10 h-6 bg-gradient-to-r from-teal-500/30 to-blue-500/30 backdrop-blur-sm border border-teal-400/40 rounded flex items-center justify-center">
                <Truck className="w-5 h-5 text-teal-400/70" />
              </div>
            </motion.div>
          ))}

          {/* Reduced Glowing Nodes from 12 to 6 */}
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={`node-${i}`}
              className="absolute w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                boxShadow: '0 0 15px currentColor'
              }}
              animate={{
                scale: [0.5, 1.2, 0.5],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{
                duration: 4 + Math.random() * 3, // Slower animations
                repeat: Infinity,
                delay: Math.random() * 3
              }}
            />
          ))}
        </motion.div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />
      </div>

      {/* Glass Navbar */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-50 bg-black/20 backdrop-blur-md border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                NegotiateX
              </span>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300">Home</a>
              <a href="#features" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300">How it Works</a>
              <a href="#features" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300">Features</a>
              <a href="#demo" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300">Demo</a>
            </nav>

            <div className="flex items-center space-x-4">
              <Github className="w-5 h-5 text-gray-400 hover:text-cyan-400 cursor-pointer transition-colors" />
              <Twitter className="w-5 h-5 text-gray-400 hover:text-cyan-400 cursor-pointer transition-colors" />
              <Linkedin className="w-5 h-5 text-gray-400 hover:text-cyan-400 cursor-pointer transition-colors" />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-6xl mx-auto text-center">
          {/* Main Hero Card */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-12 shadow-2xl shadow-cyan-500/10"
            style={{
              background: 'linear-gradient(135deg, rgba(0,245,255,0.1) 0%, rgba(139,92,246,0.1) 50%, rgba(6,182,212,0.1) 100%)'
            }}
          >
            {/* Glowing Border Effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-teal-500/20 blur-xl -z-10" />
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-6xl md:text-8xl font-bold mb-6 leading-tight"
            >
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-teal-400 bg-clip-text text-transparent">
                SMART NEGOTIATION
              </span>
              <br />
              <span className="text-white">IS HERE</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              AI-powered dynamic delivery contracts that adapt in real-time.
              <br />
              Experience the future of automated negotiations.
            </motion.p>

            {/* Stats Badges */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
            >
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-black/30 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-4 hover:border-cyan-400/40 transition-all duration-300"
                >
                  <div className="text-2xl md:text-3xl font-bold text-cyan-400 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="flex flex-col sm:flex-row gap-6 justify-center"
            >
              <Link href="/role-selection">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0,245,255,0.5)' }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-semibold text-lg overflow-hidden transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center space-x-3">
                    <span>Start Negotiation</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.button>
              </Link>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-black/40 backdrop-blur-sm border border-cyan-500/30 rounded-xl font-semibold text-lg hover:border-cyan-400/60 transition-all duration-300 flex items-center space-x-3"
              >
                <Play className="w-5 h-5" />
                <span>View Demo</span>
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Next-Gen Features
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Powered by advanced AI algorithms and real-time data processing
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Bot,
                title: 'AI Negotiation Engine',
                description: 'Advanced neural networks analyze market conditions and negotiate optimal terms in real-time',
                color: 'from-cyan-500 to-blue-500'
              },
              {
                icon: Shield,
                title: 'Risk-Aware Contracts',
                description: 'Dynamic risk assessment with predictive analytics for weather, traffic, and market volatility',
                color: 'from-purple-500 to-pink-500'
              },
              {
                icon: FileText,
                title: 'Smart Legal Framework',
                description: 'Blockchain-verified contracts with natural language processing for human-readable terms',
                color: 'from-teal-500 to-green-500'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-cyan-500/30 transition-all duration-500"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                     style={{ background: `linear-gradient(135deg, ${feature.color.split(' ')[1]}, ${feature.color.split(' ')[3]})` }} />
                
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 py-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-teal-500/10 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-12"
        >
          <h3 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Ready to Transform
            </span>
            <br />
            <span className="text-white">Your Negotiations?</span>
          </h3>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of companies already using AI-powered contract negotiation
          </p>
          <Link href="/role-selection">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(0,245,255,0.4)' }}
              whileTap={{ scale: 0.95 }}
              className="px-12 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-bold text-xl hover:from-cyan-400 hover:to-purple-500 transition-all duration-300 flex items-center space-x-3 mx-auto"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-6 h-6" />
            </motion.button>
          </Link>
        </motion.div>
      </section>
    </div>
  )
}
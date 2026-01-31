'use client'

import { motion } from 'framer-motion'
import { Truck, Package, ArrowRight, CheckCircle, Bell } from 'lucide-react'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import CinematicLayout from '../../components/CinematicLayout'

function RoleSelectionContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const notification = searchParams.get('notification')
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  const roles = [
    {
      id: 'customer',
      title: 'Customer',
      icon: CheckCircle,
      description: 'I set service expectations and provide performance feedback',
      responsibilities: [
        'Set quality & speed expectations',
        'Provide post-delivery ratings',
        'View final delivery reports',
        'Passive signal provider'
      ],
      benefits: [
        'Improved future service',
        'No negotiation overhead',
        'Simplified dashboard',
        'Performance-based quality'
      ],
      href: '/customer-dashboard'
    },
    {
      id: 'shipper',
      title: 'Shipper',
      icon: Package,
      description: 'I own all commercial terms and initiate negotiations',
      responsibilities: [
        'Define pricing & SLA rules',
        'Set fuel & holiday adjustments',
        'Initiate carrier negotiations',
        'Final contract approval'
      ],
      benefits: [
        'Full commercial control',
        'Risk-weighted templates',
        'Automated penalty logic',
        'Historical quality integration'
      ],
      href: '/shipper-dashboard'
    },
    {
      id: 'carrier',
      title: 'Carrier',
      icon: Truck,
      description: 'I manage operational constraints and feasibility',
      responsibilities: [
        'Define operational capacity',
        'Assess route & fuel risks',
        'Respond to shipper terms',
        'Confirm operational feasibility'
      ],
      benefits: [
        'Optimized route commitments',
        'Fair operational buffers',
        'Constraint-based response',
        'Reduced legal friction'
      ],
      href: '/carrier-dashboard'
    }
  ]

  return (
    <CinematicLayout>
      <div className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-6xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-teal-400 bg-clip-text text-transparent">
                Choose Your Role
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Select whether you're shipping packages or providing delivery services to get started with AI-powered contract negotiation
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {roles.map((role, index) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className={`group relative bg-black/40 backdrop-blur-xl border rounded-2xl p-8 cursor-pointer transition-all duration-500 ${selectedRole === role.id
                  ? 'border-cyan-500/60 shadow-2xl shadow-cyan-500/20'
                  : 'border-white/10 hover:border-cyan-500/30'
                  }`}
                onClick={() => setSelectedRole(role.id)}
              >
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${selectedRole === role.id ? 'opacity-100' : ''
                  }`} />

                <div className="relative z-10">
                  <div className="text-center mb-8">
                    <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${selectedRole === role.id
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-600 shadow-lg shadow-cyan-500/25'
                      : 'bg-gradient-to-r from-gray-700 to-gray-600 group-hover:from-cyan-500/50 group-hover:to-purple-600/50'
                      }`}>
                      <role.icon className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
                      {role.title}
                    </h3>
                    <p className="text-gray-300 text-lg">{role.description}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-cyan-400 mb-4 text-lg">Your Responsibilities</h4>
                      <ul className="space-y-3">
                        {role.responsibilities.map((item, idx) => (
                          <li key={idx} className="flex items-start space-x-3 text-sm text-gray-300">
                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-purple-400 mb-4 text-lg">Your Benefits</h4>
                      <ul className="space-y-3">
                        {role.benefits.map((item, idx) => (
                          <li key={idx} className="flex items-start space-x-3 text-sm text-gray-300">
                            <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {selectedRole === role.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center"
                    >
                      <CheckCircle className="w-5 h-5 text-white" />
                    </motion.div>
                  )}

                  {((notification === 'shipper_action' && role.id === 'shipper') ||
                    (notification === 'carrier_action' && role.id === 'carrier')) && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-3 -right-3 bg-red-500 text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center space-x-2 shadow-[0_0_15px_rgba(239,68,68,0.5)] z-20 border-2 border-white/20"
                      >
                        <Bell className="w-4 h-4 animate-bounce" />
                        <span>Action Required</span>
                      </motion.div>
                    )}
                </div>
              </motion.div>
            ))}
          </div>

          {selectedRole && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <motion.button
                onClick={() => {
                  const href = roles.find(r => r.id === selectedRole)?.href || '/'
                  router.push(href)
                }}
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0,245,255,0.4)' }}
                whileTap={{ scale: 0.95 }}
                className="group relative px-12 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-bold text-xl overflow-hidden transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center space-x-3">
                  <span>Continue as {roles.find(r => r.id === selectedRole)?.title}</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </CinematicLayout>
  )
}

export default function RoleSelectionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-cyan-400">Loading Selection...</div>}>
      <RoleSelectionContent />
    </Suspense>
  )
}
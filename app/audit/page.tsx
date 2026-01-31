'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, Clock, TrendingUp, Shield, CheckCircle, ArrowRight, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import ProgressIndicator from '../../components/ProgressIndicator'
import CinematicLayout from '../../components/CinematicLayout'

export default function AuditPage() {
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null)

  const steps = [
    { id: 'requirements', title: 'Requirements', description: 'Define your needs' },
    { id: 'negotiation', title: 'AI Negotiation', description: 'AI finds best terms' },
    { id: 'contract', title: 'Contract', description: 'Review & approve' },
    { id: 'complete', title: 'Complete', description: 'Ready to ship' }
  ]

  const aiDecisions = [
    {
      id: 'timeline',
      title: 'Timeline Adjustment',
      decision: 'Extended deadline by 1 day',
      reasoning: 'Weather forecast shows 40% chance of snow on original delivery date. Adding buffer reduces risk of penalties.',
      confidence: 87,
      impact: 'Reduced penalty risk by 60%',
      icon: Clock,
      color: 'text-cyan-400'
    },
    {
      id: 'penalty',
      title: 'Penalty Relaxation',
      decision: 'Reduced penalty rate from 3% to 2%',
      reasoning: 'Carrier has 92% reliability score and route has medium risk factors. Fair penalty adjustment maintains incentive while being reasonable.',
      confidence: 94,
      impact: 'Improved carrier acceptance by 35%',
      icon: Shield,
      color: 'text-green-400'
    },
    {
      id: 'cost',
      title: 'Cost Optimization',
      decision: 'Negotiated price to $475',
      reasoning: 'Balanced shipper budget ($500 max) with carrier minimum ($400). Price point ensures quality service while staying within budget.',
      confidence: 91,
      impact: 'Saved shipper $25 while meeting carrier needs',
      icon: TrendingUp,
      color: 'text-purple-400'
    }
  ]

  const negotiationTimeline = [
    { step: 'Initial Analysis', time: '0s', action: 'Processed requirements from both parties' },
    { step: 'Risk Assessment', time: '2s', action: 'Evaluated weather, traffic, and seasonal factors' },
    { step: 'Cost Calculation', time: '3.5s', action: 'Analyzed market rates and carrier capabilities' },
    { step: 'Timeline Optimization', time: '6s', action: 'Adjusted delivery window for risk mitigation' },
    { step: 'Penalty Balancing', time: '7s', action: 'Set fair penalty terms based on reliability data' },
    { step: 'Final Validation', time: '8s', action: 'Verified all terms meet both parties\' requirements' }
  ]

  const confidenceData = [
    { metric: 'Cost Fairness', score: 91 },
    { metric: 'Timeline Accuracy', score: 87 },
    { metric: 'Risk Assessment', score: 94 },
    { metric: 'Penalty Balance', score: 89 },
    { metric: 'Overall Satisfaction', score: 92 }
  ]

  const marketComparison = [
    { factor: 'Cost', market: 520, negotiated: 475, savings: 45 },
    { factor: 'Timeline', market: 2, negotiated: 3, buffer: 1 },
    { factor: 'Penalty Rate', market: 3.5, negotiated: 2.0, reduction: 1.5 }
  ]

  return (
    <CinematicLayout>
      <ProgressIndicator 
        steps={steps} 
        currentStep="complete" 
        completedSteps={['requirements', 'negotiation', 'contract']} 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, type: "spring" }}
              className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-cyan-500/25"
            >
              <Brain className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-teal-400 bg-clip-text text-transparent">
                AI Decision Transparency
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Understand exactly how our AI negotiated your contract terms
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* AI Decisions */}
            <div className="lg:col-span-2 space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-cyan-500/30 transition-all duration-500"
              >
                <h2 className="text-2xl font-bold text-white mb-8">Key AI Decisions</h2>
                <div className="space-y-6">
                  {aiDecisions.map((decision, index) => (
                    <motion.div
                      key={decision.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                        selectedDecision === decision.id
                          ? 'border-cyan-500/60 bg-cyan-500/10'
                          : 'border-white/20 hover:border-cyan-500/40'
                      }`}
                      onClick={() => setSelectedDecision(selectedDecision === decision.id ? null : decision.id)}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          selectedDecision === decision.id ? 'bg-cyan-600' : 'bg-gray-700'
                        }`}>
                          <decision.icon className={`w-6 h-6 ${
                            selectedDecision === decision.id ? 'text-white' : decision.color
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-white text-lg">{decision.title}</h3>
                            <div className="flex items-center space-x-2">
                              <div className="text-sm text-gray-400">Confidence:</div>
                              <div className="text-sm font-bold text-cyan-400">{decision.confidence}%</div>
                            </div>
                          </div>
                          <p className="text-gray-300 mb-3">{decision.decision}</p>
                          {selectedDecision === decision.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              transition={{ duration: 0.3 }}
                              className="mt-6 pt-6 border-t border-gray-600"
                            >
                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-sm font-bold text-white mb-2">Reasoning:</h4>
                                  <p className="text-sm text-gray-300">{decision.reasoning}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-white mb-2">Impact:</h4>
                                  <p className="text-sm text-green-400">{decision.impact}</p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Negotiation Timeline */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-cyan-500/30 transition-all duration-500"
              >
                <h2 className="text-2xl font-bold text-white mb-8">Negotiation Timeline</h2>
                <div className="space-y-6">
                  {negotiationTimeline.map((item, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white text-sm font-bold">{index + 1}</span>
                        </div>
                        {index < negotiationTimeline.length - 1 && (
                          <div className="w-0.5 h-8 bg-gradient-to-b from-cyan-500 to-purple-600 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-bold text-white">{item.step}</h3>
                          <span className="text-xs text-cyan-400 bg-cyan-500/20 px-2 py-1 rounded">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-gray-300">{item.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Confidence Scores */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-cyan-500/30 transition-all duration-500"
              >
                <h3 className="text-xl font-bold text-white mb-6">Confidence Scores</h3>
                <div className="space-y-6">
                  {confidenceData.map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-300">{item.metric}</span>
                        <span className="font-bold text-cyan-400">{item.score}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.score}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                          className="bg-gradient-to-r from-cyan-500 to-purple-600 h-3 rounded-full shadow-lg"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Market Comparison */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-cyan-500/30 transition-all duration-500"
              >
                <h3 className="text-xl font-bold text-white mb-6">Market Comparison</h3>
                <div className="space-y-6">
                  {marketComparison.map((item, index) => (
                    <div key={index} className="border-l-4 border-cyan-500 pl-4">
                      <h4 className="font-bold text-white mb-3">{item.factor}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Market Average:</span>
                          <span className="text-gray-500 line-through">
                            {item.factor === 'Cost' ? `$${item.market}` : 
                             item.factor === 'Timeline' ? `${item.market} days` : 
                             `${item.market}%`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Negotiated:</span>
                          <span className="font-bold text-green-400">
                            {item.factor === 'Cost' ? `$${item.negotiated}` : 
                             item.factor === 'Timeline' ? `${item.negotiated} days` : 
                             `${item.negotiated}%`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Success Summary */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="bg-gradient-to-r from-green-500/10 via-cyan-500/10 to-blue-500/10 backdrop-blur-xl border border-green-500/30 rounded-2xl p-8"
              >
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-3">
                    Negotiation Complete
                  </h3>
                  <p className="text-gray-300 mb-6">
                    Your contract has been successfully negotiated and approved by both parties.
                  </p>
                  <div className="text-4xl font-bold text-green-400 mb-2">92%</div>
                  <div className="text-gray-300">Overall Satisfaction Score</div>
                </div>
              </motion.div>

              {/* Next Steps */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="text-center"
              >
                <Link href="/">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0,245,255,0.4)' }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-bold text-lg overflow-hidden transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center space-x-3">
                      <span>Start New Negotiation</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.button>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </CinematicLayout>
  )
}
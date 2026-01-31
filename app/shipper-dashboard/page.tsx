'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Calendar, DollarSign, Clock, AlertTriangle, FileText, ArrowRight, Activity, Percent, Fuel, Sparkles, UserCheck } from 'lucide-react'
import ProgressIndicator from '../../components/ProgressIndicator'
import { ToastContainer, ToastProps } from '../../components/Toast'
import CinematicLayout from '../../components/CinematicLayout'
import { useWorkflow } from '../../components/WorkflowContext'

export default function ShipperDashboard() {
  const { state, customerExpectations, customerRatings, setShipperTerms } = useWorkflow()
  const router = useRouter()

  const [formData, setFormData] = useState({
    baseBudget: 600,
    deadline: '',
    priorityWeight: 'cost', // cost, speed, reliability
    slaRules: {
      delayPenalty: 15,
      maxDelayTolerance: 48, // hours
      peakChargeMultiplier: 1.2,
      fuelAdjustmentCap: 5 // %
    },
    specialTerms: ''
  })

  const [toasts, setToasts] = useState<ToastProps[]>([])
  const [isValid, setIsValid] = useState(false)

  const steps = [
    { id: 'terms', title: 'Commercial Terms', description: 'Define pricing & SLAs' },
    { id: 'negotiation', title: 'AI Negotiation', description: 'Dual agents advocates' },
    { id: 'contract', title: 'Execution', description: 'Final approval' }
  ]

  const addToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { ...toast, id, onClose: removeToast }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const handleInputChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    setIsValid(Boolean(newData.deadline && newData.baseBudget > 0))
  }

  const handleSLAChange = (field: string, value: any) => {
    const newData = {
      ...formData,
      slaRules: { ...formData.slaRules, [field]: value }
    }
    setFormData(newData)
  }

  const handleSubmit = () => {
    if (!isValid) {
      addToast({
        type: 'error',
        title: 'Missing Requirements',
        message: 'Please set at least a budget and a deadline.'
      })
      return
    }

    setShipperTerms(formData)
    addToast({
      type: 'success',
      title: 'Commercial Terms Set',
      message: 'Negotiation sequence initiated. Waiting for Carrier constraints.'
    })

    setTimeout(() => {
      router.push('/role-selection?notification=carrier_action')
    }, 1500)
  }

  // Calculate avg rating from historical signals
  const avgRating = customerRatings.length > 0
    ? (customerRatings.reduce((acc, r) => acc + r.rating, 0) / customerRatings.length).toFixed(1)
    : "N/A"

  return (
    <CinematicLayout>
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <ProgressIndicator
        steps={steps}
        currentStep="terms"
        completedSteps={[]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-teal-400 bg-clip-text text-transparent">
                Commercial Negotiation Terminal
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              You own the contractual framework. Set the pricing, SLA rules, and priority weights.
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Left Sidebar: Historical Signals */}
            <div className="lg:col-span-1 space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-cyan-500/5 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <UserCheck className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-bold text-white">Customer Signals</h3>
                </div>

                {!customerExpectations ? (
                  <div className="text-gray-500 text-sm italic py-4">Waiting for customer expectations...</div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase mb-1">Speed</p>
                        <p className="text-lg font-bold text-cyan-400">{customerExpectations.speedPriority}%</p>
                      </div>
                      <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase mb-1">Reliability</p>
                        <p className="text-lg font-bold text-purple-400">{customerExpectations.reliabilityPriority}%</p>
                      </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl">
                      <p className="text-xs text-gray-400 mb-2">Passive Feedback Notes:</p>
                      <p className="text-sm text-gray-300 italic">"{customerExpectations.notes || "No additional notes provided"}"</p>
                    </div>
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400 uppercase">Avg Quality Signal</span>
                    <span className="text-xl font-bold text-yellow-400">{avgRating}★</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{ width: `${(parseFloat(avgRating) || 0) * 20}%` }}
                    />
                  </div>
                </div>
              </motion.div>

              <div className="p-6 bg-purple-500/5 border border-purple-500/20 rounded-2xl space-y-4">
                <div className="flex items-center space-x-2 text-purple-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-bold uppercase">AI Strategy Advice</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed italic">
                  "Based on customer signals and historical reliability, I suggest setting a higher penalty for delays exceeding 24 hours while maintaining flexible fuel adjustments to attract premium carriers."
                </p>
              </div>
            </div>

            {/* Main Terms Form */}
            <div className="lg:col-span-3">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Core Terms */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-8"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Budget & Pricing</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <label className="text-sm text-gray-400">Target Base Budget</label>
                        <span className="text-cyan-400 font-bold">${formData.baseBudget}</span>
                      </div>
                      <input
                        type="range"
                        min="300"
                        max="2000"
                        step="50"
                        value={formData.baseBudget}
                        onChange={(e) => handleInputChange('baseBudget', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm text-gray-400 block">Required Deadline</label>
                      <input
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => handleInputChange('deadline', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-cyan-500 transition-all"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm text-gray-400 block">Primary Priority Weight</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['cost', 'speed', 'reliability'].map((p) => (
                          <button
                            key={p}
                            onClick={() => handleInputChange('priorityWeight', p)}
                            className={`py-2 px-3 rounded-lg text-xs font-bold capitalize border transition-all ${formData.priorityWeight === p
                              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                              : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/20'
                              }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* SLA & Penalties */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-8"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-white">SLA Rules & Penalties</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <label className="text-sm text-gray-400">Delay Penalty (%)</label>
                        <span className="text-purple-400 font-bold">{formData.slaRules.delayPenalty}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={formData.slaRules.delayPenalty}
                        onChange={(e) => handleSLAChange('delayPenalty', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <label className="text-sm text-gray-400">Max Delay Tolerance (Hrs)</label>
                        <span className="text-purple-400 font-bold">{formData.slaRules.maxDelayTolerance}h</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="120"
                        value={formData.slaRules.maxDelayTolerance}
                        onChange={(e) => handleSLAChange('maxDelayTolerance', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 uppercase flex items-center space-x-1">
                          <Activity className="w-3 h-3" />
                          <span>Peak Multiplier</span>
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.slaRules.peakChargeMultiplier}
                          onChange={(e) => handleSLAChange('peakChargeMultiplier', parseFloat(e.target.value))}
                          className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-purple-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 uppercase flex items-center space-x-1">
                          <Fuel className="w-3 h-3" />
                          <span>Fuel Cap (%)</span>
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={formData.slaRules.fuelAdjustmentCap}
                          onChange={(e) => handleSLAChange('fuelAdjustmentCap', parseInt(e.target.value))}
                          className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Legal Clauses / Special Requirements */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
              >
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center text-teal-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Specific Contractual Clauses</h3>
                </div>
                <textarea
                  value={formData.specialTerms}
                  onChange={(e) => handleInputChange('specialTerms', e.target.value)}
                  placeholder="Enter any custom clauses or specific requirements regarding insurance, equipment type, or driver certifications..."
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-teal-500 transition-all mb-8"
                />

                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center space-x-3 text-cyan-400 bg-cyan-400/5 px-4 py-2 rounded-full border border-cyan-400/20">
                    <Activity className="w-4 h-4 animate-pulse" />
                    <span className="text-sm font-medium">Platform Ready: Real-time Negotiation Protocol Active</span>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={!isValid}
                    className={`group relative px-12 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-bold text-xl overflow-hidden transition-all duration-300 ${!isValid ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-[0_0_40px_rgba(0,245,255,0.3)]'
                      }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center space-x-3">
                      <span>Initiatize AI Negotiation</span>
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </CinematicLayout>
  )
}
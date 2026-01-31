'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, DollarSign, AlertTriangle, Clock, Star, ArrowRight, Truck, Database, Wind, Thermometer, ShieldCheck, FileText } from 'lucide-react'
import ProgressIndicator from '../../components/ProgressIndicator'
import { ToastContainer, ToastProps } from '../../components/Toast'
import CinematicLayout from '../../components/CinematicLayout'
import { useWorkflow } from '../../components/WorkflowContext'

const availableRoutes = ['North America (West)', 'North America (East)', 'Europe (Central)', 'Europe (North)', 'Asia (East)', 'Latin America']

const riskFactors = [
  { id: 'fuel', label: 'Fuel Volatility', description: 'Recent price surges in diesel/petrol', severity: 'high' },
  { id: 'weather', label: 'Severe Weather', description: 'Forecasted storms along the North-East route', severity: 'medium' },
  { id: 'capacity', label: 'Asset Shortage', description: 'Peak season vehicle availability is limited', severity: 'medium' },
  { id: 'holiday', label: 'Public Holiday', description: 'Customs and ports closed during transition', severity: 'low' }
]

export default function CarrierDashboard() {
  const { state, shipperTerms, setCarrierConstraints } = useWorkflow()
  const router = useRouter()

  const [formData, setFormData] = useState({
    routes: [] as string[],
    operationalCapacity: 80, // %
    riskAssessment: [] as string[],
    fuelConstraintLevel: 'medium', // low, medium, high
    baseOperationalCost: 450,
    specialNotes: ''
  })

  const [toasts, setToasts] = useState<ToastProps[]>([])
  const [isValid, setIsValid] = useState(false)

  const steps = [
    { id: 'constraints', title: 'Operational Constraints', description: 'Asset & route feasibility' },
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

  const handleRouteToggle = (route: string) => {
    const newRoutes = formData.routes.includes(route)
      ? formData.routes.filter(r => r !== route)
      : [...formData.routes, route]

    setFormData({ ...formData, routes: newRoutes })
    setIsValid(newRoutes.length > 0)
  }

  const handleRiskToggle = (riskId: string) => {
    const newRisks = formData.riskAssessment.includes(riskId)
      ? formData.riskAssessment.filter(r => r !== riskId)
      : [...formData.riskAssessment, riskId]

    setFormData({ ...formData, riskAssessment: newRisks })
  }

  const handleSubmit = () => {
    if (!isValid) {
      addToast({
        type: 'error',
        title: 'Route Required',
        message: 'Please select at least one route to assess feasibility.'
      })
      return
    }

    setCarrierConstraints(formData)
    addToast({
      type: 'success',
      title: 'Constraints Submitted',
      message: 'All stakeholder data captured. Triggering Dual AI Negotiation sequence...'
    })

    setTimeout(() => {
      router.push('/negotiation?role=carrier')
    }, 1500)
  }

  return (
    <CinematicLayout>
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <ProgressIndicator
        steps={steps}
        currentStep="constraints"
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
              <span className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
                Operational Feasibility Hub
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Respond to the commercial framework with your operational reality. Define your capacity and risk profile.
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Left Sidebar: Shipper's Terms (Read-Only) */}
            <div className="lg:col-span-1 space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-orange-500/5 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-6"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <FileText className="w-5 h-5 text-orange-400" />
                  <h3 className="text-lg font-bold text-white">Shipper Requirements</h3>
                </div>

                {!shipperTerms ? (
                  <div className="text-gray-500 text-sm italic py-4">Waiting for Shipper to initiate...</div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase mb-1">Target Budget</p>
                        <p className="text-lg font-bold text-green-400">${shipperTerms.baseBudget}</p>
                      </div>
                      <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase mb-1">Deadline</p>
                        <p className="text-sm font-bold text-cyan-400">{new Date(shipperTerms.deadline).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="bg-white/5 p-4 rounded-xl space-y-3">
                      <p className="text-[10px] text-gray-500 uppercase">SLA Rules (Key):</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Delay Penalty</span>
                        <span className="text-white font-bold">{shipperTerms.slaRules.delayPenalty}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Fuel Cap</span>
                        <span className="text-white font-bold">{shipperTerms.slaRules.fuelAdjustmentCap}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex items-start space-x-3">
                <Database className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <p className="text-xs text-gray-400 leading-relaxed italic">
                  "Asset data synchronized. Your reliability score is currently 92%. The AI will use this as a bargaining chip for better pricing terms."
                </p>
              </div>
            </div>

            {/* Main Form */}
            <div className="lg:col-span-3 space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Route & Capacity */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-8"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center text-orange-400">
                      <Truck className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Route Capacity</h3>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm text-gray-400">Available Logistics Routes</label>
                    <div className="grid grid-cols-2 gap-3">
                      {availableRoutes.map((route) => (
                        <button
                          key={route}
                          onClick={() => handleRouteToggle(route)}
                          className={`p-3 rounded-xl border text-xs font-medium transition-all ${formData.routes.includes(route)
                            ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                            : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/10'
                            }`}
                        >
                          {route}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <label className="text-sm text-gray-400">Operational Capacity Utilization</label>
                      <span className="text-orange-400 font-bold">{formData.operationalCapacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.operationalCapacity}
                      onChange={(e) => setFormData({ ...formData, operationalCapacity: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                  </div>
                </motion.div>

                {/* Risk & Environment */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-8"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center text-red-500">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Risk Environment</h3>
                  </div>

                  <div className="space-y-4">
                    {riskFactors.map((risk) => (
                      <button
                        key={risk.id}
                        onClick={() => handleRiskToggle(risk.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${formData.riskAssessment.includes(risk.id)
                          ? 'bg-red-500/10 border-red-500/50'
                          : 'bg-white/5 border-white/5 hover:bg-white/10'
                          }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-sm font-bold ${formData.riskAssessment.includes(risk.id) ? 'text-red-400' : 'text-gray-300'}`}>{risk.label}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${risk.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                            risk.severity === 'medium' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'
                            }`}>
                            {risk.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500">{risk.description}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Cost Basis & Constraints */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-8"
              >
                <div className="grid md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <Wind className="w-5 h-5 text-blue-400" />
                      <h3 className="text-xl font-bold text-white">Fuel Constraints</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {['low', 'medium', 'high'].map(l => (
                        <button
                          key={l}
                          onClick={() => setFormData({ ...formData, fuelConstraintLevel: l })}
                          className={`py-4 px-2 rounded-xl border text-xs font-bold capitalize transition-all ${formData.fuelConstraintLevel === l
                            ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                            : 'bg-white/5 border-white/5 text-gray-500'
                            }`}
                        >
                          {l} Impact
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <Thermometer className="w-5 h-5 text-pink-400" />
                        <h3 className="text-xl font-bold text-white">Operational Cost Basis</h3>
                      </div>
                      <span className="text-2xl font-bold text-pink-400">${formData.baseOperationalCost}</span>
                    </div>
                    <input
                      type="range"
                      min="200"
                      max="1500"
                      step="25"
                      value={formData.baseOperationalCost}
                      onChange={(e) => setFormData({ ...formData, baseOperationalCost: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                  </div>
                </div>

                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center space-x-3 text-green-400 bg-green-400/5 px-4 py-2 rounded-full border border-green-400/20">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-sm font-medium">Compliance Verified: EU/US DOT Standards Logged</span>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={!isValid}
                    className={`group relative px-12 py-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl font-bold text-xl overflow-hidden transition-all duration-300 ${!isValid ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-[0_0_40px_rgba(249,115,22,0.3)]'
                      }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center space-x-3">
                      <span>Finalize Feasibility</span>
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
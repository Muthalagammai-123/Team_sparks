'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Calendar, DollarSign, Clock, AlertTriangle, FileText, ArrowRight, Activity, Percent, Fuel, Sparkles, UserCheck, MapPin, User } from 'lucide-react'
import ProgressIndicator from '../../components/ProgressIndicator'
import { ToastContainer, ToastProps } from '../../components/Toast'
import CinematicLayout from '../../components/CinematicLayout'
import { useWorkflow } from '../../components/WorkflowContext'
import ShipperNotifications from '../../components/ShipperNotifications'
import { supabase } from '../../lib/supabase'
import ShipmentHistory from '../../components/ShipmentHistory'

export default function ShipperDashboard() {
  const { state, customerExpectations, customerRatings, setShipperTerms, setNegotiationData, setShipmentId } = useWorkflow()
  const router = useRouter()

  const [formData, setFormData] = useState({
    minBudget: 300,
    maxBudget: 2000,
    deadline: '',
    timeWindow: '',
    priorityLevel: 'Normal',
    source: '',
    destination: '',
    slaRules: {
      delayPenalty: 15,
      maxDelayTolerance: 48, // hours
      peakChargeMultiplier: 1.2,
      fuelAdjustmentCap: 5 // %
    },
    specialConditions: [] as string[],
    specialTerms: ''
  })

  const [toasts, setToasts] = useState<ToastProps[]>([])
  const [isValid, setIsValid] = useState(false)
  const [activeView, setActiveView] = useState<'create' | 'history'>('create')

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
    setIsValid(Boolean(newData.deadline && newData.minBudget > 0 && newData.maxBudget > 0 && newData.source && newData.destination))
  }

  const handleSLAChange = (field: string, value: any) => {
    const newData = {
      ...formData,
      slaRules: { ...formData.slaRules, [field]: value }
    }
    setFormData(newData)
  }

  const [discoveredCarriers, setDiscoveredCarriers] = useState<any[]>([])
  const [searchingCarriers, setSearchingCarriers] = useState(false)

  useEffect(() => {
    if (formData.source.length > 3) {
      const timer = setTimeout(() => {
        findNearbyCarriers()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [formData.source])

  const findNearbyCarriers = async () => {
    setSearchingCarriers(true)
    try {
      const response = await fetch('/api/carriers/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: formData.source })
      })
      const data = await response.json()
      setDiscoveredCarriers(data.carriers || [])
    } catch (error) {
      console.error('Error finding carriers:', error)
    } finally {
      setSearchingCarriers(false)
    }
  }

  const handleSubmit = async () => {
    if (!isValid) {
      addToast({
        type: 'error',
        title: 'Missing Requirements',
        message: 'Please fill in all required fields: budget range, deadline, source, and destination.'
      })
      return
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        addToast({
          type: 'error',
          title: 'Authentication Error',
          message: 'Please log in to create a shipment request.'
        })
        return
      }

      // Call API to create shipment and notify carriers
      const response = await fetch('/api/shipments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          shipperId: user.id
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create shipment')
      }

      setShipperTerms(formData)
      setNegotiationData(null) // Clear previous results to force fresh negotiation
      setShipmentId(result.shipment.id)
      if (result.notificationStatus === 'error') {
        addToast({
          type: 'error',
          title: 'Partial Success',
          message: `Shipment created, but broadcast failed: ${result.notificationError}. Please run the SQL fix.`
        })
      } else {
        addToast({
          type: 'success',
          title: 'Shipment Request Created',
          message: `Successfully notified ${result.notifiedCarriersCount} carriers near ${formData.source}.`
        })
      }

      // Reset form
      setFormData({
        minBudget: 300,
        maxBudget: 2000,
        deadline: '',
        timeWindow: '',
        priorityLevel: 'Normal',
        source: '',
        destination: '',
        slaRules: {
          delayPenalty: 15,
          maxDelayTolerance: 48,
          peakChargeMultiplier: 1.2,
          fuelAdjustmentCap: 5
        },
        specialConditions: [],
        specialTerms: ''
      })

      // Switch to history view to show the new shipment
      setTimeout(() => {
        setActiveView('history')
      }, 1500)

    } catch (error: any) {
      console.error('Submission error:', error)
      addToast({
        type: 'error',
        title: 'Submission Failed',
        message: error.message || 'Failed to create shipment request. Please try again.'
      })
    }
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
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Shipper Central</h2>
                <p className="text-xs text-gray-500">Enterprise Logistics Terminal</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <ShipperNotifications />
              <button className="flex items-center space-x-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-sm font-medium text-gray-300">Shipper Account</span>
              </button>
            </div>
          </div>

          <div className="text-center mb-12">
            {/* View Toggle */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-1">
                <button
                  onClick={() => setActiveView('create')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${activeView === 'create'
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  Create Request
                </button>
                <button
                  onClick={() => setActiveView('history')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${activeView === 'history'
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  Shipment History
                </button>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-teal-400 bg-clip-text text-transparent">
                {activeView === 'create' ? 'Commercial Negotiation Terminal' : 'Shipment Tracking'}
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {activeView === 'create'
                ? 'You own the contractual framework. Set the pricing, SLA rules, and priority weights.'
                : 'Track all your shipment requests and their current status.'
              }
            </p>
          </div>

          {activeView === 'create' ? (
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
                      <h3 className="text-xl font-bold text-white">Budget & Cost Expectations</h3>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm text-gray-400 block">Min Budget ($)</label>
                          <input
                            type="number"
                            value={formData.minBudget || ''}
                            onChange={(e) => handleInputChange('minBudget', parseInt(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-cyan-500 transition-all placeholder-gray-600"
                            placeholder="Min"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-gray-400 block">Max Budget ($)</label>
                          <input
                            type="number"
                            value={formData.maxBudget || ''}
                            onChange={(e) => handleInputChange('maxBudget', parseInt(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-cyan-500 transition-all placeholder-gray-600"
                            placeholder="Max"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm text-gray-400 block">Delivery Deadline</label>
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="date"
                            value={formData.deadline}
                            onChange={(e) => handleInputChange('deadline', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-cyan-500 transition-all"
                            min={new Date().toISOString().split('T')[0]}
                          />
                          <input
                            type="time"
                            value={formData.timeWindow || ''}
                            onChange={(e) => handleInputChange('timeWindow', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-cyan-500 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm text-gray-400 block">Source & Destination</label>
                        <div className="space-y-3">
                          <div className="relative group">
                            <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                            <input
                              type="text"
                              placeholder="Source Location (e.g., San Francisco, CA)"
                              value={formData.source}
                              onChange={(e) => handleInputChange('source', e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-white placeholder-gray-500 outline-none focus:border-cyan-500 transition-all"
                              required
                            />
                          </div>
                          <div className="relative group">
                            <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                            <input
                              type="text"
                              placeholder="Destination Location (e.g., Los Angeles, CA)"
                              value={formData.destination}
                              onChange={(e) => handleInputChange('destination', e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-white placeholder-gray-500 outline-none focus:border-cyan-500 transition-all"
                              required
                            />
                          </div>

                          {/* Discovered Carriers Section */}
                          {(searchingCarriers || discoveredCarriers.length >= 0) && formData.source.length > 3 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 space-y-3"
                            >
                              <div className="flex justify-between items-center">
                                <h4 className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                                  <Activity className="w-3 h-3" />
                                  Nearby Carriers
                                </h4>
                                {searchingCarriers ? (
                                  <div className="flex space-x-1">
                                    <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" />
                                    <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                  </div>
                                ) : (
                                  <span className="text-[8px] text-gray-500 uppercase tracking-widest">Live Discovery</span>
                                )}
                              </div>

                              <div className="grid gap-2">
                                {discoveredCarriers.length === 0 && !searchingCarriers ? (
                                  <div className="py-8 text-center bg-black/20 rounded-lg border border-dashed border-white/5">
                                    <UserCheck className="w-6 h-6 text-gray-700 mx-auto mb-2 opacity-20" />
                                    <p className="text-[10px] text-gray-500">No nearby carriers found for this location.</p>
                                    <p className="text-[8px] text-gray-600 mt-1 uppercase">Try Chennai, Madurai, or Coimbatore</p>
                                  </div>
                                ) : (
                                  discoveredCarriers.map((carrier, idx) => (
                                    <div
                                      key={carrier.id}
                                      className="bg-black/40 border border-white/5 rounded-lg p-3 flex flex-col space-y-2 hover:border-cyan-500/30 transition-all cursor-default"
                                    >
                                      {/* Existing carrier layout */}
                                      <div className="flex justify-between items-start">
                                        <div className="flex items-center space-x-2">
                                          <div className="w-7 h-7 bg-cyan-500/10 rounded-full flex items-center justify-center border border-cyan-500/20">
                                            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                                          </div>
                                          <div>
                                            <p className="text-xs font-medium text-white">{carrier.email}</p>
                                            <p className="text-[10px] text-gray-500">{carrier.location}</p>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-xs font-bold text-cyan-400">{carrier.distance} KM</p>
                                          <p className="text-[9px] text-gray-500 uppercase">Distance</p>
                                        </div>
                                      </div>
                                      <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                        <div className="flex items-center space-x-3">
                                          <div>
                                            <p className="text-[10px] font-bold text-purple-400">{carrier.time}</p>
                                            <p className="text-[8px] text-gray-500 uppercase">Est. Arrival</p>
                                          </div>
                                          <div className="flex items-center space-x-1 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20">
                                            <Sparkles className="w-2.5 h-2.5 text-yellow-400" />
                                            <span className="text-[10px] font-bold text-yellow-400">{carrier.reliability}</span>
                                          </div>
                                        </div>
                                        <span className="text-[8px] px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded border border-green-500/20 uppercase">
                                          Available
                                        </span>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </motion.div>
                          )}

                          {formData.source && formData.destination && (
                            <button
                              type="button"
                              onClick={() => {
                                const mapUrl = `https://www.google.com/maps/dir/${encodeURIComponent(formData.source)}/${encodeURIComponent(formData.destination)}`
                                window.open(mapUrl, '_blank')
                              }}
                              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-cyan-500/20 transition-all"
                            >
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm font-medium">View Route on Map</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm text-gray-400 block">Priority Level</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['Normal', 'Urgent', 'Seasonal'].map((p) => (
                            <button
                              key={p}
                              onClick={() => handleInputChange('priorityLevel', p)}
                              className={`py-2 px-3 rounded-lg text-xs font-bold capitalize border transition-all ${formData.priorityLevel === p
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

                {/* Special Requirements */}
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
                    <h3 className="text-xl font-bold text-white">Special Conditions & Clauses</h3>
                  </div>

                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {['Fragile', 'Bulk', 'Refrigerated', 'Hazardous', 'Express', 'Oversized'].map((condition) => (
                      <div
                        key={condition}
                        onClick={() => {
                          const current = formData.specialConditions || []
                          const next = current.includes(condition)
                            ? current.filter(c => c !== condition)
                            : [...current, condition]
                          handleInputChange('specialConditions', next)
                        }}
                        className={`cursor-pointer px-4 py-3 rounded-xl border flex items-center justify-center space-x-2 transition-all ${(formData.specialConditions || []).includes(condition)
                          ? 'bg-teal-500/20 border-teal-500 text-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.2)]'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                          }`}
                      >
                        <span className="text-sm font-medium">{condition}</span>
                      </div>
                    ))}
                  </div>

                  <textarea
                    value={formData.specialTerms}
                    onChange={(e) => handleInputChange('specialTerms', e.target.value)}
                    placeholder="Enter any additional custom requirements or notes..."
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-teal-500 transition-all mb-8 placeholder-gray-600"
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
          ) : (
            <ShipmentHistory />
          )}
        </motion.div>
      </div>
    </CinematicLayout>
  )
}
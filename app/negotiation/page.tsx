'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot, Shield, ArrowRight, CheckCircle,
  Terminal, Activity, Scale, Info, AlertTriangle,
  DollarSign, Clock, Zap, Gavel
} from 'lucide-react'
import ProgressIndicator from '../../components/ProgressIndicator'
import LoadingSpinner from '../../components/LoadingSpinner'
import CinematicLayout from '../../components/CinematicLayout'
import { useWorkflow } from '../../components/WorkflowContext'

export default function NegotiationPage() {
  const {
    state,
    shipperTerms,
    carrierConstraints,
    isLoaded,
    negotiationData: persistentNegotiationData,
    setNegotiationData: setPersistentNegotiationData,
    shipmentId,
    carrierId
  } = useWorkflow()
  const router = useRouter()

  const [isProcessing, setIsProcessing] = useState(false)
  const [localNegotiationData, setLocalNegotiationData] = useState<any>(null)
  const [currentClauseIndex, setCurrentClauseIndex] = useState(-1)
  const [logs, setLogs] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // 1. Redirection Logic (Persistent Guard)
  useEffect(() => {
    if (isLoaded) {
      if (!shipperTerms) {
        router.push('/shipper-dashboard')
      } else if (!carrierConstraints) {
        router.push('/carrier-dashboard')
      }
    }
  }, [isLoaded, shipperTerms, carrierConstraints, router])

  // 2. State Rehydration & Negotiation Trigger
  useEffect(() => {
    if (!isLoaded || !shipperTerms || !carrierConstraints) return

    // If we have results, but they are from an old version (missing agreement), clear and re-run
    if (persistentNegotiationData && !persistentNegotiationData.agreement) {
      setPersistentNegotiationData(null)
      return
    }

    // If we already have persistent results, just show them
    if (persistentNegotiationData) {
      setLocalNegotiationData(persistentNegotiationData)
      setCurrentClauseIndex(persistentNegotiationData.clauses.length - 1)
      setIsProcessing(false)
      setLogs(['Consensus restored from secure storage.', 'Final agreement validated.'])
      return
    }

    // Otherwise, trigger the AI negotiation exactly once
    const triggerNegotiation = async () => {
      if (isProcessing) return

      setIsProcessing(true)
      setError(null)
      setLogs(['Initializing Dual-Advocate Handshake...', 'Synchronizing Shipper/Carrier nodes...'])

      try {
        const response = await fetch('http://localhost:8000/negotiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shipperTerms, carrierConstraints, shipment_id: shipmentId, carrier_id: carrierId })
        })

        if (!response.ok) throw new Error(`Server Sync Failed: ${response.status}`)

        const data = await response.json()
        setLocalNegotiationData(data)

        // Visual Reveal Loop
        for (let i = 0; i < data.clauses.length; i++) {
          setCurrentClauseIndex(i)
          setLogs(prev => [...prev, `Analyzing ${data.clauses[i].title}...`, `Clause #${i + 1} Secured: ${data.clauses[i].status.toUpperCase()}`])
          await new Promise(r => setTimeout(r, 1500))
        }

        // Finalize
        setIsProcessing(false)
        setPersistentNegotiationData(data) // Cache it for persistence
        setLogs(prev => [...prev, 'Consensus reached.', 'Digital handshake complete.'])

        // Auto-navigate to contract after 3 seconds
        setTimeout(() => {
          router.push('/contract?role=shipper')
        }, 3000)

      } catch (err: any) {
        console.error('Trigger Failed:', err)
        setError(err.message || 'Negotiation engine unavailable.')
        setIsProcessing(false)
      }
    }

    triggerNegotiation()
  }, [isLoaded, shipperTerms, carrierConstraints, persistentNegotiationData])

  const steps = [
    { id: 'terms', title: 'Commercial Terms', description: 'Define pricing & SLAs' },
    { id: 'negotiation', title: 'AI Negotiation', description: 'Dual agents advocates' },
    { id: 'contract', title: 'Execution', description: 'Final approval' }
  ]

  // UI States
  if (!isLoaded || (isLoaded && (!shipperTerms || !carrierConstraints))) {
    return (
      <CinematicLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <LoadingSpinner text={!isLoaded ? "Synchronizing Session..." : "Escorting to Dashboard..."} />
        </div>
      </CinematicLayout>
    )
  }

  if (error) {
    return (
      <CinematicLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-full animate-bounce">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold">Negotiation Interrupted</h2>
            <p className="text-gray-400 mt-2">{error}</p>
          </div>
          <button onClick={() => window.location.reload()} className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold">
            Re-initiate Protocol
          </button>
        </div>
      </CinematicLayout>
    )
  }

  const activeData = localNegotiationData || persistentNegotiationData

  return (
    <CinematicLayout>
      <ProgressIndicator
        steps={steps}
        currentStep="negotiation"
        completedSteps={['terms']}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-12 gap-8">

          {/* Main Stage: Negotiation Visualization */}
          <div className="lg:col-span-8 space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 relative overflow-hidden"
            >
              {/* Background Glows */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-orange-500 opacity-50" />

              <div className="flex justify-between items-center mb-12">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-20 h-20 bg-cyan-500/10 rounded-2xl border-2 border-cyan-500/50 flex items-center justify-center relative">
                    <Bot className="w-10 h-10 text-cyan-400" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black" />
                  </div>
                  <span className="text-sm font-bold text-cyan-400 uppercase tracking-widest">Shipper Advocate</span>
                </div>

                <div className="flex flex-col items-center space-y-2">
                  <div className="flex items-center space-x-2 text-gray-500">
                    <Activity className="w-4 h-4 animate-pulse" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Cross-Node Sync</span>
                  </div>
                  <div className="h-[2px] w-32 bg-gradient-to-r from-cyan-500/20 via-white/20 to-orange-500/20 relative">
                    <motion.div
                      animate={{ x: [-64, 64] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute h-full w-4 bg-white/40 blur-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center space-y-4">
                  <div className="w-20 h-20 bg-orange-500/10 rounded-2xl border-2 border-orange-500/50 flex items-center justify-center relative">
                    <Bot className="w-10 h-10 text-orange-400" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black" />
                  </div>
                  <span className="text-sm font-bold text-orange-400 uppercase tracking-widest">Carrier Advocate</span>
                </div>
              </div>

              {/* Clause Progress List */}
              <div className="space-y-4">
                {activeData?.clauses.map((clause: any, idx: number) => (
                  <motion.div
                    key={clause.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{
                      opacity: idx <= currentClauseIndex ? 1 : 0.3,
                      x: idx <= currentClauseIndex ? 0 : -10
                    }}
                    className={`grid grid-cols-12 gap-4 p-4 rounded-xl border transition-all ${idx === currentClauseIndex
                      ? 'bg-white/10 border-white/20 shadow-lg scale-[1.02]'
                      : 'bg-white/5 border-white/5'
                      }`}
                  >
                    <div className="col-span-1 flex items-center justify-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${idx < currentClauseIndex ? 'bg-green-500/20 border-green-500 text-green-400' :
                        idx === currentClauseIndex ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 animate-pulse' :
                          'bg-white/5 border-white/10 text-gray-600'
                        }`}>
                        {idx < currentClauseIndex ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                      </div>
                    </div>

                    <div className="col-span-3">
                      <h4 className="text-sm font-bold text-white">{clause.title}</h4>
                      <div className="text-[10px] text-gray-500 uppercase mt-1">Status: {clause.status}</div>
                    </div>

                    <div className="col-span-8 grid grid-cols-3 gap-2">
                      <div className="text-center p-2 rounded bg-cyan-900/10 border border-cyan-500/10">
                        <p className="text-[8px] text-gray-500 uppercase mb-1">Shipper</p>
                        <p className="text-xs text-cyan-300 font-mono italic">{clause.shipper_position}</p>
                      </div>
                      <div className="text-center p-2 rounded bg-orange-900/10 border border-orange-500/10">
                        <p className="text-[8px] text-gray-500 uppercase mb-1">Carrier</p>
                        <p className="text-xs text-orange-300 font-mono italic">{clause.carrier_position}</p>
                      </div>
                      <div className="text-center p-2 rounded bg-green-900/10 border border-green-500/20 flex flex-col justify-center">
                        <p className="text-[8px] text-gray-500 uppercase mb-1">Resolved</p>
                        <p className="text-xs text-green-400 font-bold">{idx <= currentClauseIndex ? clause.negotiated : '...'}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Final Summary Overlay */}
              {!isProcessing && activeData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 p-6 bg-gradient-to-r from-green-500/20 to-cyan-500/20 rounded-2xl border border-green-500/30"
                >
                  <div className="flex items-center space-x-3 mb-2 text-green-400">
                    <Sparkles className="w-5 h-5" />
                    <h4 className="font-bold">Negotiation Consensus Reached</h4>
                  </div>
                  <p className="text-sm text-gray-300">{activeData.summary}</p>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Right Sidebar: Logs & Insights */}
          <div className="lg:col-span-4 space-y-8">
            {/* Real-time System Log */}
            <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                <div className="flex items-center space-x-2 text-cyan-400">
                  <Terminal className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Audit Terminal</span>
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-red-500/50" />
                  <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                  <div className="w-2 h-2 rounded-full bg-green-500/50" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[10px] custom-scrollbar">
                {logs.map((log, i) => (
                  <div key={i} className="flex space-x-2">
                    <span className="text-gray-600">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                    <span className={log.includes('Secured') || log.includes('Consensus') ? 'text-green-400' : 'text-cyan-300'}>$ {log}</span>
                  </div>
                ))}
                {isProcessing && (
                  <div className="animate-pulse flex space-x-2 text-cyan-500">
                    <span>$</span>
                    <div className="w-2 h-4 bg-cyan-500/50" />
                  </div>
                )}
              </div>
            </div>

            {/* Negotiation Scorecard */}
            <motion.div
              animate={!isProcessing && activeData ? { scale: [1, 1.02, 1] } : {}}
              className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-3xl border border-white/10 rounded-3xl p-8"
            >
              <h3 className="text-lg font-bold text-white mb-6 flex items-center space-x-2">
                <Scale className="w-5 h-5 text-purple-400" />
                <span>Confidence Assessment</span>
              </h3>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{activeData?.confidence_score || 0}%</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Fairness Score</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{activeData?.negotiation_rounds || 0}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Audit Rounds</p>
                </div>
              </div>

              {!isProcessing && activeData && (
                <button
                  onClick={() => router.push('/contract?role=shipper')}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-bold text-lg hover:shadow-[0_0_30px_rgba(147,51,234,0.4)] transition-all flex items-center justify-center space-x-3"
                >
                  <span>Finalize Contract</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </CinematicLayout>
  )
}

function Sparkles(props: any) {
  return <Zap {...props} />
}
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Shield, CheckCircle, Download,
  Eye, Info, Scale, Gavel, ArrowLeft,
  DollarSign, Clock, AlertTriangle, Zap,
  ChevronRight, Lock, Unlock, FileCheck
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import ProgressIndicator from '../../components/ProgressIndicator'
import LoadingSpinner from '../../components/LoadingSpinner'
import CinematicLayout from '../../components/CinematicLayout'
import { useWorkflow } from '../../components/WorkflowContext'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function ContractPage() {
  const searchParams = useSearchParams()
  const role = searchParams.get('role') // 'shipper' | 'carrier' | 'customer'
  const isShipper = role === 'shipper'
  const isCarrier = role === 'carrier'
  const isCustomer = role === 'customer'

  const { shipperTerms, carrierConstraints, negotiationData: globalNegotiationData, isLoaded } = useWorkflow()
  const [viewMode, setViewMode] = useState<'legal' | 'human'>('human')
  const [isApproved, setIsApproved] = useState(false)
  const [negotiationData, setNegotiationData] = useState<any>(null)
  const contractRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isLoaded) {
      if (globalNegotiationData) {
        setNegotiationData(globalNegotiationData)
      } else if (shipperTerms && carrierConstraints) {
        // Redirect back to negotiation if somehow we have inputs but no result
        window.location.href = '/negotiation'
      } else if (!shipperTerms) {
        window.location.href = '/shipper-dashboard'
      } else if (!carrierConstraints) {
        window.location.href = '/carrier-dashboard'
      }
    }
  }, [isLoaded, globalNegotiationData, shipperTerms, carrierConstraints])

  const handleApprove = () => {
    setIsApproved(true)
  }

  const downloadPDF = async () => {
    if (!contractRef.current) return
    const canvas = await html2canvas(contractRef.current)
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF()
    const imgProps = pdf.getImageProperties(imgData)
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(`negotiatex-contract-${role}.pdf`)
  }

  const steps = [
    { id: 'terms', title: 'Commercial Terms', description: 'Define pricing & SLAs' },
    { id: 'negotiation', title: 'AI Negotiation', description: 'Dual agents advocates' },
    { id: 'contract', title: 'Execution', description: 'Final approval' }
  ]

  if (!isLoaded || !negotiationData) {
    return (
      <CinematicLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <LoadingSpinner text="Rehydrating Agreement..." />
        </div>
      </CinematicLayout>
    )
  }

  return (
    <CinematicLayout>
      <ProgressIndicator
        steps={steps}
        currentStep="contract"
        completedSteps={['terms', 'negotiation']}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-green-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Final Dynamic Agreement
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            {isCustomer ? "Viewing post-negotiation results as passive feedback." : "Review the context-aware clauses negotiated by your AI agent."}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Sidebar: Audit & Controls */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-black/60 border border-white/10 rounded-3xl p-6"
            >
              <h3 className="text-lg font-bold text-white mb-6 flex items-center space-x-2">
                <Scale className="w-5 h-5 text-purple-400" />
                <span>Negotiation Audit</span>
              </h3>

              <div className="space-y-6">
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Confidence</p>
                    <p className="text-2xl font-bold text-green-400">{negotiationData.confidence_score}%</p>
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-green-500/20 flex items-center justify-center p-1">
                    <div className="w-full h-full rounded-full border-4 border-green-500 border-t-transparent animate-spin" style={{ animationDuration: '3s' }} />
                    <CheckCircle className="absolute w-5 h-5 text-green-500" />
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-gray-400">Handshake Distribution:</p>
                  <div className="h-2 w-full bg-gray-800 rounded-full flex overflow-hidden">
                    <div className="h-full bg-cyan-500" style={{ width: '48%' }} title="Shipper Weight" />
                    <div className="h-full bg-orange-500" style={{ width: '52%' }} title="Carrier Weight" />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500 uppercase font-bold">
                    <span>Shipper (48%)</span>
                    <span>Carrier (52%)</span>
                  </div>
                </div>

                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                  <p className="text-xs text-blue-300 italic">"The AI balanced the holiday multiplier specifically for the Asia route while securing a Net-30 payment buffer."</p>
                </div>
              </div>
            </motion.div>

            <div className="bg-black/60 border border-white/10 rounded-3xl p-6 space-y-4">
              <button
                onClick={downloadPDF}
                className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center space-x-3 hover:bg-white/10 transition-all group"
              >
                <Download className="w-5 h-5 text-gray-400 group-hover:text-white" />
                <span className="text-sm font-bold text-gray-300 group-hover:text-white">Download Immutable PDF</span>
              </button>
              {!isCustomer && (
                <button
                  onClick={handleApprove}
                  disabled={isApproved}
                  className={`w-full py-4 rounded-2xl flex items-center justify-center space-x-3 transition-all ${isApproved
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                    }`}
                >
                  {isApproved ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Legally Recorded</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-5 h-5" />
                      <span>Approve & Seal Contract</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Main Stage: Contract View */}
          <div className="lg:col-span-8 flex flex-col space-y-6">
            <div className="flex justify-between items-center bg-black/40 p-2 rounded-2xl border border-white/5 self-end">
              <button
                onClick={() => setViewMode('human')}
                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${viewMode === 'human' ? 'bg-cyan-500 text-black' : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                <Eye className="w-4 h-4" />
                <span>Simple View</span>
              </button>
              <button
                onClick={() => setViewMode('legal')}
                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${viewMode === 'legal' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                <Shield className="w-4 h-4" />
                <span>Legal View</span>
              </button>
            </div>

            <motion.div
              key={viewMode}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              ref={contractRef}
              className="bg-white text-gray-900 rounded-3xl p-12 shadow-2xl relative overflow-hidden min-h-[800px]"
            >
              {/* Watermark/Hologram style for UI flair */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-100 rounded-full blur-[100px] opacity-20 -mr-32 -mt-32" />

              <div className="flex justify-between items-start mb-12 border-b border-gray-100 pb-8">
                <div>
                  <h2 className="text-3xl font-serif font-bold text-gray-800">SMART LOGISTICS AGREEMENT</h2>
                  <p className="text-gray-400 font-mono text-xs mt-2">UUID: NEX-7742-AA-9 / V2.0-STAKEHOLDER</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Generated On</p>
                  <p className="text-sm font-bold">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-12">
                {negotiationData.clauses.map((clause: any) => (
                  <section key={clause.id} className="relative group">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className={`text-xl font-bold flex items-center space-x-3 ${viewMode === 'legal' ? 'font-serif uppercase tracking-tight' : ''}`}>
                        <span className="text-cyan-500">§</span>
                        <span>{clause.title}</span>
                      </h3>
                      <div className="flex space-x-2">
                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded border border-gray-200">Clause Agreed</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                      {viewMode === 'legal' ? (
                        <div className="font-serif leading-relaxed text-gray-700 space-y-4">
                          <p>
                            The Parties hereby agree to the following terms regarding <strong>{clause.title}</strong>.
                            The defined index shall be set at <strong>{clause.negotiated}</strong> as of the execution date.
                            Any deviation from this baseline shall trigger an automatic re-calibration event...
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-start space-x-3">
                            <p className="text-lg font-medium text-gray-800">
                              We settled on <span className="text-blue-600 font-bold">{clause.negotiated}</span> for this part.
                            </p>
                          </div>
                          <div className="flex items-start space-x-2 bg-blue-50 p-3 rounded-xl border border-blue-100">
                            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-bold text-blue-800 mb-1">AI Fairness Logic:</p>
                              <p className="text-xs text-blue-600 leading-relaxed">{clause.reasoning}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                ))}
              </div>

              <div className="mt-20 pt-12 border-t-2 border-dashed border-gray-100 grid grid-cols-2 gap-12">
                <div className="space-y-6">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Shipper Digital Vault Checksum</p>
                  <div className="h-24 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center relative">
                    {isApproved && isShipper ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                        <FileCheck className="w-8 h-8 text-blue-500 mb-1" />
                        <span className="text-[8px] font-mono text-blue-400">0x77...AF92 Signed</span>
                      </motion.div>
                    ) : (
                      <span className="text-[10px] text-gray-300 font-mono">[ PENDING SIGNATURE ]</span>
                    )}
                  </div>
                </div>
                <div className="space-y-6">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Carrier Digital Vault Checksum</p>
                  <div className="h-24 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center relative">
                    {isApproved && isCarrier ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                        <FileCheck className="w-8 h-8 text-orange-500 mb-1" />
                        <span className="text-[8px] font-mono text-orange-400">0xAB...1102 Signed</span>
                      </motion.div>
                    ) : (
                      <span className="text-[10px] text-gray-300 font-mono">[ PENDING SIGNATURE ]</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </CinematicLayout>
  )
}
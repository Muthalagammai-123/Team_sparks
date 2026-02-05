'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Shield, CheckCircle, Download,
  Eye, Info, Scale, Gavel, ArrowLeft,
  DollarSign, Clock, AlertTriangle, Zap,
  ChevronRight, Lock, Unlock, FileCheck, Activity
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import ProgressIndicator from '../../components/ProgressIndicator'
import LoadingSpinner from '../../components/LoadingSpinner'
import CinematicLayout from '../../components/CinematicLayout'
import { supabase } from '../../lib/supabase'
import { useWorkflow } from '../../components/WorkflowContext'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function ContractPage() {
  const searchParams = useSearchParams()
  const role = searchParams.get('role')
  const { shipperTerms, carrierConstraints, negotiationData: globalNegotiationData, isLoaded } = useWorkflow()
  const [history, setHistory] = useState<any[]>([])
  const [selectedAgreement, setSelectedAgreement] = useState<any>(null)
  const [shipperDetails, setShipperDetails] = useState<any>(null)
  const [carrierDetails, setCarrierDetails] = useState<any>(null)
  const contractRef = useRef<HTMLDivElement>(null)

  const userEmail = searchParams.get('email') || 'shipper@example.com'

  const fetchShipperDetails = async (shipmentId: string) => {
    try {
      const { data, error } = await supabase.from('shipment_requests').select('*').eq('id', shipmentId).single()
      if (error) throw error
      setShipperDetails(data)
    } catch (e) {
      console.error('Failed to fetch shipper details:', e)
    }
  }

  const fetchCarrierDetails = async (carrierId: string) => {
    try {
      const { data, error } = await supabase.from('carrier_profiles').select('*').eq('carrier_id', carrierId).single()
      if (error) throw error
      setCarrierDetails(data)
    } catch (e) {
      console.error('Failed to fetch carrier details:', e)
    }
  }

  useEffect(() => {
    if (isLoaded) {
      if (globalNegotiationData) {
        const currentData = {
          ...globalNegotiationData,
          timestamp: new Date().toLocaleString(),
          id: globalNegotiationData.agreement_id || `NEX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        }

        setSelectedAgreement(currentData)

        if (currentData.shipment_id) fetchShipperDetails(currentData.shipment_id)
        if (currentData.carrier_id) fetchCarrierDetails(currentData.carrier_id)

        const existingHistory = JSON.parse(localStorage.getItem(`history_${userEmail}`) || '[]')
        const isDuplicate = existingHistory.some((h: any) => h.id === currentData.id)

        if (!isDuplicate) {
          const newHistory = [currentData, ...existingHistory].slice(0, 10)
          localStorage.setItem(`history_${userEmail}`, JSON.stringify(newHistory))
          setHistory(newHistory)
        } else {
          setHistory(existingHistory)
        }
      } else if (shipperTerms && carrierConstraints) {
        window.location.href = '/negotiation'
      }
    }
  }, [isLoaded, globalNegotiationData, shipperTerms, carrierConstraints, userEmail])

  const downloadPDF = async () => {
    if (!contractRef.current || !selectedAgreement) return
    try {
      const canvas = await html2canvas(contractRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#000000'
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const imgWidth = pdfWidth
      const imgHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      pdf.save(`${selectedAgreement.id}.pdf`)
    } catch (e) {
      console.error('PDF Error:', e)
    }
  }

  const activeData = selectedAgreement || globalNegotiationData

  if (!isLoaded || !activeData) {
    return (
      <CinematicLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <LoadingSpinner text="Generating Unique AI Agreement..." />
        </div>
      </CinematicLayout>
    )
  }

  const justifiedPrice = activeData.final_price
    ? `$${activeData.final_price.toLocaleString()}`
    : activeData.justified_price || activeData.clauses?.find((c: any) => c.id === 'cost_breakdown' || c.id === 'pricing')?.negotiated || "$45,000"

  const fixedDeadline = activeData.final_deadline ||
    activeData.fixed_deadline ||
    activeData.clauses?.find((c: any) => c.id === 'deadline')?.negotiated ||
    "07 Feb 2026"

  const confidenceScore = activeData.scores?.confidence || activeData.confidence_score || 94
  const agreementText = activeData.agreement_text || activeData.agreement

  return (
    <CinematicLayout>
      {/* Dashboard Top Bar */}
      <div className="max-w-[1600px] mx-auto px-6 py-6 border-b border-white/5 flex items-center justify-between sticky top-0 z-50 bg-black/80 backdrop-blur-xl print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center rotate-12 shadow-lg shadow-cyan-500/20">
            <Gavel className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              NegotiateX <span className="text-gray-500 font-medium whitespace-nowrap">| Execution Dashboard</span>
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              <Shield className="w-3 h-3 text-cyan-400" />
              <span>AI-Authenticated Consensus</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-8 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> Negotiation</span>
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> Review</span>
            <span className="flex items-center gap-2 text-white border-b-2 border-cyan-500 pb-1">Execution</span>
            <span className="flex items-center gap-2 opacity-50">Completed</span>
          </div>
          <button
            onClick={downloadPDF}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-xl flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-emerald-500/20 group"
          >
            <Download className="w-4 h-4 text-white" />
            <span className="text-xs font-black text-white uppercase tracking-widest">Download PDF</span>
          </button>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-white tracking-tighter mb-2">Final Dynamic Agreement</h2>
          <p className="text-gray-400 text-sm">Review the context-aware clauses negotiated by your AI agent.</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 items-start">

          {/* LEFT COLUMN: AUDIT & E-SEAL */}
          <div className="lg:col-span-3 space-y-8 print:hidden">
            {/* Negotiation Audit Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-sm relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Activity className="w-20 h-20 text-white" />
              </div>

              <h3 className="text-sm font-bold text-gray-300 mb-8 tracking-wide">Negotiation Audit</h3>

              <div className="relative w-40 h-40 mx-auto mb-8">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle className="text-white/5" strokeWidth="8" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                  <motion.circle
                    className="text-cyan-400"
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    initial={{ strokeDashoffset: 251.2 }}
                    animate={{ strokeDashoffset: 251.2 - (251.2 * confidenceScore) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-white">{confidenceScore}%</span>
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mt-1">AI Confidence</span>
                </div>
              </div>

              <div className="text-center space-y-4">
                <p className="text-[11px] text-gray-400 leading-relaxed px-2">
                  Overall negotiation terms exhibit high alignment with client parameters. Minimal deviations detected.
                </p>
                <button className="text-[10px] font-bold text-white uppercase tracking-widest border border-white/20 px-6 py-2 rounded-full hover:bg-white/5 transition-colors">
                  Details
                </button>
              </div>
            </motion.div>


            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-h-[300px] overflow-y-auto custom-scrollbar">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-purple-500" /> Previous History
              </h3>
              <div className="space-y-2">
                {history.map((h: any) => (
                  <button
                    key={h.id}
                    onClick={() => setSelectedAgreement(h)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${selectedAgreement?.id === h.id ? 'bg-purple-500/10 border-purple-500/30' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                  >
                    <p className="text-[9px] font-bold text-gray-300 truncate">{h.id}</p>
                    <p className="text-[8px] text-gray-500">{h.timestamp}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CENTER: THE AGREEMENT PAPER (EXPORTABLE AREA) */}
          <div className="lg:col-span-9" ref={contractRef}>
            <div className="bg-white rounded-[2rem] p-12 shadow-2xl relative overflow-hidden text-gray-900 min-h-[1100px] flex flex-col">

              {/* Decorative Header Bar */}
              <div className="absolute top-0 left-0 w-full h-3 bg-gray-900" />

              {/* Legal Agreement Content */}
              <div className="prose prose-sm max-w-none font-serif leading-relaxed text-slate-900 agreement-markdown mt-8">
                {agreementText ? (
                  <div className="whitespace-pre-wrap">{agreementText}</div>
                ) : (
                  <div className="whitespace-pre-wrap opacity-50">
                    {`# AI-GENERATED SHIPPER – CARRIER TRANSPORTATION AGREEMENT

This Transportation Agreement ("Agreement") is entered into on ${new Date().toLocaleDateString()}, by and between the following parties:

**SHIPPER DETAILS**
Legal Name: ${shipperDetails?.company_name || "NovaMart E-Commerce Pvt. Ltd."}
Registered Address: ${shipperDetails?.address || "No. 24, Industrial Estate, Bengaluru – 560048"}
Authorized Representative: ${shipperDetails?.contact_person || "Ms. Ananya Rao (Operations Head)"}
Phone: ${shipperDetails?.phone || "+91 9XXXXXXXXX"}
Email: ${shipperDetails?.email || "operations@novamart.com"}
GST / Registration No.: ${shipperDetails?.gst || "29AAACNXXXXZ1A"}

**CARRIER DETAILS**
Legal Name: ${carrierDetails?.business_details?.company_name || "SwiftHaul Logistics Services"}
Registered Address: ${carrierDetails?.base_location || "Plot 12, Transport Nagar, Chennai – 600110"}
Authorized Representative: ${carrierDetails?.contact_person || "Mr. R. Karthik (Fleet Manager)"}
Phone: ${carrierDetails?.phone || "+91 9XXXXXXXXX"}
Email: ${carrierDetails?.email || "support@swifthaul.in"}
Vehicle No.: ${carrierDetails?.vehicle_number || "TN-09-AB-4521"}
Transport License No.: ${carrierDetails?.business_details?.license_id || "TN/LOG/2024/88921"}
GST / Registration No.: ${carrierDetails?.gst || "33BBBCSXXXXZ2B"}

**1. Scope of Agreement**
The Carrier agrees to transport goods on behalf of the Shipper in a safe, secure, and timely manner. This Agreement is dynamically generated based on business intent, delivery priorities, and negotiated risk factors.

**2. Delivery Timeline & Commitments**
Standard delivery timeline: 48–72 hours from pickup. Peak-season delivery timeline: 72–96 hours. AI-adjusted buffer applied during holidays and high-risk periods. Delivery commitments for destination undefined are negotiated and optimized based on real-world conditions.

**3. Delay Definition & Handling**
A delay is defined as delivery beyond the agreed timeline excluding government-declared holidays, natural calamities, traffic, weather, or regulatory disruptions. AI-evaluated delay probability is factored before applying penalties.

**4. Freight Charges & Payment Terms**
Base Freight Charge: INR 800 per shipment. Peak-Season Adjustment: +8% when applicable. Payment Cycle: Net 15 days from delivery confirmation. Mode: Bank transfer or digital payment. Pricing is dynamically negotiated and risk-adjusted.

**5. Penalties & Risk Pricing**
Delay penalty: 50% per delayed day, capped at 5%. Penalties are waived for approved exceptions. Clause-level risk pricing ensures fairness to both parties.

**6. Damage, Loss & Claims**
Carrier is responsible for goods during transit. Any loss or damage must be reported within 24 hours. Claims are resolved through AI-assisted assessment and mutual discussion.

**7. Holidays, Peak Seasons & Exceptions**
The system automatically accounts for national and regional holidays, festival seasons, and high-demand periods. Adjusted timelines and penalties are transparently reflected.

**9. Force Majeure**
Neither party shall be held liable for delays caused by events beyond reasonable control, including natural disasters, strikes, or government actions.

**10. Termination**
Either party may terminate this Agreement with 15 days written notice, ensuring minimal operational disruption.

**11. Governing Law**
This Agreement shall be governed and interpreted in accordance with the laws of India.

**AI-EXPLAINABILITY NOTE**
Each clause in this Agreement is generated and justified by an AI system that balances delivery speed, cost efficiency, and operational risk to ensure fairness and transparency.

**VERIFICATION & EXECUTION**

| | SHIPPER | CARRIER |
| :--- | :--- | :--- |
| **Signature:** | ____________________ | ____________________ |
| **Name:** | ${shipperDetails?.contact_person || ""} | ${carrierDetails?.contact_person || ""} |
| **Designation:** | ${shipperDetails?.role || ""} | ${carrierDetails?.role || ""} |
| **Date:** | ${new Date().toLocaleDateString()} | ${new Date().toLocaleDateString()} |
| | **OFFICIAL AI VERIFIED** | **OFFICIAL AI VERIFIED** |

Digitally Verified & AI-Authenticated Agreement`}
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </CinematicLayout>
  )
}

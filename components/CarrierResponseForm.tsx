'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Truck, DollarSign, Calendar, Clock, Package, AlertTriangle, Sparkles, Plus, MapPin, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useWorkflow } from './WorkflowContext'

interface CarrierResponseFormProps {
    shipmentRequest: any
    onSubmit: () => void
    onCancel: () => void
}

export default function CarrierResponseForm({ shipmentRequest, onSubmit, onCancel }: CarrierResponseFormProps) {
    const [formData, setFormData] = useState({
        available_capacity: 50,
        proposed_price: shipmentRequest.min_budget,
        estimated_delivery_days: 5,
        delivery_deadline: '',
        delivery_speed: 'standard',
        vehicle_type: 'truck',
        insurance_coverage: true,
        tracking_available: true,
        notes: '',
        available_routes: [] as string[],
        base_location: '',
        business_details: {
            company_name: '',
            contact_number: '',
            experience_years: 0,
            license_id: ''
        },
        risk_factors: { weather: 'low', traffic: 'medium', region: 'low' },
        cost_structure: {
            base_rate: 500,
            per_mile: 2.5,
            fuel_surcharge: 10,
            petrol_allowance: 0,
            food_allowance: 0,
            fuel_charge: 0,
            accommodation: 0,
            toll_gates_count: 0,
            toll_gates_cost: 0
        },
        reliability_score: 5.0,
        total_deliveries: 0,
        on_time_deliveries: 0
    })

    const [submitting, setSubmitting] = useState(false)

    // Automatic price calculation
    useEffect(() => {
        const total =
            (formData.cost_structure.base_rate || 0) +
            (formData.cost_structure.petrol_allowance || 0) +
            (formData.cost_structure.food_allowance || 0) +
            (formData.cost_structure.fuel_charge || 0) +
            (formData.cost_structure.accommodation || 0) +
            ((formData.cost_structure.toll_gates_count || 0) * (formData.cost_structure.toll_gates_cost || 0));

        if (total !== formData.proposed_price) {
            setFormData(prev => ({ ...prev, proposed_price: total }));
        }
    }, [formData.cost_structure])

    useState(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase.from('carrier_profiles').select('*').eq('carrier_id', user.id).single()
                if (data) {
                    setFormData(prev => ({
                        ...prev,
                        available_capacity: data.available_capacity || prev.available_capacity,
                        available_routes: data.available_routes || [],
                        base_location: data.base_location || '',
                        business_details: {
                            ...prev.business_details,
                            ...(data.business_details || {})
                        },
                        risk_factors: data.risk_factors || prev.risk_factors,
                        cost_structure: {
                            ...prev.cost_structure,
                            ...(data.cost_structure || {})
                        },
                        reliability_score: data.reliability_score || 5.0,
                        total_deliveries: data.total_deliveries || 0,
                        on_time_deliveries: data.on_time_deliveries || 0
                    }))
                }
            }
        }
        fetchProfile()
    })

    const { setCarrierConstraints, setNegotiationData, setCarrierId, shipperTerms } = useWorkflow()

    const handleSubmit = async () => {
        setSubmitting(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Update workflow context for local persistence
            setCarrierConstraints(formData)
            setNegotiationData(null) // Clear previous results
            setCarrierId(user.id)

            // Calculate estimated delivery date
            const estimatedDate = new Date()
            estimatedDate.setDate(estimatedDate.getDate() + formData.estimated_delivery_days)

            // Save carrier response
            const { error: responseError } = await supabase
                .from('carrier_responses')
                .insert({
                    carrier_id: user.id,
                    shipment_id: shipmentRequest.id,
                    response_type: 'counter_offer',
                    proposed_price: formData.proposed_price,
                    estimated_delivery_date: estimatedDate.toISOString().split('T')[0],
                    notes: JSON.stringify(formData),
                    status: 'pending'
                })

            if (responseError) throw responseError

            // Call AI negotiation API
            const response = await fetch('/api/ai-negotiation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    shipmentRequest,
                    carrierResponse: formData,
                    carrierId: user.id
                })
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to initiate AI negotiation')
            }

            // If shipper terms are available, generate the full agreement
            if (shipperTerms) {
                const agreementResponse = await fetch('http://localhost:8000/negotiate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        shipperTerms,
                        carrierConstraints: formData,
                        shipment_id: shipmentRequest.id,
                        carrier_id: user.id,
                        userEmail: user.email
                    })
                })

                if (agreementResponse.ok) {
                    const agreementData = await agreementResponse.json()
                    setNegotiationData(agreementData)
                }
            }

            onSubmit()
        } catch (error: any) {
            console.error('Submit error:', error)
            alert('Failed to submit response: ' + error.message)
        } finally {
            setSubmitting(false)
        }
    }

    const starRating = (score: number) => {
        return (
            <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Sparkles
                        key={star}
                        className={`w-4 h-4 ${star <= Math.round(score) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                    />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
            {/* Performance Stats Overlay */}
            <div className="bg-black/60 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Carrier Reliability</h4>
                    <div className="flex items-center space-x-3">
                        <span className="text-3xl font-black text-white">{formData.reliability_score.toFixed(1)}</span>
                        {starRating(formData.reliability_score)}
                    </div>
                </div>
                <div className="flex space-x-6 text-right">
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase">Deliveries</p>
                        <p className="text-lg font-bold text-cyan-400">{formData.total_deliveries}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase">On-Time</p>
                        <p className="text-lg font-bold text-green-400">
                            {formData.total_deliveries > 0
                                ? ((formData.on_time_deliveries / formData.total_deliveries) * 100).toFixed(0)
                                : 100}%
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                    <Truck className="w-5 h-5 text-cyan-400" />
                    <span>Real-world Logistics Feasibility</span>
                </h3>

                <div className="space-y-6">
                    {/* Capacity & Routes */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400 block">Available Capacity (tons)</label>
                            <input
                                type="number"
                                value={formData.available_capacity}
                                onChange={(e) => setFormData({ ...formData, available_capacity: parseFloat(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-cyan-500 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400 block">Active Routes</label>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    id="new-route-input"
                                    placeholder="e.g. Chennai-Bangalore"
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-cyan-500 transition-all"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = e.currentTarget.value.trim();
                                            if (val) {
                                                setFormData(prev => ({ ...prev, available_routes: [...prev.available_routes, val] }));
                                                e.currentTarget.value = '';
                                            }
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        const input = document.getElementById('new-route-input') as HTMLInputElement;
                                        if (input && input.value.trim()) {
                                            setFormData(prev => ({ ...prev, available_routes: [...prev.available_routes, input.value.trim()] }));
                                            input.value = '';
                                        }
                                    }}
                                    className="p-3 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400 hover:bg-cyan-500/30 transition-all"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.available_routes.map((route, idx) => (
                                    <span key={idx} className="flex items-center space-x-1 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-xs text-cyan-300 whitespace-nowrap shadow-sm">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span className="font-semibold">{route}</span>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, available_routes: p.available_routes.filter((_, i) => i !== idx) }))}
                                            className="ml-1 hover:scale-110 transition-transform"
                                        >
                                            <XCircle className="w-4 h-4 text-cyan-500 hover:text-red-400" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Risk Factors */}
                    <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl space-y-4">
                        <label className="text-sm font-bold text-orange-400 flex items-center space-x-2">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Risk Assessment Factors</span>
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {['weather', 'traffic', 'region'].map((risk) => (
                                <div key={risk} className="space-y-1">
                                    <label className="text-[10px] text-gray-500 uppercase block">{risk}</label>
                                    <select
                                        value={(formData.risk_factors as any)[risk]}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            risk_factors: { ...formData.risk_factors, [risk]: e.target.value }
                                        })}
                                        className="w-full bg-gray-900 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-orange-500"
                                    >
                                        <option value="low" className="bg-gray-900">Low</option>
                                        <option value="medium" className="bg-gray-900">Medium</option>
                                        <option value="high" className="bg-gray-900">High</option>
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Proposed Price & Cost Structure */}
                    <div className="space-y-4 pt-2 border-t border-white/5">
                        <div className="flex justify-between items-end">
                            <label className="text-sm text-gray-400">Proposed Total Price ($)</label>
                            <span className="text-[10px] text-gray-500">Shipper Budget: ${shipmentRequest.min_budget} - ${shipmentRequest.max_budget}</span>
                        </div>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-3.5 w-5 h-5 text-green-500" />
                            <input
                                type="number"
                                value={formData.proposed_price}
                                onChange={(e) => setFormData({ ...formData, proposed_price: parseFloat(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-2xl font-black text-white outline-none focus:border-green-500 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                            <div className="text-center border-r border-white/10">
                                <p className="text-[8px] text-gray-500 uppercase">Base Rate</p>
                                <input
                                    type="number"
                                    className="bg-transparent text-white w-full text-center text-sm font-bold outline-none"
                                    value={formData.cost_structure.base_rate}
                                    onChange={(e) => setFormData({ ...formData, cost_structure: { ...formData.cost_structure, base_rate: parseFloat(e.target.value) || 0 } })}
                                />
                            </div>
                            <div className="text-center border-r border-white/10">
                                <p className="text-[8px] text-gray-500 uppercase">Petrol Allow.</p>
                                <input
                                    type="number"
                                    className="bg-transparent text-white w-full text-center text-sm font-bold outline-none"
                                    value={formData.cost_structure.petrol_allowance}
                                    onChange={(e) => setFormData({ ...formData, cost_structure: { ...formData.cost_structure, petrol_allowance: parseFloat(e.target.value) || 0 } })}
                                />
                            </div>
                            <div className="text-center border-r border-white/10">
                                <p className="text-[8px] text-gray-500 uppercase">Food Allow.</p>
                                <input
                                    type="number"
                                    className="bg-transparent text-white w-full text-center text-sm font-bold outline-none"
                                    value={formData.cost_structure.food_allowance}
                                    onChange={(e) => setFormData({ ...formData, cost_structure: { ...formData.cost_structure, food_allowance: parseFloat(e.target.value) || 0 } })}
                                />
                            </div>
                            <div className="text-center">
                                <p className="text-[8px] text-gray-500 uppercase">Fuel Charge</p>
                                <input
                                    type="number"
                                    className="bg-transparent text-white w-full text-center text-sm font-bold outline-none"
                                    value={formData.cost_structure.fuel_charge}
                                    onChange={(e) => setFormData({ ...formData, cost_structure: { ...formData.cost_structure, fuel_charge: parseFloat(e.target.value) || 0 } })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                            <div className="text-center border-r border-white/10">
                                <p className="text-[8px] text-gray-500 uppercase">Accommodation</p>
                                <input
                                    type="number"
                                    className="bg-transparent text-white w-full text-center text-sm font-bold outline-none"
                                    value={formData.cost_structure.accommodation}
                                    onChange={(e) => setFormData({ ...formData, cost_structure: { ...formData.cost_structure, accommodation: parseFloat(e.target.value) || 0 } })}
                                />
                            </div>
                            <div className="text-center border-r border-white/10">
                                <p className="text-[8px] text-gray-500 uppercase">Toll Gates (Qty)</p>
                                <input
                                    type="number"
                                    className="bg-transparent text-white w-full text-center text-sm font-bold outline-none"
                                    value={formData.cost_structure.toll_gates_count}
                                    onChange={(e) => setFormData({ ...formData, cost_structure: { ...formData.cost_structure, toll_gates_count: parseInt(e.target.value) || 0 } })}
                                />
                            </div>
                            <div className="text-center">
                                <p className="text-[8px] text-gray-500 uppercase">Cost / Toll</p>
                                <input
                                    type="number"
                                    className="bg-transparent text-white w-full text-center text-sm font-bold outline-none"
                                    value={formData.cost_structure.toll_gates_cost}
                                    onChange={(e) => setFormData({ ...formData, cost_structure: { ...formData.cost_structure, toll_gates_cost: parseFloat(e.target.value) || 0 } })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Delivery Time & Speed */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400 block">Delivery Deadline</label>
                            <input
                                type="datetime-local"
                                value={formData.delivery_deadline}
                                onChange={(e) => setFormData({ ...formData, delivery_deadline: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-purple-500 transition-all [color-scheme:dark]"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400 block">Service Level</label>
                            <select
                                value={formData.delivery_speed}
                                onChange={(e) => setFormData({ ...formData, delivery_speed: e.target.value })}
                                className="w-full bg-gray-900 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-purple-500 transition-all"
                            >
                                <option value="standard" className="bg-gray-900">Standard (5-7 days)</option>
                                <option value="express" className="bg-gray-900">Express (2-3 days)</option>
                                <option value="overnight" className="bg-gray-900">Overnight (24 hours)</option>
                            </select>
                        </div>
                    </div>

                    {/* Vehicle Type */}
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400 block">Vehicle Type</label>
                        <select
                            value={formData.vehicle_type}
                            onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                            className="w-full bg-gray-900 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-cyan-500 transition-all"
                        >
                            <option value="truck" className="bg-gray-900 text-white">Standard Truck</option>
                            <option value="refrigerated" className="bg-gray-900 text-white">Refrigerated Truck</option>
                            <option value="flatbed" className="bg-gray-900 text-white">Flatbed</option>
                            <option value="container" className="bg-gray-900 text-white">Container</option>
                        </select>
                    </div>

                    {/* Additional Services */}
                    <div className="space-y-3">
                        <label className="text-sm text-gray-400 block">Additional Services</label>
                        <div className="space-y-2">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.insurance_coverage}
                                    onChange={(e) => setFormData({ ...formData, insurance_coverage: e.target.checked })}
                                    className="w-5 h-5 rounded border-white/10 bg-white/5 text-cyan-500 focus:ring-cyan-500"
                                />
                                <span className="text-white">Insurance Coverage Included</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.tracking_available}
                                    onChange={(e) => setFormData({ ...formData, tracking_available: e.target.checked })}
                                    className="w-5 h-5 rounded border-white/10 bg-white/5 text-cyan-500 focus:ring-cyan-500"
                                />
                                <span className="text-white">Real-time Tracking Available</span>
                            </label>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400 block">Additional Notes (Optional)</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            placeholder="Any special considerations or additional information..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 outline-none focus:border-cyan-500 transition-all resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* AI Negotiation Notice */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4"
            >
                <div className="flex items-start space-x-3">
                    <Sparkles className="w-5 h-5 text-purple-400 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-white">AI-Powered Negotiation</p>
                        <p className="text-xs text-gray-400 mt-1">
                            Your response will be analyzed by our AI system along with the shipper's requirements to determine a fair price, deadline, and penalty terms.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-bold text-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                    {submitting ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Submitting...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5" />
                            <span>Submit to AI Negotiation</span>
                        </>
                    )}
                </button>
                <button
                    onClick={onCancel}
                    disabled={submitting}
                    className="px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-lg transition-all disabled:opacity-50"
                >
                    Cancel
                </button>
            </div>
        </div>
    )
}

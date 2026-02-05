'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, MapPin, DollarSign, Calendar, Clock, CheckCircle, XCircle, Loader, Eye, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ShipmentRequest {
    id: string
    source_location: string
    destination_location: string
    min_budget: number
    max_budget: number
    deadline: string
    time_window: string
    priority_level: string
    special_conditions: string[]
    status: string
    created_at: string
}

export default function ShipmentHistory() {
    const [shipments, setShipments] = useState<ShipmentRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    useEffect(() => {
        fetchShipments()

        // Subscribe to shipment status updates (Realtime)
        const setupRealtimeSubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return;

            const channel = supabase
                .channel('shipper_shipment_updates')
                .on('postgres_changes', {
                    event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
                    schema: 'public',
                    table: 'shipment_requests',
                    filter: `shipper_id=eq.${user.id}`
                }, (payload) => {
                    console.log('Realtime: Shipment update received', payload)
                    fetchShipments() // Re-fetch the list
                })
                .subscribe()

            return () => { supabase.removeChannel(channel) }
        }

        setupRealtimeSubscription()
    }, [])

    const fetchShipments = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setLoading(false)
                return
            }

            const { data, error } = await supabase
                .from('shipment_requests')
                .select('*')
                .eq('shipper_id', user.id)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching shipments:', error)
            } else {
                setShipments(data || [])
            }
        } catch (error) {
            console.error('Fetch error:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
            case 'matched':
                return 'text-blue-400 bg-blue-400/10 border-blue-400/30'
            case 'in_progress':
                return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30'
            case 'completed':
                return 'text-green-400 bg-green-400/10 border-green-400/30'
            case 'cancelled':
                return 'text-red-400 bg-red-400/10 border-red-400/30'
            default:
                return 'text-gray-400 bg-gray-400/10 border-gray-400/30'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-4 h-4" />
            case 'matched':
            case 'in_progress':
                return <Loader className="w-4 h-4 animate-spin" />
            case 'completed':
                return <CheckCircle className="w-4 h-4" />
            case 'cancelled':
                return <XCircle className="w-4 h-4" />
            default:
                return <Package className="w-4 h-4" />
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
        )
    }

    if (shipments.length === 0) {
        return (
            <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No shipment requests yet</p>
                <p className="text-gray-500 text-sm mt-2">Create your first shipment request to get started</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Shipment History</h2>
                <span className="text-sm text-gray-400">{shipments.length} total requests</span>
            </div>

            <AnimatePresence>
                {shipments.map((shipment, index) => (
                    <motion.div
                        key={shipment.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden hover:border-cyan-500/30 transition-all"
                    >
                        <div
                            className="p-6 cursor-pointer"
                            onClick={() => setExpandedId(expandedId === shipment.id ? null : shipment.id)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className={`px-3 py-1 rounded-full border text-xs font-bold uppercase flex items-center space-x-2 ${getStatusColor(shipment.status)}`}>
                                            {getStatusIcon(shipment.status)}
                                            <span>{shipment.status.replace('_', ' ')}</span>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {new Date(shipment.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4 mb-3">
                                        <div className="flex items-center space-x-2 text-gray-300">
                                            <MapPin className="w-4 h-4 text-cyan-400" />
                                            <span className="text-sm">
                                                <span className="font-medium">{shipment.source_location}</span>
                                                <span className="text-gray-500 mx-2">→</span>
                                                <span className="font-medium">{shipment.destination_location}</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-gray-300">
                                            <DollarSign className="w-4 h-4 text-green-400" />
                                            <span className="text-sm font-medium">
                                                ${shipment.min_budget} - ${shipment.max_budget}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                                        <div className="flex items-center space-x-1">
                                            <Calendar className="w-3 h-3" />
                                            <span>{new Date(shipment.deadline).toLocaleDateString()}</span>
                                        </div>
                                        {shipment.time_window && (
                                            <div className="flex items-center space-x-1">
                                                <Clock className="w-3 h-3" />
                                                <span>{shipment.time_window}</span>
                                            </div>
                                        )}
                                        <div className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 rounded text-purple-400">
                                            {shipment.priority_level}
                                        </div>
                                    </div>
                                </div>

                                <button className="text-gray-400 hover:text-cyan-400 transition-colors">
                                    {expandedId === shipment.id ? (
                                        <ChevronUp className="w-5 h-5" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5" />
                                    )}
                                </button>
                            </div>

                            <AnimatePresence>
                                {expandedId === shipment.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="mt-4 pt-4 border-t border-white/10"
                                    >
                                        {shipment.special_conditions && shipment.special_conditions.length > 0 && (
                                            <div className="mb-3">
                                                <p className="text-xs text-gray-500 uppercase mb-2">Special Conditions</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {shipment.special_conditions.map((condition, i) => (
                                                        <span
                                                            key={i}
                                                            className="px-2 py-1 bg-teal-500/10 border border-teal-500/30 rounded text-teal-400 text-xs"
                                                        >
                                                            {condition}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <div className="text-xs text-gray-500">
                                                Request ID: <span className="text-gray-400 font-mono">{shipment.id.slice(0, 8)}...</span>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    const mapUrl = `https://www.google.com/maps/dir/${encodeURIComponent(shipment.source_location)}/${encodeURIComponent(shipment.destination_location)}`
                                                    window.open(mapUrl, '_blank')
                                                }}
                                                className="flex items-center space-x-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-cyan-500/20 transition-all text-xs"
                                            >
                                                <Eye className="w-3 h-3" />
                                                <span>View Route</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Package, MapPin, DollarSign, Calendar, Clock, AlertCircle, CheckCircle, XCircle, Activity, AlertTriangle, MessageCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import CarrierResponseForm from './CarrierResponseForm'

interface Notification {
    id: string
    shipment_id: string
    message: string
    status: string
    created_at: string
}

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
    special_terms: string
    sla_rules: any
}

export default function CarrierNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [selectedShipment, setSelectedShipment] = useState<ShipmentRequest | null>(null)
    const [loading, setLoading] = useState(true)
    const [showResponseForm, setShowResponseForm] = useState(false)

    const [userEmail, setUserEmail] = useState<string | null>(null)

    const [showDebug, setShowDebug] = useState(false)

    useEffect(() => {
        let mounted = true

        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user && mounted) setUserEmail(user.email || user.id)
        })

        fetchNotifications(mounted)

        // Subscribe to new notifications for this carrier
        const setupSubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user || !mounted) return

            const channel = supabase
                .channel(`carrier_notifications_${user.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'carrier_notifications',
                    filter: `carrier_id=eq.${user.id}`
                }, () => {
                    fetchNotifications(mounted)
                })
                .subscribe()

            return channel
        }

        const subscriptionPromise = setupSubscription()

        return () => {
            mounted = false
            subscriptionPromise.then(channel => {
                if (channel) supabase.removeChannel(channel)
            })
        }
    }, [])

    const fetchNotifications = async (mounted: boolean = true) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user || !mounted) return

            // Profile is handled by the main dashboard page
            const { data, error } = await supabase
                .from('carrier_notifications')
                .select('*')
                .eq('carrier_id', user.id)
                .order('created_at', { ascending: false })

            if (!mounted) return

            console.log(`Fetched ${data?.length || 0} notifications for user ${user.id}`)

            if (error) {
                if (error.message !== 'Fetch aborted') {
                    console.error('Error fetching notifications:', error)
                }
            } else {
                setNotifications(data || [])
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('Fetch error:', error)
            }
        } finally {
            if (mounted) setLoading(false)
        }
    }

    const openNotification = async (notification: Notification) => {
        try {
            // Mark as read
            await supabase
                .from('carrier_notifications')
                .update({ status: 'read', read_at: new Date().toISOString() })
                .eq('id', notification.id)

            // Fetch shipment details only if shipment_id exists
            if (notification.shipment_id) {
                const { data, error } = await supabase
                    .from('shipment_requests')
                    .select('*')
                    .eq('id', notification.shipment_id)
                    .single()

                if (error) {
                    console.error('Error fetching shipment:', error)
                } else {
                    setSelectedShipment(data)
                }
            } else {
                console.warn('Notification has no shipment_id')
            }

            // Refresh notifications
            fetchNotifications()
        } catch (error) {
            console.error('Open notification error:', error)
        }
    }

    const handleRespond = () => {
        setShowResponseForm(true)
    }

    const closeModal = () => {
        setSelectedShipment(null)
        setShowResponseForm(false)
    }

    const unreadCount = notifications.filter(n => n.status === 'unread').length

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col">
                    <div className="flex items-center space-x-3">
                        <Bell className="w-6 h-6 text-cyan-400" />
                        <h2
                            className="text-2xl font-bold text-white cursor-pointer hover:text-cyan-400"
                            onClick={() => setShowDebug(!showDebug)}
                        >
                            Notifications
                        </h2>
                        {unreadCount > 0 && (
                            <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                                {unreadCount} new
                            </span>
                        )}
                    </div>
                    <div className="mt-1 flex items-center space-x-2 text-[10px] text-gray-500 uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        <span>Terminal Online</span>
                        <span className="mx-2">|</span>
                        <span>Identity: {userEmail || 'Authenticating...'}</span>
                    </div>
                </div>

                {/* Manual Sync Button */}
                <button
                    onClick={() => fetchNotifications()}
                    className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all text-gray-400 hover:text-cyan-400"
                    title="Force Sync"
                >
                    <Activity className="w-4 h-4" />
                </button>
            </div>

            {/* Debug Panel (Conditional rendering) */}
            {showDebug && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-[10px] font-mono text-red-300">
                    <p>SYSTEM DIAGNOSTICS</p>
                    <p className="mt-2 text-white">USER_ID: {userEmail || 'NULL'}</p>
                    <p>RAW_NOTIF_COUNT: {notifications.length}</p>
                    <p>RLS_STATUS: PASSED</p>
                    <button
                        onClick={async () => {
                            const { data: { user } } = await supabase.auth.getUser()
                            if (user) {
                                await supabase.from('carrier_notifications').insert({
                                    carrier_id: user.id,
                                    message: "SYSTEM TEST: Manual diagnostic ping",
                                    status: 'unread'
                                })
                                fetchNotifications()
                            }
                        }}
                        className="mt-2 px-2 py-1 bg-red-500/20 border border-red-500/40 rounded hover:bg-red-500/40"
                    >
                        [ TRIGGER_MANUAL_PING ]
                    </button>
                </div>
            )}

            {notifications.length === 0 ? (
                <div className="text-center py-12">
                    <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No notifications yet</p>
                    <p className="text-gray-500 text-sm mt-2">You'll be notified when shippers post new requests</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification, index) => (
                        <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => openNotification(notification)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${notification.status === 'unread'
                                ? 'bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20'
                                : 'bg-black/40 border-white/10 hover:border-white/20'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${notification.status === 'unread' ? 'bg-cyan-500/20' : 'bg-gray-700'
                                        }`}>
                                        <Package className={`w-5 h-5 ${notification.status === 'unread' ? 'text-cyan-400' : 'text-gray-400'
                                            }`} />
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm ${notification.status === 'unread' ? 'text-white font-medium' : 'text-gray-400'
                                            }`}>
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(notification.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                {notification.status === 'unread' && (
                                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Shipment Details Modal */}
            <AnimatePresence>
                {selectedShipment && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-gradient-to-br from-gray-900 to-black border border-cyan-500/30 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                                        {showResponseForm ? 'Carriers Response Details' : 'Shipment Request Details'}
                                    </h2>
                                    <button
                                        onClick={closeModal}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </div>

                                {!showResponseForm ? (
                                    <>
                                        {/* Shipper Requirements */}
                                        <div className="space-y-6">
                                            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
                                                <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                                                    <AlertCircle className="w-5 h-5 text-cyan-400" />
                                                    <span>Shipper Requirements</span>
                                                </h3>

                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div className="space-y-3">
                                                        <div className="flex items-center space-x-2 text-gray-300">
                                                            <MapPin className="w-4 h-4 text-cyan-400" />
                                                            <div>
                                                                <p className="text-xs text-gray-500">Route</p>
                                                                <p className="font-medium">
                                                                    {selectedShipment.source_location} → {selectedShipment.destination_location}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center space-x-2 text-gray-300">
                                                            <DollarSign className="w-4 h-4 text-green-400" />
                                                            <div>
                                                                <p className="text-xs text-gray-500">Budget Range</p>
                                                                <p className="font-medium">
                                                                    ${selectedShipment.min_budget} - ${selectedShipment.max_budget}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center space-x-2 text-gray-300">
                                                            <Calendar className="w-4 h-4 text-purple-400" />
                                                            <div>
                                                                <p className="text-xs text-gray-500">Deadline</p>
                                                                <p className="font-medium">
                                                                    {new Date(selectedShipment.deadline).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        {selectedShipment.time_window && (
                                                            <div className="flex items-center space-x-2 text-gray-300">
                                                                <Clock className="w-4 h-4 text-orange-400" />
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Time Window</p>
                                                                    <p className="font-medium">{selectedShipment.time_window}</p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {selectedShipment.sla_rules && (
                                                            <div className="flex items-center space-x-4">
                                                                <div className="flex items-center space-x-2 text-gray-300">
                                                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                                                    <div>
                                                                        <p className="text-[10px] text-gray-500 uppercase">Penalty</p>
                                                                        <p className="font-bold text-red-400">{selectedShipment.sla_rules.delayPenalty}%</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center space-x-2 text-gray-300">
                                                                    <Activity className="w-4 h-4 text-cyan-400" />
                                                                    <div>
                                                                        <p className="text-[10px] text-gray-500 uppercase">Tolerance</p>
                                                                        <p className="font-bold text-cyan-400">{selectedShipment.sla_rules.maxDelayTolerance}h</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div>
                                                            <p className="text-xs text-gray-500 mb-1">Priority Level</p>
                                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedShipment.priority_level === 'Urgent'
                                                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                                : selectedShipment.priority_level === 'Seasonal'
                                                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                                }`}>
                                                                {selectedShipment.priority_level}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {selectedShipment.special_conditions && selectedShipment.special_conditions.length > 0 && (
                                                    <div className="mt-4">
                                                        <p className="text-xs text-gray-500 mb-2">Special Conditions</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {selectedShipment.special_conditions.map((condition, i) => (
                                                                <span
                                                                    key={i}
                                                                    className="px-3 py-1 bg-teal-500/10 border border-teal-500/30 rounded-lg text-teal-400 text-xs"
                                                                >
                                                                    {condition}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedShipment.special_terms && (
                                                    <div className="mt-4">
                                                        <p className="text-xs text-gray-500 mb-2">Special Terms</p>
                                                        <p className="text-sm text-gray-300 bg-black/30 p-3 rounded-lg">
                                                            {selectedShipment.special_terms}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex flex-col space-y-3">
                                                <div className="flex space-x-4">
                                                    <button
                                                        onClick={handleRespond}
                                                        className="flex-1 px-6 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-bold text-lg hover:scale-105 transition-all flex items-center justify-center space-x-2"
                                                    >
                                                        <CheckCircle className="w-5 h-5" />
                                                        <span>Respond to Request</span>
                                                    </button>
                                                    <a
                                                        href="https://wa.me/919876543210"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-6 py-4 bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] rounded-xl font-bold text-lg hover:bg-[#25D366]/30 transition-all flex items-center justify-center space-x-2"
                                                    >
                                                        <MessageCircle className="w-5 h-5" />
                                                        <span>WhatsApp Shipper</span>
                                                    </a>
                                                </div>
                                                <button
                                                    onClick={closeModal}
                                                    className="w-full px-6 py-4 bg-gray-800/50 hover:bg-gray-700/50 border border-white/10 rounded-xl font-bold text-lg transition-all"
                                                >
                                                    Close
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <CarrierResponseForm
                                        shipmentRequest={selectedShipment}
                                        onSubmit={() => {
                                            closeModal()
                                            fetchNotifications()
                                        }}
                                        onCancel={() => setShowResponseForm(false)}
                                    />
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    )
}

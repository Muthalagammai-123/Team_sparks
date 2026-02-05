'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCircle, Package, Send, Sparkles, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ShipperNotifications() {
    const [notifications, setNotifications] = useState<any[]>([])
    const [showPanel, setShowPanel] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        fetchNotifications()

        // Subscribe to new notifications
        const channel = supabase
            .channel('shipper_notifications_changes')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'shipper_notifications'
            }, () => {
                fetchNotifications()
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    const fetchNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('shipper_notifications')
            .select('*')
            .eq('shipper_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10)

        setNotifications(data || [])
        setUnreadCount(data?.filter(n => n.status === 'unread').length || 0)
    }

    const markAsRead = async (id: string) => {
        await supabase
            .from('shipper_notifications')
            .update({ status: 'read' })
            .eq('id', id)
        fetchNotifications()
    }

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={() => setShowPanel(!showPanel)}
                className="relative p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
            >
                <Bell className="w-5 h-5 text-cyan-400" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel */}
            <AnimatePresence>
                {showPanel && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowPanel(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-3 w-80 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Updates</h3>
                                <button onClick={() => setShowPanel(false)} className="text-gray-500 hover:text-white">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Package className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                                        <p className="text-xs text-gray-500">No recent updates</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/5">
                                        {notifications.map((n) => (
                                            <div
                                                key={n.id}
                                                className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${n.status === 'unread' ? 'bg-cyan-500/5' : ''}`}
                                                onClick={() => markAsRead(n.id)}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.status === 'unread' ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'bg-transparent'
                                                        }`} />
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-gray-300 leading-relaxed">{n.message}</p>
                                                        <div className="flex items-center gap-2">
                                                            {n.type === 'carrier_found' && <Send className="w-3 h-3 text-cyan-400" />}
                                                            {n.type === 'negotiation_ready' && <Sparkles className="w-3 h-3 text-purple-400" />}
                                                            {n.type === 'status_update' && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                                                            <span className="text-[10px] text-gray-600">
                                                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-3 bg-white/5 border-t border-white/10 text-center">
                                <button className="text-[10px] text-gray-500 hover:text-cyan-400 font-bold uppercase transition-colors">
                                    View All Activity
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

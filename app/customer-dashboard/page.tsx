'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Star, Package, Clock, MapPin, Search, ArrowRight, Truck, CheckCircle, RefreshCcw } from 'lucide-react'
import { ToastContainer, ToastProps } from '../../components/Toast'
import CinematicLayout from '../../components/CinematicLayout'
import { supabase } from '../../lib/supabase'

// Mock Product Data
const PRODUCTS = [
    { id: 1, name: 'Ergonomic Office Chair', price: 299, category: 'Furniture', image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500&q=80' },
    { id: 2, name: '4K Ultra Monitor', price: 499, category: 'Electronics', image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80' },
    { id: 3, name: 'Mechanical Keyboard', price: 129, category: 'Electronics', image: 'https://images.unsplash.com/photo-1587829741301-308231c8dbdd?w=500&q=80' },
    { id: 4, name: 'Minimalist Desk Lamp', price: 89, category: 'Lighting', image: 'https://images.unsplash.com/photo-1507473888900-52e1ad14db3a?w=500&q=80' },
    { id: 5, name: 'Smart Home Hub', price: 199, category: 'Smart Home', image: 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=500&q=80' },
    { id: 6, name: 'Noise Cancelling Headphones', price: 349, category: 'Audio', image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&q=80' },
]

export default function CustomerDashboard() {
    const [activeTab, setActiveTab] = useState<'store' | 'orders'>('store')
    const [cart, setCart] = useState<any[]>([])
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

    // Checkout State
    const [address, setAddress] = useState('')
    const [priority, setPriority] = useState('standard')
    const [isProcessing, setIsProcessing] = useState(false)

    // Orders State
    const [orders, setOrders] = useState<any[]>([])
    const [isLoadingOrders, setIsLoadingOrders] = useState(false)

    // Rating State
    const [ratingModalOpen, setRatingModalOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<any>(null)
    const [rating, setRating] = useState(0)
    const [review, setReview] = useState('')

    const [toasts, setToasts] = useState<ToastProps[]>([])

    const addToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
        const id = Date.now().toString()
        setToasts(prev => [...prev, { ...toast, id, onClose: removeToast }])
    }

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
    }

    // Fetch Orders
    const fetchOrders = async () => {
        setIsLoadingOrders(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const res = await fetch(`/api/customer/orders/list?userId=${user.id}`)
            const data = await res.json()
            if (data.orders) setOrders(data.orders)
        } catch (e) {
            console.error('Error fetching orders:', e)
        } finally {
            setIsLoadingOrders(false)
        }
    }

    useEffect(() => {
        if (activeTab === 'orders') fetchOrders()
    }, [activeTab])

    const addToCart = (product: any) => {
        setCart([...cart, product])
        addToast({ type: 'success', title: 'Added to Cart', message: `${product.name} added.` })
    }

    const removeFromCart = (index: number) => {
        const newCart = [...cart]
        newCart.splice(index, 1)
        setCart(newCart)
    }

    const handleCheckout = async () => {
        if (!address) {
            addToast({ type: 'error', title: 'Address Missing', message: 'Please enter a delivery address.' })
            return
        }

        setIsProcessing(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                addToast({ type: 'error', title: 'Auth Error', message: 'Please login to place an order.' })
                return
            }

            const total = cart.reduce((sum, item) => sum + item.price, 0)

            const res = await fetch('/api/customer/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: user.id,
                    customerName: user.user_metadata?.full_name || 'Customer',
                    address,
                    items: cart,
                    total,
                    priority
                })
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error)

            addToast({ type: 'success', title: 'Order Placed!', message: `Order #${data.orderId.slice(0, 8)} confirmed.` })
            setCart([])
            setIsCheckoutOpen(false)
            setIsCartOpen(false)
            setActiveTab('orders')

        } catch (error: any) {
            addToast({ type: 'error', title: 'Checkout Failed', message: error.message })
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <CinematicLayout>
            <ToastContainer toasts={toasts} onClose={removeToast} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">
                            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">NovaMart</span> Store
                        </h1>
                        <p className="text-gray-400 text-sm">Experience seamless logistics with every order</p>
                    </div>

                    <div className="flex space-x-4">
                        <div className="bg-white/10 p-1 rounded-lg flex space-x-1">
                            <button
                                onClick={() => setActiveTab('store')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'store' ? 'bg-cyan-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                Shop
                            </button>
                            <button
                                onClick={() => setActiveTab('orders')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'orders' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                My Orders
                            </button>
                        </div>

                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="relative p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10"
                        >
                            <ShoppingCart className="w-5 h-5 text-cyan-400" />
                            {cart.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {cart.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'store' ? (
                        <motion.div
                            key="store"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {PRODUCTS.map(product => (
                                <div key={product.id} className="group bg-black/40 border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all duration-300">
                                    <div className="h-48 overflow-hidden relative">
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs text-white">
                                            {product.category}
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <h3 className="text-lg font-bold text-white mb-2">{product.name}</h3>
                                        <div className="flex justify-between items-center">
                                            <span className="text-2xl font-bold text-cyan-400">${product.price}</span>
                                            <button
                                                onClick={() => addToCart(product)}
                                                className="px-4 py-2 bg-white/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg text-sm font-medium transition-all"
                                            >
                                                Add to Cart
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="orders"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-white">Order History</h2>
                                    <button onClick={fetchOrders} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-all">
                                        <RefreshCcw className={`w-5 h-5 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>

                                {orders.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>No orders found. Start shopping!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {orders.map(order => (
                                            <div key={order.id} className="bg-white/5 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                                        <Package className="w-5 h-5 text-purple-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-medium">Order #{order.id.slice(0, 8)}</p>
                                                        <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()} • {order.special_terms.split('-')[1]?.trim()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-6">
                                                    <div className="text-right">
                                                        <div className={`text-sm font-bold uppercase px-3 py-1 rounded-full ${order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                order.status === 'in_transit' ? 'bg-blue-500/20 text-blue-400' :
                                                                    'bg-green-500/20 text-green-400'
                                                            }`}>
                                                            {order.status.replace('_', ' ')}
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 mt-1">Est. {new Date(order.deadline).toLocaleDateString()}</p>
                                                    </div>
                                                    {order.status === 'delivered' && (
                                                        <button className="text-sm text-cyan-400 hover:underline">Rate</button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Cart Drawer & Checkout (Simplified as overlay for demo) */}
                {isCartOpen && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            className="relative w-full max-w-md bg-gray-900 h-full p-6 shadow-2xl overflow-y-auto"
                        >
                            <h2 className="text-2xl font-bold text-white mb-6">Your Cart</h2>
                            {cart.length === 0 ? (
                                <p className="text-gray-500">Your cart is empty.</p>
                            ) : (
                                <div className="space-y-4 mb-8">
                                    {cart.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <img src={item.image} className="w-12 h-12 rounded object-cover" />
                                                <div>
                                                    <p className="text-white text-sm font-medium">{item.name}</p>
                                                    <p className="text-cyan-400 text-sm font-bold">${item.price}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => removeFromCart(idx)} className="text-gray-500 hover:text-red-400">×</button>
                                        </div>
                                    ))}
                                    <div className="pt-4 border-t border-white/10 flex justify-between text-white font-bold text-lg">
                                        <span>Total</span>
                                        <span>${cart.reduce((s, i) => s + i.price, 0)}</span>
                                    </div>
                                    <button
                                        onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true) }}
                                        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-bold text-white"
                                    >
                                        Proceed to Checkout
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}

                {/* Checkout Modal */}
                {isCheckoutOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsCheckoutOpen(false)} />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="relative bg-gray-900 border border-white/10 rounded-2xl p-8 max-w-lg w-full"
                        >
                            <h2 className="text-2xl font-bold text-white mb-6">Checkout</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-gray-400 block mb-2">Delivery Address</label>
                                    <input
                                        type="text"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="Enter full value address"
                                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 block mb-2">Delivery Priority</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setPriority('standard')}
                                            className={`p-3 rounded-lg border text-sm font-medium transition-all ${priority === 'standard' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-white/10 text-gray-400'}`}
                                        >
                                            Standard (5 Days)
                                        </button>
                                        <button
                                            onClick={() => setPriority('express')}
                                            className={`p-3 rounded-lg border text-sm font-medium transition-all ${priority === 'express' ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-white/5 border-white/10 text-gray-400'}`}
                                        >
                                            Express (2 Days)
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCheckout}
                                    disabled={isProcessing}
                                    className="w-full py-3 mt-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-bold text-white disabled:opacity-50"
                                >
                                    {isProcessing ? 'Processing Order...' : 'Confirm Order'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </CinematicLayout>
    )
}

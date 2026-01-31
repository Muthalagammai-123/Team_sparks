'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Star, Zap, Shield, TrendingUp, History, Info } from 'lucide-react'
import ProgressIndicator from '../../components/ProgressIndicator'
import { ToastContainer, ToastProps } from '../../components/Toast'
import CinematicLayout from '../../components/CinematicLayout'
import { useWorkflow } from '../../components/WorkflowContext'

export default function CustomerDashboard() {
    const { state, setCustomerExpectations, customerExpectations, customerRatings, addCustomerRating, isLoaded } = useWorkflow()
    const [activeStep, setActiveStep] = useState('signal')

    const [expectations, setExpectations] = useState({
        speedPriority: 50,
        reliabilityPriority: 80,
        qualityPriority: 70,
        notes: ''
    })

    const [toasts, setToasts] = useState<ToastProps[]>([])
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [comment, setComment] = useState('')

    const addToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
        const id = Date.now().toString()
        setToasts(prev => [...prev, { ...toast, id, onClose: removeToast }])
    }

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
    }

    const handleSaveExpectations = () => {
        setCustomerExpectations(expectations)
        addToast({
            type: 'success',
            title: 'Expectations Set',
            message: 'Your service preferences will be used as quality signals for future negotiations.'
        })
        setTimeout(() => setActiveStep('historical'), 1000)
    }

    const handleSubmitRating = () => {
        if (rating === 0) {
            addToast({
                type: 'error',
                title: 'Review Required',
                message: 'Please select a star rating first.'
            })
            return
        }
        addCustomerRating({ rating, comment, date: new Date().toISOString() })
        setRating(0)
        setComment('')
        addToast({
            type: 'success',
            title: 'Feedback Captured',
            message: 'Your rating helps improve the Shipper-Carrier matching algorithm.'
        })
    }

    const steps = [
        { id: 'signal', title: 'Quality Signal', description: 'Set your expectations' },
        { id: 'historical', title: 'Performance', description: 'View service history' }
    ]

    return (
        <CinematicLayout>
            <ToastContainer toasts={toasts} onClose={removeToast} />

            <ProgressIndicator
                steps={steps}
                currentStep={activeStep}
                completedSteps={customerExpectations ? ['signal'] : []}
                onStepClick={setActiveStep}
            />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-teal-400 bg-clip-text text-transparent">
                                Customer Service Terminal
                            </span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            Your expectations drive the platform's quality standards. Negotiations happen between Shippers and Carriers to meet these goals.
                        </p>
                    </div>

                    <div className="relative min-h-[600px]">
                        <AnimatePresence mode="wait">
                            {activeStep === 'signal' ? (
                                <motion.div
                                    key="signal"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="max-w-3xl mx-auto"
                                >
                                    {/* Expectations Section */}
                                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-cyan-500/30 transition-all duration-500">
                                        <div className="flex items-center space-x-4 mb-8">
                                            <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                                                <TrendingUp className="w-6 h-6 text-white" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-white">Service Priorities</h3>
                                        </div>

                                        <div className="space-y-8">
                                            {[
                                                { id: 'speedPriority', label: 'Speed', icon: Zap, color: 'cyan' },
                                                { id: 'reliabilityPriority', label: 'Reliability', icon: Shield, color: 'purple' },
                                                { id: 'qualityPriority', label: 'Quality', icon: Star, color: 'teal' }
                                            ].map((p) => (
                                                <div key={p.id} className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center space-x-2 text-gray-300">
                                                            <p.icon className="w-4 h-4" />
                                                            <span className="font-medium">{p.label}</span>
                                                        </div>
                                                        <span className={`font-bold text-${p.color}-400`}>{expectations[p.id as keyof typeof expectations]}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        value={expectations[p.id as keyof typeof expectations]}
                                                        onChange={(e) => setExpectations({ ...expectations, [p.id]: parseInt(e.target.value) })}
                                                        className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-${p.color}-500`}
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-10">
                                            <h4 className="text-white font-bold mb-4 flex items-center space-x-2">
                                                <MessageSquare className="w-4 h-4 text-cyan-400" />
                                                <span>Additional Expectations</span>
                                            </h4>
                                            <textarea
                                                value={expectations.notes}
                                                onChange={(e) => setExpectations({ ...expectations, notes: e.target.value })}
                                                placeholder="e.g. Needs specialized handling for fragile electronics..."
                                                className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-cyan-500 outline-none transition-all"
                                            />
                                        </div>

                                        <button
                                            onClick={handleSaveExpectations}
                                            className="w-full mt-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-xl font-bold text-lg hover:from-cyan-500 hover:to-blue-600 transition-all shadow-lg shadow-cyan-900/20"
                                        >
                                            Broadcast Expectations
                                        </button>
                                    </div>

                                    <div className="mt-8 p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl flex items-start space-x-4">
                                        <Info className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                                        <p className="text-sm text-gray-400 italic">
                                            Your expectations are used as non-binding benchmarks. Shippers and Carriers will negotiate terms that best balance these goals with operational costs.
                                        </p>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="historical"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="grid lg:grid-cols-2 gap-8"
                                >
                                    {/* Rating Section */}
                                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-purple-500/30 transition-all duration-500">
                                        <div className="flex items-center space-x-4 mb-8">
                                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                                <Star className="w-6 h-6 text-white" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-white">Rate Last Delivery</h3>
                                        </div>

                                        <div className="text-center mb-8">
                                            <div className="flex justify-center space-x-4 mb-4">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        onMouseEnter={() => setHoverRating(star)}
                                                        onMouseLeave={() => setHoverRating(0)}
                                                        onClick={() => setRating(star)}
                                                        className="transition-transform hover:scale-125"
                                                    >
                                                        <Star className={`w-10 h-10 ${star <= (hoverRating || rating)
                                                            ? 'text-yellow-400 fill-current'
                                                            : 'text-gray-600'
                                                            }`} />
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-gray-400">Your feedback affects the reliability score of your Carrier.</p>
                                        </div>

                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="Tell us about the delivery experience..."
                                            className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-purple-500 outline-none transition-all mb-6"
                                        />

                                        <button
                                            onClick={handleSubmitRating}
                                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-700 rounded-xl font-bold text-lg hover:from-purple-500 hover:to-pink-600 transition-all shadow-lg shadow-purple-900/20"
                                        >
                                            Submit Performance Rating
                                        </button>
                                    </div>

                                    {/* Service History */}
                                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                                        <div className="flex items-center space-x-4 mb-6">
                                            <History className="w-6 h-6 text-teal-400" />
                                            <h3 className="text-xl font-bold text-white">Recent Feedback History</h3>
                                        </div>

                                        {customerRatings.length === 0 ? (
                                            <p className="text-gray-500 italic text-center py-8">No ratings submitted yet.</p>
                                        ) : (
                                            <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                {customerRatings.slice().reverse().map((r, i) => (
                                                    <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-4">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <div className="flex">
                                                                {[1, 2, 3, 4, 5].map(s => (
                                                                    <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'text-yellow-400 fill-current' : 'text-gray-700'}`} />
                                                                ))}
                                                            </div>
                                                            <span className="text-[10px] text-gray-500">{new Date(r.date).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-300 line-clamp-2 italic">"{r.comment}"</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </CinematicLayout>
    )
}

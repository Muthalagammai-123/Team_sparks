'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, ArrowRight, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import CinematicLayout from '../../components/CinematicLayout'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))

        setIsSubmitted(true)
        setIsLoading(false)
    }

    return (
        <CinematicLayout>
            <div className="min-h-screen flex items-center justify-center px-4 py-20">
                <div className="max-w-md w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-cyan-500/10"
                    >
                        {!isSubmitted ? (
                            <>
                                <div className="text-center mb-8">
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
                                        Reset Password
                                    </h1>
                                    <p className="text-gray-400">Enter your email to receive recovery instructions</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="relative group">
                                        <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                                        <input
                                            type="email"
                                            placeholder="Email Address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-lg px-10 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                                            required
                                        />
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(0,245,255,0.4)' }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold py-3 rounded-lg shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {isLoading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <span>Send Instructions</span>
                                                <ArrowRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </motion.button>

                                    <div className="text-center text-sm">
                                        <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
                                            Back to Login
                                        </Link>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-8"
                            >
                                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25">
                                    <CheckCircle className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-4">Check Your Inbox</h2>
                                <p className="text-gray-400 mb-8">
                                    We've sent password recovery instructions to <span className="text-cyan-400">{email}</span>
                                </p>
                                <Link href="/login">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white font-medium transition-all"
                                    >
                                        Return to Login
                                    </motion.button>
                                </Link>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </div>
        </CinematicLayout>
    )
}

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CinematicLayout from '../../components/CinematicLayout'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setErrorMessage('')

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            let msg = error.message
            if (msg === 'Invalid login credentials') {
                msg = 'Invalid email or password. If you just signed up, please verify your email.'
            }
            setErrorMessage(msg)
            setIsLoading(false)
            return
        }

        if (data.session) {
            // Check metadata to find role and redirect
            const role = data.session.user.user_metadata.role

            if (role) {
                router.push(`/${role}-dashboard`)
            } else {
                // Fallback if no role found in metadata (legacy users or error)
                router.push('/role-selection')
            }
        } else {
            // Should not happen for sign in usually, unless email not confirmed and blocking
            setErrorMessage('Login failed. Please check your credentials.')
            setIsLoading(false)
        }
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
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
                                Welcome Back
                            </h1>
                            <p className="text-gray-400">Sign in to continue negotiating</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-4">
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

                                <div className="relative group">
                                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-10 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Error Message Display */}
                            <AnimatePresence>
                                {errorMessage && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-sm text-red-200 flex items-center gap-2"
                                    >
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        {errorMessage}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex justify-end">
                                <Link href="/forgot-password" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                                    Forgot Password?
                                </Link>
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
                                        <span>Sign In</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </motion.button>

                            <div className="text-center text-sm text-gray-400">
                                Don't have an account?{' '}
                                <Link href="/signup" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                                    Sign Up
                                </Link>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>
        </CinematicLayout>
    )
}

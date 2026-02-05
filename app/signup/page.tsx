'use client'

import { useState, Suspense, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Mail, Lock, CheckCircle, ArrowRight, Truck, Package, Briefcase, Building, ShieldCheck, Smartphone, Send, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import CinematicLayout from '../../components/CinematicLayout'
import { supabase } from '../../lib/supabase'
import { ToastContainer, ToastProps } from '../../components/Toast'

function SignupContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialRole = searchParams.get('role')

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    // New State for specialized inputs
    const [companyId, setCompanyId] = useState('') // For Shippers
    const [dotNumber, setDotNumber] = useState('') // For Carriers
    const [companyName, setCompanyName] = useState('') // For Carriers
    const [experience, setExperience] = useState('') // For Carriers

    // Mobile & OTP State
    const [mobileNumber, setMobileNumber] = useState('')
    const [otpSent, setOtpSent] = useState(false)
    const [otp, setOtp] = useState('')
    const [isOtpVerified, setIsOtpVerified] = useState(false)
    const [otpLoading, setOtpLoading] = useState(false)
    const [timer, setTimer] = useState(0)
    const [generatedOtp, setGeneratedOtp] = useState('')

    const [selectedRole, setSelectedRole] = useState<string | null>(initialRole || null)
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [toasts, setToasts] = useState<ToastProps[]>([])

    const roles = [
        { id: 'customer', title: 'Customer', icon: Briefcase },
        { id: 'shipper', title: 'Shipper', icon: Package },
        { id: 'carrier', title: 'Carrier', icon: Truck },
    ]

    const addToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
        const id = Date.now().toString()
        setToasts(prev => [...prev, { ...toast, id, onClose: removeToast }])
    }

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
    }

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (timer > 0) {
            interval = setInterval(() => setTimer((prev) => prev - 1), 1000)
        }
        return () => clearInterval(interval)
    }, [timer])

    const validateEmail = (role: string, email: string): boolean => {
        const genericDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
        const domain = email.split('@')[1]

        if (role === 'shipper' || role === 'carrier') {
            if (genericDomains.includes(domain)) {
                setErrorMessage(`Professional ${role} accounts cannot use public email providers (gmail, yahoo, etc). Please use your organization's domain.`)
                return false
            }
        }
        return true
    }

    const handleSendOtp = async () => {
        if (!mobileNumber || mobileNumber.length < 10) {
            setErrorMessage('Please enter a valid mobile number')
            return
        }
        setErrorMessage('')
        setOtpLoading(true)

        // Generate random 6-digit OTP
        const randomOtp = Math.floor(100000 + Math.random() * 900000).toString()
        setGeneratedOtp(randomOtp)

        // Simulate OTP API
        await new Promise(resolve => setTimeout(resolve, 1500))

        console.log(`DEV ONLY: Generated OTP for ${mobileNumber} is ${randomOtp}`)

        setOtpSent(true)
        setTimer(60) // 1 minute cooldown
        setOtpLoading(false)
        addToast({ type: 'success', title: 'OTP Sent', message: `Code sent to ${mobileNumber}` })
    }

    const handleVerifyOtp = async () => {
        if (otp !== generatedOtp) {
            setErrorMessage('Invalid OTP. Please check the console for the code.')
            return
        }
        setIsOtpVerified(true)
        setErrorMessage('')
        addToast({ type: 'success', title: 'Number Verified', message: 'You can now proceed.' })
    }

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMessage('')

        if (!selectedRole) {
            setErrorMessage('Please select a role')
            return
        }

        if (!isOtpVerified) {
            setErrorMessage('Please verify your mobile number first')
            return
        }

        // Role-based validation
        if (!validateEmail(selectedRole, email)) {
            return
        }

        if (password.length < 6) {
            setErrorMessage('Password must be at least 6 characters long.')
            return
        }

        if (selectedRole === 'shipper' && !companyId) {
            setErrorMessage('Shippers must provide a valid Company Registration ID.')
            return
        }

        if (selectedRole === 'carrier' && !dotNumber) {
            setErrorMessage('Carriers must provide a valid DOT Number.')
            return
        }

        setIsLoading(true)

        console.log('Attempting signup:', { email, role: selectedRole, mobileNumber }) // Debug log

        const metadata: any = {
            full_name: name,
            role: selectedRole,
            mobile_number: mobileNumber,
        }

        // Only include role-specific fields if they have values
        if (companyId) metadata.company_id = companyId
        if (dotNumber) metadata.dot_number = dotNumber

        let { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        })

        if (error) {
            console.warn('Signup with metadata failed, retrying without metadata...', error)

            // Retry without metadata to isolate the issue
            const retryResult = await supabase.auth.signUp({
                email,
                password,
            })

            if (retryResult.error) {
                console.error('Retry Signup also failed:', retryResult.error)
                setErrorMessage(retryResult.error.message || 'Signup failed. detailed error in console.')
                setIsLoading(false)
                return
            }

            // Retry succeeded
            data = retryResult.data

            // Try to update metadata separately if possible (optional, or just proceed)
            /* 
            if (data.user) {
                await supabase.auth.updateUser({ data: metadata })
            } 
            */
        }

        // Assuming default behavior is confirm email, but if auto-confirm is on:
        if (data.user) {
            // Initialize user-specific tables
            if (selectedRole === 'carrier') {
                await supabase.from('carrier_profiles').upsert({
                    carrier_id: data.user.id,
                    available_capacity: 10,
                    reliability_score: 5.0,
                    available_routes: [],
                    base_location: 'Default',
                    business_details: {
                        company_name: companyName || name,
                        contact_number: mobileNumber,
                        experience_years: parseInt(experience) || 0,
                        license_id: dotNumber
                    },
                    delivery_speed_options: {
                        standard: '5-7 days',
                        express: '2-3 days',
                        overnight: '24 hours'
                    },
                    risk_factors: {
                        weather: 'low',
                        traffic: 'medium',
                        region: 'low'
                    },
                    cost_structure: {
                        base_rate: 500,
                        per_mile: 2.5,
                        fuel_surcharge: 10
                    }
                }, { onConflict: 'carrier_id' })
            }
        }

        setIsLoading(false)

        if (data.session) {
            addToast({ type: 'success', title: 'Welcome!', message: 'Account created successfully.' })
            setTimeout(() => router.push(`/${selectedRole}-dashboard`), 1500)
        } else {
            // User created but verification email sent
            addToast({ type: 'success', title: 'Check your Email', message: 'Verification link sent. Please verify to login.' })
            setTimeout(() => router.push('/login'), 3000)
        }
    }

    return (
        <CinematicLayout>
            <ToastContainer toasts={toasts} onClose={removeToast} />
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
                                Create Account
                            </h1>
                            <p className="text-gray-400">Join the future of negotiation</p>
                        </div>

                        <form onSubmit={handleSignup} className="space-y-6">
                            {/* Role Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-300 ml-1">Select Role</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {roles.map((role) => (
                                        <div
                                            key={role.id}
                                            onClick={() => {
                                                setSelectedRole(role.id)
                                                setErrorMessage('')
                                                // Reset role specific fields if needed
                                            }}
                                            className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center justify-center transition-all duration-300 ${selectedRole === role.id
                                                ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-lg shadow-cyan-500/20'
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                                                }`}
                                        >
                                            <role.icon className="w-6 h-6 mb-2" />
                                            <span className="text-xs font-medium">{role.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Input Fields */}
                            <div className="space-y-4">
                                <div className="relative group">
                                    <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-10 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                                        required
                                    />
                                </div>

                                <div className="relative group">
                                    <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                                    <input
                                        type="email"
                                        placeholder={selectedRole === 'customer' ? "Email (e.g., user@email.com)" : "Business Email (e.g., name@company.com)"}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-10 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                                        required
                                    />
                                    {/* Helper Text for format */}
                                    {selectedRole !== 'customer' && <p className="text-xs text-gray-500 mt-1 ml-1">* Official domain required</p>}
                                </div>

                                {/* Mobile & OTP Section */}
                                <div className="space-y-2">
                                    <div className="relative group flex gap-2">
                                        <div className="relative flex-grow">
                                            <Smartphone className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                                            <input
                                                type="tel"
                                                placeholder="Mobile Number"
                                                value={mobileNumber}
                                                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))} // Only numbers
                                                disabled={isOtpVerified}
                                                className="w-full bg-black/50 border border-white/10 rounded-lg px-10 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all disabled:opacity-50"
                                                required
                                            />
                                            {isOtpVerified && <CheckCircle className="absolute right-3 top-3.5 w-5 h-5 text-green-500" />}
                                        </div>
                                        {!isOtpVerified && (
                                            <button
                                                type="button"
                                                onClick={handleSendOtp}
                                                disabled={otpLoading || timer > 0 || isOtpVerified}
                                                className="px-4 bg-white/10 border border-white/10 rounded-lg text-sm hover:bg-white/20 disabled:opacity-50 transition-all whitespace-nowrap"
                                            >
                                                {otpLoading ? 'Sending...' : timer > 0 ? `${timer}s` : 'Send OTP'}
                                            </button>
                                        )}
                                    </div>

                                    {otpSent && !isOtpVerified && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="flex gap-2"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Enter OTP"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-center tracking-widest"
                                                maxLength={6}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleVerifyOtp}
                                                className="px-6 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-medium transition-colors"
                                            >
                                                Verify
                                            </button>
                                        </motion.div>
                                    )}
                                </div>


                                {/* Conditional Fields based on Role */}
                                {selectedRole === 'shipper' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="relative group space-y-1"
                                    >
                                        <Building className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Company Reg / Tax ID (e.g. 12-3456789)"
                                            value={companyId}
                                            onChange={(e) => setCompanyId(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-lg px-10 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                                            required
                                        />
                                        <p className="text-xs text-gray-500 ml-1">* Format: XX-XXXXXXX (9 digits)</p>
                                    </motion.div>
                                )}

                                {selectedRole === 'carrier' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="space-y-4"
                                    >
                                        <div className="relative group">
                                            <Building className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="Legal Company Name"
                                                value={companyName}
                                                onChange={(e) => setCompanyName(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-lg px-10 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="relative group">
                                                <ShieldCheck className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                                                <input
                                                    type="text"
                                                    placeholder="DOT Number"
                                                    value={dotNumber}
                                                    onChange={(e) => setDotNumber(e.target.value)}
                                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-10 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                                                    required
                                                />
                                            </div>
                                            <div className="relative group">
                                                <Briefcase className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                                                <input
                                                    type="number"
                                                    placeholder="Years Active"
                                                    value={experience}
                                                    onChange={(e) => setExperience(e.target.value)}
                                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-10 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

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
                                        <span>Create Account</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </motion.button>

                            <div className="text-center text-sm text-gray-400">
                                Already have an account?{' '}
                                <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                                    Sign In
                                </Link>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>
        </CinematicLayout>
    )
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-cyan-400">Loading...</div>}>
            <SignupContent />
        </Suspense>
    )
}

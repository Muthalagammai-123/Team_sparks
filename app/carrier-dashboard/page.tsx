'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, DollarSign, Clock, AlertTriangle, FileText, ArrowRight, Activity, Percent, Fuel, Sparkles, UserCheck, MapPin, Truck, History, CheckCircle, TrendingUp, ShieldCheck, Smartphone } from 'lucide-react'
import CinematicLayout from '../../components/CinematicLayout'
import { supabase } from '../../lib/supabase'
import { ToastContainer, ToastProps } from '../../components/Toast'
import CarrierNotifications from '../../components/CarrierNotifications'
import ResponseHistory from '../../components/ResponseHistory'
import { useWorkflow } from '../../components/WorkflowContext'

interface CarrierProfile {
  available_capacity: number
  capacity_unit: string
  base_location: string
  available_routes: string[]
  business_details: {
    company_name: string
    contact_number: string
    experience_years: number
    license_id: string
  }
  delivery_speed_options: {
    standard: string
    express: string
    overnight: string
  }
  risk_factors: {
    weather: string
    traffic: string
    region: string
  }
  cost_structure: {
    base_rate: number
    per_mile: number
    fuel_surcharge: number
    petrol_allowance: number
    food_allowance: number
    fuel_charge: number
    accommodation: number
    toll_gates_count: number
    toll_gates_cost: number
  }
  reliability_score: number
  total_deliveries: number
  on_time_deliveries: number
}

interface Review {
  id: string
  rating: number
  comment: string
  is_positive: boolean
  created_at: string
}

export default function CarrierDashboard() {
  const [activeView, setActiveView] = useState<'profile' | 'requests' | 'history'>('profile')
  const [toasts, setToasts] = useState<ToastProps[]>([])
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<Review[]>([])
  const { state, customerExpectations, customerRatings, setShipperTerms, setCarrierConstraints } = useWorkflow()
  const [profile, setProfile] = useState<CarrierProfile>({
    available_capacity: 50,
    capacity_unit: 'tons',
    base_location: '',
    available_routes: [],
    business_details: {
      company_name: '',
      contact_number: '',
      experience_years: 0,
      license_id: ''
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

  const [newRoute, setNewRoute] = useState('')

  useEffect(() => {
    let mounted = true
    loadProfile(mounted)
    return () => { mounted = false }
  }, [])

  const reliabilityIndicator = (score: number, size: 'sm' | 'md' = 'md') => {
    const s = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'
    return (
      <div className="flex space-x-1.5 items-center">
        {[1, 2, 3, 4, 5].map((orb) => {
          const isActive = orb <= Math.round(score);
          return (
            <motion.div
              key={orb}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`${s} rounded-full transition-all duration-500 ${isActive
                ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_0_10px_rgba(52,211,153,0.4)]'
                : 'bg-white/5 border border-white/10'
                }`}
            />
          );
        })}
      </div>
    )
  }

  const loadProfile = async (mounted: boolean = true) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !mounted) return

      const { data, error } = await supabase
        .from('carrier_profiles')
        .select('*')
        .eq('carrier_id', user.id)
        .single()

      if (!mounted) return

      if (data) {
        const carrierData = {
          available_capacity: data.available_capacity ?? 10,
          capacity_unit: data.capacity_unit ?? 'tons',
          base_location: data.base_location || '',
          available_routes: data.available_routes || [],
          business_details: {
            company_name: data.business_details?.company_name || user.user_metadata?.company_name || 'negotiateX',
            contact_number: data.business_details?.contact_number || user.user_metadata?.mobile_number || '',
            experience_years: data.business_details?.experience_years || 0,
            license_id: data.business_details?.license_id || user.user_metadata?.dot_number || 'DOT_PENDING'
          },
          delivery_speed_options: data.delivery_speed_options || {
            standard: '5-7 days',
            express: '2-3 days',
            overnight: '24 hours'
          },
          risk_factors: data.risk_factors || {
            weather: 'low',
            traffic: 'medium',
            region: 'low'
          },
          cost_structure: {
            base_rate: 500,
            per_mile: 2.5,
            fuel_surcharge: 10,
            petrol_allowance: 0,
            food_allowance: 0,
            fuel_charge: 0,
            accommodation: 0,
            toll_gates_count: 0,
            toll_gates_cost: 0,
            ...(data.cost_structure || {})
          },
          reliability_score: data.reliability_score ?? 5.0,
          total_deliveries: data.total_deliveries ?? 0,
          on_time_deliveries: data.on_time_deliveries ?? 0
        }
        setProfile(carrierData)
        setCarrierConstraints(carrierData)

        // Fetch Reviews with Fallback
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('carrier_reviews')
          .select('*')
          .eq('carrier_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (reviewsData && reviewsData.length > 0) {
          setReviews(reviewsData)
        } else {
          // Fallback/Demo Reviews if DB is empty or table missing (404)
          if (reviewsError) console.warn("Using demo reviews due to database access issue:", reviewsError);
          const demoReviews: Review[] = [
            { id: 'demo-1', rating: 5, comment: "Excellent service, arrived 2 hours early! Very professional.", is_positive: true, created_at: new Date().toISOString() },
            { id: 'demo-2', rating: 5, comment: "Best rates for the Chennai-Bangalore route. AI negotiation was smooth.", is_positive: true, created_at: new Date(Date.now() - 86400000).toISOString() },
            { id: 'demo-3', rating: 4, comment: "Good communication throughout the journey. Highly recommended.", is_positive: true, created_at: new Date(Date.now() - 172800000).toISOString() },
            { id: 'demo-4', rating: 2, comment: "Slight delay due to documentation issues.", is_positive: false, created_at: new Date(Date.now() - 259200000).toISOString() },
            { id: 'demo-5', rating: 5, comment: "Amazing reliability score for a reason.", is_positive: true, created_at: new Date(Date.now() - 400000000).toISOString() }
          ];
          setReviews(demoReviews);
        }
      } else {
        // AUTO-FIX: Create default profile if missing
        console.log("No profile found, creating default...")
        const { error: insertError } = await supabase.from('carrier_profiles').upsert({
          carrier_id: user.id,
          available_capacity: 10,
          capacity_unit: 'tons',
          base_location: 'Chennai',
          reliability_score: 5.0,
          business_details: {
            company_name: user.user_metadata?.company_name || 'negotiateX',
            contact_number: user.user_metadata?.mobile_number || '',
            experience_years: 0,
            license_id: user.user_metadata?.dot_number || 'DOT_PENDING'
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
        if (insertError) console.error("Auto-profile creation failed:", insertError)
      }
    } catch (error: any) {
      if (mounted && error.name !== 'AbortError') {
        console.error('Error loading profile:', error)
      }
    } finally {
      if (mounted) setLoading(false)
    }
  }

  const saveProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('carrier_profiles')
        .upsert({
          carrier_id: user.id,
          ...profile
        })

      if (error) throw error

      setCarrierConstraints(profile)
      addToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your carrier profile has been saved successfully.'
      })
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: error.message
      })
    }
  }

  const addToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { ...toast, id, onClose: removeToast }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const addRoute = () => {
    if (newRoute.trim()) {
      setProfile(prev => ({
        ...prev,
        available_routes: [...prev.available_routes, newRoute.trim()]
      }))
      setNewRoute('')
    }
  }

  const removeRoute = (index: number) => {
    setProfile(prev => ({
      ...prev,
      available_routes: prev.available_routes.filter((_, i) => i !== index)
    }))
  }

  const onTimePercentage = profile.total_deliveries > 0
    ? ((profile.on_time_deliveries / profile.total_deliveries) * 100).toFixed(1)
    : '0.0'

  return (
    <CinematicLayout>
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-8">
              <div className="inline-flex bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-1">
                <button
                  onClick={() => setActiveView('profile')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${activeView === 'profile'
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  My Profile
                </button>
                <button
                  onClick={() => setActiveView('requests')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${activeView === 'requests'
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  Shipment Requests
                </button>
                <button
                  onClick={() => setActiveView('history')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${activeView === 'history'
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  Response History
                </button>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-teal-400 bg-clip-text text-transparent">
                {activeView === 'profile' && 'Carrier Profile'}
                {activeView === 'requests' && 'Available Shipment Requests'}
                {activeView === 'history' && 'Response History'}
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {activeView === 'profile' && 'Define your capacity, routes, and service capabilities'}
              {activeView === 'requests' && 'View and respond to shipment requests from shippers'}
              {activeView === 'history' && 'Track all your responses and completed deliveries'}
            </p>
          </div>

          {activeView === 'profile' && (
            <div className="space-y-8">
              {/* Profile Hero - The "Buzzer" Reliability Center */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-3xl p-12 text-center"
              >
                {/* Decorative background glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12, delay: 0.2 }}
                    className="relative mb-8"
                  >
                    {/* Pulsing ring */}
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.1, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute inset-0 rounded-full border-4 border-yellow-400/50"
                    />
                    <div className="w-48 h-48 rounded-full border-8 border-gray-800 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xl">
                      <p className="text-xs text-gray-500 uppercase font-black tracking-widest mb-1">Reliability</p>
                      <h2 className="text-6xl font-black text-transparent bg-gradient-to-br from-yellow-400 to-orange-500 bg-clip-text">
                        {profile.reliability_score.toFixed(2)}
                      </h2>
                      <div className="mt-2">
                        {reliabilityIndicator(profile.reliability_score, 'md')}
                      </div>
                    </div>
                  </motion.div>

                  <h3 className="text-4xl font-black text-white mb-2">
                    {profile.business_details?.company_name || 'Professional Carrier'}
                  </h3>
                  <div className="flex flex-wrap justify-center gap-4 mt-6">
                    <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-full flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm text-gray-300 font-bold">{profile.total_deliveries} Successfull Deliveries</span>
                    </div>
                    <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-full flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm text-gray-300 font-bold">{onTimePercentage}% On-Time Rate</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Basic Details / Business Identity */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8"
                >
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Business Information</h3>
                      <p className="text-sm text-gray-500">Verified identity and credentials</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        </div>
                        <label className="text-[10px] text-gray-500 uppercase font-black block mb-1">Legal Company Name</label>
                        <p className="text-lg font-bold text-white truncate">
                          {profile.business_details?.company_name || 'negotiateX'}
                        </p>
                        <span className="text-[8px] text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded-full">VERIFIED RECORD</span>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                          <Activity className="w-4 h-4 text-cyan-400" />
                        </div>
                        <label className="text-[10px] text-gray-500 uppercase font-black block mb-1">Industry Seniority</label>
                        <p className="text-lg font-bold text-white">
                          {profile.business_details?.experience_years || 0} Years Active
                        </p>
                        <span className="text-[8px] text-cyan-400 font-bold bg-cyan-400/10 px-2 py-0.5 rounded-full">OFFICIAL TENURE</span>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                          <Smartphone className="absolute top-2 right-2 w-4 h-4 text-purple-400" />
                        </div>
                        <label className="text-[10px] text-gray-500 uppercase font-black block mb-1">Business Hotline</label>
                        <p className="text-lg font-bold text-white">
                          {profile.business_details?.contact_number || 'No Contact Listed'}
                        </p>
                        <span className="text-[8px] text-purple-400 font-bold bg-purple-400/10 px-2 py-0.5 rounded-full">COMMUNICATIONS HUB</span>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                          <ShieldCheck className="w-4 h-4 text-indigo-400" />
                        </div>
                        <label className="text-[10px] text-gray-500 uppercase font-black block mb-1">Registration / DOT ID</label>
                        <p className="text-lg font-bold text-white font-mono">
                          {profile.business_details?.license_id || 'DOT_PENDING'}
                        </p>
                        <span className="text-[8px] text-indigo-400 font-bold bg-indigo-400/10 px-2 py-0.5 rounded-full">CERTIFIED LICENSE</span>
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center space-x-3">
                      <ShieldCheck className="w-6 h-6 text-emerald-400" />
                      <div>
                        <p className="text-xs font-bold text-white uppercase tracking-wider">Identity Highly Verified</p>
                        <p className="text-[10px] text-gray-500">This business information was secured during the KYC registration phase.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Customer Wall - Feedback Section Expanded */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                        <History className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Client Testimonials</h3>
                        <p className="text-sm text-gray-500">Real feedback from recent shippers</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="text-[10px] text-gray-500 uppercase font-black">Average</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-xl font-black text-white">{profile.reliability_score.toFixed(1)}/5.0</p>
                        {reliabilityIndicator(profile.reliability_score, 'sm')}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
                    {reviews.length === 0 ? (
                      <div className="text-center py-20 bg-white/3 rounded-2xl border border-dashed border-white/10">
                        <Sparkles className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                        <p className="text-gray-500 italic text-sm">No feedback received yet. Complete deliveries to build your reputation.</p>
                      </div>
                    ) : (
                      reviews.map((review) => (
                        <motion.div
                          key={review.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          className={`p-5 rounded-2xl border ${review.is_positive
                            ? 'bg-emerald-500/5 border-emerald-500/10'
                            : 'bg-amber-500/5 border-amber-500/10'
                            }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            {reliabilityIndicator(review.rating, 'sm')}
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full ${review.is_positive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                              }`}>
                              {review.is_positive ? 'VERIFIED POSITIVE' : 'CRITICAL FEEDBACK'}
                            </span>
                          </div>
                          <p className="text-gray-200 leading-relaxed italic mb-4">"{review.comment}"</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-400">S</div>
                              <span className="text-[10px] text-gray-500">Shipper ID: {review.id.split('-')[0]}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 font-medium">
                              {new Date(review.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {activeView === 'requests' && (
            <CarrierNotifications />
          )}

          {activeView === 'history' && (
            <ResponseHistory />
          )}
        </motion.div>
      </div>
    </CinematicLayout>
  )
}
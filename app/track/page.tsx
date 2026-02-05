"use client"

import Map, { Marker, NavigationControl, Source, Layer } from "react-map-gl/mapbox"
import { useEffect, useState, Suspense } from "react"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, Truck, RefreshCw, MapPin, Gauge, Compass, AlertTriangle, ShieldCheck, Clock, Map as MapIcon, Layers, MessageCircle, Activity } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import "mapbox-gl/dist/mapbox-gl.css"

interface CarrierLocation {
    carrier_id: string
    latitude: number
    longitude: number
    speed: number
    heading: number
    updated_at: string
}

interface ShipmentRoute {
    source: string
    destination: string
    sourceCoords?: [number, number]
    destCoords?: [number, number]
}

function TrackingContent() {
    const [location, setLocation] = useState<CarrierLocation | null>(null)
    const [prevLocation, setPrevLocation] = useState<CarrierLocation | null>(null)
    const [breadcrumbs, setBreadcrumbs] = useState<[number, number][]>([])
    const [shipmentRoute, setShipmentRoute] = useState<ShipmentRoute | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const searchParams = useSearchParams()
    const carrierId = searchParams.get('carrier')
    const shipmentId = searchParams.get('shipment')

    // Check for Mapbox Key
    useEffect(() => {
        if (!process.env.NEXT_PUBLIC_MAPBOX_KEY) {
            setError("Mapbox Access Token is missing. Please add NEXT_PUBLIC_MAPBOX_KEY to your .env.local and restart the dev server.")
        }
    }, [])

    // Fetch shipment route details
    useEffect(() => {
        const geocodeLocation = async (locationName: string): Promise<[number, number] | null> => {
            try {
                const response = await fetch(
                    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_KEY}`
                )
                const data = await response.json()
                if (data.features && data.features.length > 0) {
                    const [lng, lat] = data.features[0].center
                    return [lat, lng]
                }
                return null
            } catch (e) {
                console.error("Geocoding error:", e)
                return null
            }
        }

        const fetchShipmentRoute = async () => {
            if (!shipmentId) return

            try {
                const { data, error: fetchError } = await supabase
                    .from('shipment_requests')
                    .select('source_location, destination_location')
                    .eq('id', shipmentId)
                    .single()

                if (fetchError) {
                    console.log("No shipment found:", fetchError)
                } else if (data) {
                    const sourceCoords = await geocodeLocation(data.source_location)
                    const destCoords = await geocodeLocation(data.destination_location)

                    setShipmentRoute({
                        source: data.source_location,
                        destination: data.destination_location,
                        sourceCoords: sourceCoords || undefined,
                        destCoords: destCoords || undefined
                    })
                }
            } catch (e) {
                console.error("Error fetching shipment route:", e)
            }
        }

        fetchShipmentRoute()
    }, [shipmentId])

    // Fetch initial location
    useEffect(() => {
        const fetchInitialLocation = async () => {
            if (!carrierId) {
                setError("No carrier ID provided")
                setLoading(false)
                return
            }

            try {
                const { data, error: fetchError } = await supabase
                    .from('carrier_live_location')
                    .select('*')
                    .eq('carrier_id', carrierId)
                    .single()

                if (fetchError) {
                    console.log("No initial location found, waiting for updates...", fetchError)
                } else if (data) {
                    setLocation(data)
                    setPrevLocation(data)
                    setBreadcrumbs([[data.longitude, data.latitude]])
                }
            } catch (e) {
                console.error("Error fetching location:", e)
            } finally {
                setLoading(false)
            }
        }

        fetchInitialLocation()
    }, [carrierId])

    // Subscribe to realtime updates
    useEffect(() => {
        if (!carrierId) return

        const channel = supabase
            .channel(`track-${carrierId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "carrier_live_location",
                    filter: `carrier_id=eq.${carrierId}`
                },
                (payload) => {
                    const newLoc = payload.new as CarrierLocation
                    if (newLoc) {
                        setPrevLocation(prev => location || prev)
                        setLocation(newLoc)
                        setBreadcrumbs(prev => {
                            const last = prev[prev.length - 1]
                            if (last && last[0] === newLoc.longitude && last[1] === newLoc.latitude) return prev
                            const newPoint: [number, number] = [newLoc.longitude, newLoc.latitude]
                            return [...prev, newPoint].slice(-100)
                        })
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [carrierId, location])

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString()
    }

    if (loading) {
        return (
            <div className="h-screen w-screen bg-gray-950 flex items-center justify-center font-sans">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-400 mx-auto mb-4"></div>
                    <p className="text-gray-400 text-lg uppercase font-black tracking-widest">Bridging Satellite Link...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="h-screen w-screen bg-gray-950 flex items-center justify-center font-sans">
                <div className="text-center bg-red-500/10 border border-red-500/30 rounded-[32px] p-12 max-w-lg">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                    <p className="text-red-400 text-xl font-bold mb-6">{error}</p>
                    <button
                        onClick={() => router.back()}
                        className="px-10 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white font-bold border border-white/10 transition-all font-sans"
                    >
                        Return to Command Center
                    </button>
                </div>
            </div>
        )
    }

    const isCongested = (location?.speed || 0) < 25

    return (
        <div className="h-screen w-screen relative overflow-hidden bg-gray-950 font-sans">
            {/* Status Overlay */}
            <div className="absolute top-6 right-6 z-50 flex flex-col items-end gap-2">
                <div className={`px-4 py-2 rounded-xl border backdrop-blur-md flex items-center gap-2 transition-all ${location ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                    <Activity className={`w-4 h-4 ${location ? 'animate-pulse' : ''}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                        {location ? 'Live Telemetry Active' : 'Waiting for Data...'}
                    </span>
                </div>
            </div>

            {/* Map */}
            <Map
                mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_KEY || ""}
                initialViewState={{
                    latitude: location?.latitude || 13.0827,
                    longitude: location?.longitude || 80.2707,
                    zoom: 15,
                    pitch: 60,
                    bearing: 0
                }}
                style={{ width: "100%", height: "100%" }}
                mapStyle="mapbox://styles/mapbox/dark-v11"
            >
                {/* Traffic Layer */}
                <Source id="traffic-source" type="vector" url="mapbox://mapbox.mapbox-traffic-v1">
                    <Layer
                        id="traffic-layer"
                        type="line"
                        source="traffic-source"
                        source-layer="traffic"
                        paint={{
                            "line-width": 6,
                            "line-color": [
                                "interpolate", ["linear"], ["coalesce", ["get", "congestion_level"], 0],
                                0, "#10b981",
                                0.4, "#f59e0b",
                                0.8, "#ef4444"
                            ],
                            "line-opacity": 0.8
                        }}
                    />
                </Source>

                {/* Trail */}
                {breadcrumbs.length > 1 && (
                    <Source
                        id="route"
                        type="geojson"
                        data={{
                            type: "Feature",
                            properties: {},
                            geometry: { type: "LineString", coordinates: breadcrumbs }
                        }}
                    >
                        <Layer
                            id="route-layer"
                            type="line"
                            paint={{
                                "line-color": "#06b6d4",
                                "line-width": 5,
                                "line-blur": 2,
                                "line-opacity": 0.6
                            }}
                        />
                    </Source>
                )}

                {location && (
                    <Marker latitude={location.latitude} longitude={location.longitude} anchor="center">
                        <motion.div
                            animate={{ rotate: location.heading }}
                            transition={{ type: "spring", stiffness: 50, damping: 15 }}
                            className="relative group"
                        >
                            <div className={`absolute -inset-8 blur-2xl rounded-full transition-colors duration-1000 ${isCongested ? 'bg-red-500/40' : 'bg-cyan-500/40'}`} />
                            <div className="relative w-16 h-16 bg-black border-2 border-white/20 rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden group-hover:scale-110 transition-transform">
                                <div className={`absolute inset-0 opacity-20 ${isCongested ? 'bg-red-500' : 'bg-cyan-500'}`} />
                                <Truck className={`w-10 h-10 relative z-10 transition-colors duration-500 ${isCongested ? 'text-red-400' : 'text-cyan-400'}`} />
                            </div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: -45 }}
                                className="absolute left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-full whitespace-nowrap flex items-center gap-2"
                            >
                                <span className={`w-2 h-2 rounded-full ${isCongested ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse`} />
                                <span className="text-[10px] font-black text-white uppercase tracking-tighter">
                                    {isCongested ? 'Congested Corridor' : 'Velocity Stable'}
                                </span>
                            </motion.div>
                        </motion.div>
                    </Marker>
                )}

                {/* Source Marker */}
                {shipmentRoute?.sourceCoords && (
                    <Marker latitude={shipmentRoute.sourceCoords[0]} longitude={shipmentRoute.sourceCoords[1]} anchor="bottom">
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-green-500/20 blur-xl rounded-full" />
                            <div className="relative w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl border-2 border-white/30">
                                <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-xl border border-green-500/30 px-3 py-1 rounded-full whitespace-nowrap">
                                <span className="text-[10px] font-black text-green-400 uppercase tracking-wider">Source: {shipmentRoute.source}</span>
                            </div>
                        </div>
                    </Marker>
                )}

                {/* Destination Marker */}
                {shipmentRoute?.destCoords && (
                    <Marker latitude={shipmentRoute.destCoords[0]} longitude={shipmentRoute.destCoords[1]} anchor="bottom">
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-purple-500/20 blur-xl rounded-full" />
                            <div className="relative w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-2xl border-2 border-white/30">
                                <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-xl border border-purple-500/30 px-3 py-1 rounded-full whitespace-nowrap">
                                <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">Dest: {shipmentRoute.destination}</span>
                            </div>
                        </div>
                    </Marker>
                )}
            </Map>

            {/* HUD */}
            <div className="absolute inset-x-8 bottom-12 flex justify-between items-end pointer-events-none">
                {/* Unit Info */}
                <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="w-80 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[32px] p-8 pointer-events-auto shadow-2xl"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <Truck className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-white font-black text-xl tracking-tight">Unit #4120</h2>
                            <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest">Active Deployment</p>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-xs font-bold">Status</span>
                            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${isCongested ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                {isCongested ? 'Congested' : 'In Transit'}
                            </span>
                        </div>
                        {shipmentRoute && (
                            <div className="flex flex-col gap-1 border-t border-white/5 pt-4">
                                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Route</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className="text-white text-xs font-bold truncate">{shipmentRoute.source}</span>
                                </div>
                                <div className="flex items-center gap-2 ml-1">
                                    <div className="w-px h-4 bg-gradient-to-b from-green-500 to-purple-500" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                                    <span className="text-white text-xs font-bold truncate">{shipmentRoute.destination}</span>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-xs font-bold">Last Sync</span>
                            <span className="text-white text-xs font-mono font-bold">
                                {location ? formatTime(location.updated_at) : '--:--'}
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Speedometer */}
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="relative group pointer-events-auto"
                >
                    <div className={`absolute inset-0 blur-3xl rounded-full transition-colors duration-1000 ${isCongested ? 'bg-red-500/20' : 'bg-cyan-500/20'}`} />
                    <div className="relative bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[100px] px-16 py-10 flex flex-col items-center">
                        <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em] mb-2">Current Velocity</h4>
                        <div className="flex items-baseline gap-4 relative">
                            <span className={`text-9xl font-black tracking-tighter tabular-nums transition-colors duration-500 leading-none ${isCongested ? 'text-red-500' : 'text-white'}`}>
                                {Math.round(location?.speed || 0)}
                            </span>
                            <div className="flex flex-col">
                                <span className={`text-xl font-black transition-colors duration-500 ${isCongested ? 'text-red-400' : 'text-cyan-400'}`}>KM/H</span>
                                <div className={`h-1.5 w-full rounded-full mt-2 transition-colors duration-500 ${isCongested ? 'bg-red-500' : 'bg-cyan-500'} animate-pulse`} />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Navigation */}
                <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="w-80 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[32px] p-8 pointer-events-auto shadow-2xl"
                >
                    <div className="flex items-center gap-3 mb-8">
                        <Compass className="w-5 h-5 text-purple-400" />
                        <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Navigation</h4>
                    </div>
                    <div className="flex items-center justify-between px-2">
                        <div>
                            <p className="text-white text-5xl font-black tracking-tighter">
                                {Math.round(location?.heading || 0)}°
                            </p>
                            <p className="text-purple-400 font-bold text-lg uppercase tracking-widest mt-1">
                                {getDirection(location?.heading || 0)}
                            </p>
                        </div>
                        <div className="w-24 h-24 rounded-full border-4 border-white/5 relative flex items-center justify-center">
                            <motion.div
                                animate={{ rotate: location?.heading || 0 }}
                                className="w-1 h-12 bg-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                            />
                            <div className="w-3 h-3 bg-white rounded-full absolute -top-1" />
                        </div>
                    </div>
                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-[8px] text-gray-500 uppercase font-black mb-1">Elevation</p>
                            <p className="text-white font-bold text-sm">42m MSL</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-[8px] text-gray-500 uppercase font-black mb-1">Vibration</p>
                            <p className="text-white font-bold text-sm">0.4 G</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            <AnimatePresence>
                {!location && !loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/80 backdrop-blur-md z-40"
                    >
                        <div className="text-center bg-gray-900/40 border border-white/10 rounded-[40px] p-12 max-w-lg shadow-2xl">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full" />
                                <div className="relative w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                                    <Truck className="w-12 h-12 text-white" />
                                </div>
                            </div>
                            <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Initializing Tracking...</h3>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-4 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-bold transition-all"
                            >
                                Re-sync System
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function getDirection(heading: number | null): string {
    if (heading === null) return "N"
    const directions = ["North", "North East", "East", "South East", "South", "South West", "West", "North West"]
    const index = Math.round(heading / 45) % 8
    return directions[index]
}

export default function LiveTrackingPage() {
    return (
        <Suspense fallback={<div className="h-screen w-screen bg-gray-950 flex items-center justify-center font-sans"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-400"></div></div>}>
            <TrackingContent />
        </Suspense>
    )
}

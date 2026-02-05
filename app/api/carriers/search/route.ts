import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Supabase configuration missing in environment variables')
        return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 })
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const body = await request.json()
        const { source } = body

        if (!source) return NextResponse.json({ carriers: [] })

        // Default: Chennai
        let searchLat = 13.0827
        let searchLng = 80.2707

        const lowSource = source.toLowerCase();
        if (lowSource.includes('chennai')) {
            searchLat = 13.0827; searchLng = 80.2707;
        } else if (lowSource.includes('coimbatore')) {
            searchLat = 11.0168; searchLng = 76.9558;
        } else if (lowSource.includes('madurai')) {
            searchLat = 9.9252; searchLng = 78.1198;
        } else if (lowSource.includes('trichy')) {
            searchLat = 10.7905; searchLng = 78.7047;
        }

        // 1. Fetch carrier profiles
        const { data: profiles, error: profileError } = await supabase
            .from('carrier_profiles')
            .select('*')
            .limit(10)

        if (profileError) {
            console.error('Profile fetch error:', profileError)
            return NextResponse.json({ error: `Database Error: ${profileError.message}` }, { status: 500 })
        }

        console.log(`Found ${profiles?.length || 0} carrier profiles`)

        if (!profiles || profiles.length === 0) {
            return NextResponse.json({ carriers: [] })
        }

        // 2. Fetch all user emails for these carriers
        const carrierIds = profiles.map(p => p.carrier_id)
        let { data: users, error: userError } = await supabase
            .from('auth.users')
            .select('id, email')
            .in('id', carrierIds)

        if (userError) {
            console.warn('Could not fetch emails from auth.users (likely restricted):', userError.message)
            users = []
        }

        // Create an email lookup map
        const emailMap: Record<string, string> = {}
        users?.forEach(u => { emailMap[u.id] = u.email || '' })

        // 3. Calculate distance and time
        const availableCarriers = (profiles || []).map(carrier => {
            const email = emailMap[carrier.carrier_id] || `carrier_${carrier.carrier_id.slice(1, 5)}@logistics.in`

            if (!carrier.latitude || !carrier.longitude) {
                return {
                    id: carrier.carrier_id,
                    email: email,
                    location: carrier.base_location || 'Unknown',
                    distance: "0.0",
                    time: "N/A",
                    reliability: carrier.reliability_score || 5.0,
                    capacity: carrier.available_capacity || 0
                }
            }

            const dLat = (carrier.latitude - searchLat) * Math.PI / 180;
            const dLon = (carrier.longitude - searchLng) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(searchLat * Math.PI / 180) * Math.cos(carrier.latitude * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = 6371 * c; // Earth radius in KM

            const travelTimeHours = distance / 60;
            const hours = Math.floor(travelTimeHours);
            const minutes = Math.round((travelTimeHours - hours) * 60);

            return {
                id: carrier.carrier_id,
                email: email,
                location: carrier.base_location,
                distance: distance.toFixed(1),
                time: `${hours}h ${minutes}m`,
                reliability: carrier.reliability_score || 5.0,
                capacity: carrier.available_capacity
            }
        }).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

        return NextResponse.json({ carriers: availableCarriers })

    } catch (error: any) {
        console.error('Search Carrier Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

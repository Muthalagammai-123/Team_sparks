import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Fetch shipments where this user is the "shipper" (customer)
        const { data: orders, error } = await supabase
            .from('shipment_requests')
            .select(`
                id,
                created_at,
                destination_location,
                status,
                special_terms,
                special_conditions,
                deadline
            `)
            .eq('shipper_id', userId)
            .order('created_at', { ascending: false })

        if (error) {
            throw error
        }

        return NextResponse.json({ orders })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

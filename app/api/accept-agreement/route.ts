import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const { negotiationId, shipmentId, carrierId } = await request.json()

        // 1. Update AI Negotiation Status
        const { error: negError } = await supabase
            .from('ai_negotiations')
            .update({ status: 'approved' })
            .eq('id', negotiationId)

        if (negError) throw negError

        // 2. Update Carrier Response Status
        const { error: respError } = await supabase
            .from('carrier_responses')
            .update({ status: 'accepted' })
            .eq('shipment_id', shipmentId)
            .eq('carrier_id', carrierId)

        if (respError) throw respError

        // 3. Update Shipment Request Status
        const { data: shipment, error: shipError } = await supabase
            .from('shipment_requests')
            .update({ status: 'matched' }) // Or 'in_progress'
            .eq('id', shipmentId)
            .select('shipper_id, source_location, destination_location')
            .single()

        if (shipError) throw shipError

        // 4. Notify Shipper
        console.log('Attempting to notify shipper:', shipment.shipper_id)
        const { error: notifError, data: notifData } = await supabase
            .from('shipper_notifications')
            .insert({
                shipper_id: shipment.shipper_id,
                shipment_id: shipmentId,
                message: `Carrier has ACCEPTED the fair agreement for route ${shipment.source_location} to ${shipment.destination_location}. Tracking initialized.`,
                type: 'status_update',
                status: 'unread'
            })
            .select()

        if (notifError) {
            console.error('Failed to insert shipper notification:', notifError)
            throw notifError
        } else {
            console.log('Shipper notification inserted successfully:', notifData)
        }

        // 5. Check for Batching Opportunities (Other shipments to same destination)
        const { data: opportunities } = await supabase
            .from('shipment_requests')
            .select('id, source_location, destination_location')
            .eq('destination_location', shipment.destination_location)
            .eq('status', 'pending')
            .neq('id', shipmentId)

        const notificationMessage = opportunities && opportunities.length > 0
            ? `We found ${opportunities.length} other pending shipments to ${shipment.destination_location}. You will be notified if you are matched for grouped delivery.`
            : null;

        return NextResponse.json({
            success: true,
            trackingId: `TRK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            batchingAlert: notificationMessage,
            opportunities: opportunities
        })

    } catch (error: any) {
        console.error('Accept agreement error:', error)
        return NextResponse.json(
            { error: 'Failed to process acceptance', details: error.message },
            { status: 500 }
        )
    }
}

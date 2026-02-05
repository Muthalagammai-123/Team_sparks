import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const body = await request.json()

        const {
            minBudget,
            maxBudget,
            deadline,
            timeWindow,
            priorityLevel,
            source,
            destination,
            slaRules,
            specialConditions,
            specialTerms,
            shipperId
        } = body

        // 1. Create shipment request in database
        const { data: shipment, error: shipmentError } = await supabase
            .from('shipment_requests')
            .insert({
                shipper_id: shipperId,
                source_location: source,
                destination_location: destination,
                min_budget: minBudget,
                max_budget: maxBudget,
                deadline: deadline,
                time_window: timeWindow,
                priority_level: priorityLevel,
                special_conditions: specialConditions,
                special_terms: specialTerms,
                sla_rules: slaRules,
                status: 'pending'
            })
            .select()
            .single()

        if (shipmentError) {
            console.error('Shipment creation error:', shipmentError)
            return NextResponse.json(
                { error: 'Failed to create shipment request', details: shipmentError.message },
                { status: 500 }
            )
        }

        // 2. Broadcast to carriers
        const sourceCity = source.split(',')[0].trim();
        console.log(`Searching for carriers for ${sourceCity}...`)
        const { data: carriers, error: carriersError } = await supabase
            .from('carrier_profiles')
            .select('carrier_id')
            .limit(100)

        if (carriersError) {
            console.error('Carriers fetch error:', carriersError)
            return NextResponse.json({ error: 'Failed to fetch carrier pool', details: carriersError.message }, { status: 500 })
        }

        const notifyList = carriers || []
        console.log(`Found ${notifyList.length} potential carriers in profiles.`)

        let notificationStatus = 'none'
        let notificationErrorDetails = null
        let validCarrierCount = 0

        if (notifyList.length > 0) {
            // Directly use the carriers from the profile pool
            // Since profiles are created on login, we trust these IDs
            const finalCarriersToNotify = notifyList;
            validCarrierCount = finalCarriersToNotify.length

            console.log(`Broadcasting to ${validCarrierCount} carriers from profile pool.`)

            // 3. Create notifications for identified carriers
            if (finalCarriersToNotify.length > 0) {
                const notifications = finalCarriersToNotify.map(carrier => ({
                    carrier_id: carrier.carrier_id,
                    shipment_id: shipment.id,
                    message: `NEW SHIPMENT: ${sourceCity} to ${destination.split(',')[0].trim()}. Budget: $${minBudget}-$${maxBudget}`,
                    status: 'unread',
                    created_at: new Date().toISOString()
                }))

                const { error: notificationError } = await supabase
                    .from('carrier_notifications')
                    .insert(notifications)

                if (notificationError) {
                    console.error('Notification insertion error:', notificationError)
                    notificationStatus = 'error'
                    notificationErrorDetails = notificationError.message
                } else {
                    notificationStatus = 'success'

                    // 4. Notify the Shipper that carriers have been alerted
                    await supabase
                        .from('shipper_notifications')
                        .insert({
                            shipper_id: shipperId,
                            shipment_id: shipment.id,
                            message: `Broadcast Success: ${finalCarriersToNotify.length} carriers notified for shipment from ${sourceCity}.`,
                            type: 'carrier_found'
                        })
                }
            } else {
                notificationStatus = 'no_carriers_in_pool'
                console.log('No carriers found in profiles to notify.')
            }
        }

        return NextResponse.json({
            success: true,
            shipment,
            notificationStatus,
            notificationError: notificationErrorDetails,
            notifiedCarriersCount: notifyList.length
        })

    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        )
    }
}

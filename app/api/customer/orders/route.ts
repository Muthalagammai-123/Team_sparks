import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const body = await request.json()

        const {
            customerId,
            customerName,
            address,
            items,
            total,
            priority
        } = body

        // Validate essentials
        if (!customerId || !address || !items || items.length === 0) {
            return NextResponse.json({ error: 'Missing order details' }, { status: 400 })
        }

        // 1. Create a "Shipment Request" representing this order
        // In a real system, we'd have an 'orders' table. Here we map directly to logistics.

        const sourceLocation = "NovaMart Central Warehouse, Bangalore" // Fixed warehouse

        // Calculate urgency based on priority selection
        const now = new Date()
        let deadline = new Date()
        if (priority === 'express') deadline.setDate(now.getDate() + 2)
        else deadline.setDate(now.getDate() + 5)

        const specialConditions = items.map((i: any) => i.name) // List items as conditions for now

        const { data: shipment, error: shipmentError } = await supabase
            .from('shipment_requests')
            .insert({
                shipper_id: customerId, // Mapping Customer as Payload Source
                source_location: sourceLocation,
                destination_location: address,
                min_budget: total * 0.1, // Est shipping cost 10% of value
                max_budget: total * 0.2,
                deadline: deadline.toISOString().split('T')[0],
                priority_level: priority === 'express' ? 'Urgent' : 'Normal',
                special_conditions: specialConditions,
                special_terms: `B2C Order #${Date.now().toString().slice(-6)} - Customer: ${customerName}`,
                status: 'pending',
                sla_rules: {
                    delayPenalty: priority === 'express' ? 20 : 5,
                    maxDelayTolerance: priority === 'express' ? 24 : 72
                }
            })
            .select()
            .single()

        if (shipmentError) {
            console.error('Order shipment error:', shipmentError)
            return NextResponse.json({ error: 'Failed to process order logistics' }, { status: 500 })
        }

        // 2. Trigger Carrier Broadcast (Reuse logic or call internal endpoint? We'll replicate simplified logic here)
        // Ideally we call the broadcast function or Trigger. Let's assume database trigger or simple broadcast.
        // For this demo, let's just return success and let the manual matching happen or rely on the previous logic.
        // To make it "seamless", we should ideally notify carriers. 
        // We'll trust the Shipper Dashboard to pick this up as it appears in the system.

        return NextResponse.json({
            success: true,
            orderId: shipment.id,
            message: 'Order placed and logistics requested.'
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

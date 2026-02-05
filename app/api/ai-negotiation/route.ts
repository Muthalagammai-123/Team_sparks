import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const groqApiKey = process.env.GROQ_API_KEY || process.env.XAI_API_KEY;

export async function POST(request: NextRequest) {
    if (!groqApiKey) {
        console.error('AI API Key is missing (GROQ_API_KEY or XAI_API_KEY)');
        return NextResponse.json(
            { error: 'AI processing is currently unavailable', details: 'Server configuration error' },
            { status: 503 }
        );
    }
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const body = await request.json()

        const { shipmentRequest, carrierResponse, carrierId } = body

        // --- ENFORCING DATA INTEGRITY: FETCH DIRECTLY FROM DATABASE ---
        // Fetch fresh shipment request from DB
        const { data: shipmentDb, error: shipmentError } = await supabase
            .from('shipment_requests')
            .select('*')
            .eq('id', shipmentRequest.id)
            .single()

        if (shipmentError || !shipmentDb) {
            throw new Error(`Shipment request not found in database: ${shipmentError?.message}`)
        }

        // Fetch fresh carrier response from DB
        const { data: responseDb, error: responseError } = await supabase
            .from('carrier_responses')
            .select('*')
            .eq('shipment_id', shipmentRequest.id)
            .eq('carrier_id', carrierId)
            .single()

        if (responseError || !responseDb) {
            // Fallback: If not found, use the passed data, but warn
            console.warn('Carrier response not found in DB, using passed body data')
        }

        const finalCarrierData = responseDb || carrierResponse
        const parsedNotes = typeof finalCarrierData.notes === 'string'
            ? JSON.parse(finalCarrierData.notes)
            : finalCarrierData.notes

        // Prepare data for AI analysis using VERIFIED DATABASE RECORDS
        const negotiationContext = {
            shipper_requirements: {
                id: shipmentDb.id,
                source: shipmentDb.source_location,
                destination: shipmentDb.destination_location,
                budget_range: {
                    min: shipmentDb.min_budget,
                    max: shipmentDb.max_budget
                },
                deadline: shipmentDb.deadline,
                priority: shipmentDb.priority_level,
                special_conditions: shipmentDb.special_conditions,
                sla_rules: shipmentDb.sla_rules
            },
            carrier_offer: {
                proposed_price: finalCarrierData.proposed_price,
                estimated_delivery_date: finalCarrierData.estimated_delivery_date,
                notes: parsedNotes,
                // Merging profile info if available in responseDb or carrierResponse
                capacity: parsedNotes?.available_capacity,
                vehicle_type: parsedNotes?.vehicle_type,
                insurance: parsedNotes?.insurance_coverage,
                tracking: parsedNotes?.tracking_available,
                available_routes: parsedNotes?.available_routes,
                risk_factors: parsedNotes?.risk_factors,
                cost_structure: parsedNotes?.cost_structure
            }
        }

        // Call Groq AI for negotiation
        const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [

                    {
                        content: `You are a LEGAL AGREEMENT RENDERING ENGINE.

You are NOT a content generator.
You are NOT allowed to rewrite, rephrase, summarize, or restructure any part of the agreement.

You will be provided with:
1. A FIXED agreement template (legally frozen text)
2. Shipment Request details
3. Carrier Response details
4. Negotiated operational values (timeline, cost, penalties)

YOUR ONLY TASK:
Populate the agreement template by REPLACING VALUES using the shipment request and carrier response data.

ABSOLUTE RULES (STRICT ENFORCEMENT):
1. DO NOT modify clause text, headings, numbering, spacing, punctuation, or formatting.
2. DO NOT add, remove, reorder, or merge clauses.
3. DO NOT rewrite legal language or AI-explainability text.
4. DO NOT infer or invent any value.
5. ONLY replace values where a logical factual field already exists in the template.
6. If a value is missing or does not map exactly, leave the template content unchanged.
7. Treat the agreement template as immutable legal text.

FIELDS ALLOWED TO BE MODIFIED ONLY:

--- AGREEMENT METADATA ---
• Agreement Date
• Agreement ID (if present)

--- SHIPPER DETAILS (from Shipment Request only) ---
• Legal Name
• Registered Address
• Authorized Representative
• Phone
• Email
• GST / Registration Number

--- CARRIER DETAILS (from Carrier Response only) ---
• Legal Name
• Registered Address
• Authorized Representative
• Phone
• Email
• Vehicle Number
• Transport License Number
• GST / Registration Number

--- SHIPMENT-DEPENDENT VALUES ---
• Delivery Timeline values
• Peak-season timeline values
• Freight Charge values
• Penalty percentage and cap values
• Payment cycle values

SOURCE-OF-TRUTH RULES:
• Shipper fields MUST come only from the shipment request.
• Carrier fields MUST come only from the carrier response.
• Timeline, pricing, and penalties MUST come only from negotiated data.
• Never reuse values from a previous agreement.

OUTPUT REQUIREMENTS:
• Output ONLY the fully populated agreement text.
• Do NOT include explanations, comments, markdown, or system notes.
• Do NOT reference shipment request or carrier response in the output.
• The final agreement must be structurally IDENTICAL to the template except for replaced values.

FAIL-SAFE BEHAVIOR:
If a value cannot be mapped with certainty:
→ Ignore the value
→ Do not modify the template
→ Do not compensate or infer

This system renders legally deterministic, shipment-specific agreements.

Your response must be a valid JSON object with this exact structure:
{
  "product_info": { "id": string, "name": string, "category": string },
  "agreement_text": string, // MUST be the EXACT filled version of the 'AGREEMENT TEMPLATE' below. No deviations.
  "final_price": number,
  "final_deadline": "YYYY-MM-DD",
  "penalty_terms": { "penalty_per_day": number, "max_delay_tolerance_hours": number },
  "simple_clauses": string[],
  "recommendation": "accept" | "counter" | "reject",
  "scores": { "confidence": number, "fairness": number, "trust": number },
  "explanations": {
    "weather_traffic": { "status": string, "details": string[], "impact": string },
    "schedule_efficiency": { "peak_hours_impact": string, "holiday_impact": string },
    "cost_transparency": { "profit_limit_check": string, "extra_charges_check": string, "customer_protection": string },
    "risk_assessment": { "risk_level": "Low" | "Medium" | "High", "mitigation": string },
    "operational_check": { "feasibility": "Verified" | "Conditional", "vehicle_match": string }
  },
  "reasoning": "A brief summary of why this agreement is optimal."
}

=== AGREEMENT TEMPLATE (STRICTLY USE THIS FOR 'agreement_text') ===
# AI-GENERATED SHIPPER – CARRIER TRANSPORTATION AGREEMENT

This Transportation Agreement ("Agreement") is entered into on {{DATE}}, by and between the following parties:

**SHIPPER DETAILS**
Legal Name: {{SHIPPER_LEGAL_NAME}}
Registered Address: {{SHIPPER_ADDRESS}}
Authorized Representative: {{SHIPPER_REP_NAME}}
Phone: {{SHIPPER_PHONE}}
Email: {{SHIPPER_EMAIL}}
GST / Registration No.: {{SHIPPER_GST}}

**CARRIER DETAILS**
Legal Name: {{CARRIER_LEGAL_NAME}}
Registered Address: {{CARRIER_ADDRESS}}
Authorized Representative: {{CARRIER_REP_NAME}}
Phone: {{CARRIER_PHONE}}
Email: {{CARRIER_EMAIL}}
Vehicle No.: {{VEHICLE_NO}}
Transport License No.: {{LICENSE_NO}}
GST / Registration No.: {{CARRIER_GST}}

**1. Scope of Agreement**
The Carrier agrees to transport goods on behalf of the Shipper in a safe, secure, and timely manner. This Agreement is dynamically generated based on business intent, delivery priorities, and negotiated risk factors.

**2. Delivery Timeline & Commitments**
Standard delivery timeline: {{STANDARD_TIMELINE}} hours from pickup. Peak-season delivery timeline: {{PEAK_TIMELINE}} hours. AI-adjusted buffer applied during holidays and high-risk periods. Delivery commitments for destination {{DESTINATION_LOCATION}} are negotiated and optimized based on real-world conditions.

**3. Delay Definition & Handling**
A delay is defined as delivery beyond the agreed timeline excluding government-declared holidays, natural calamities, traffic, weather, or regulatory disruptions. AI-evaluated delay probability is factored before applying penalties.

**4. Freight Charges & Payment Terms**
Base Freight Charge: INR {{BASE_FREIGHT_CHARGE}} per shipment. Peak-Season Adjustment: {{PEAK_ADJUSTMENT}}% when applicable. Payment Cycle: Net {{PAYMENT_CYCLE}} days from delivery confirmation. Mode: Bank transfer or digital payment. Pricing is dynamically negotiated and risk-adjusted.

**5. Penalties & Risk Pricing**
Delay penalty: {{PENALTY_PERCENT}}% per delayed day, capped at {{PENALTY_CAP}}%. Penalties are waived for approved exceptions. Clause-level risk pricing ensures fairness to both parties.

**6. Damage, Loss & Claims**
Carrier is responsible for goods during transit. Any loss or damage must be reported within 24 hours. Claims are resolved through AI-assisted assessment and mutual discussion.

**7. Holidays, Peak Seasons & Exceptions**
The system automatically accounts for national and regional holidays, festival seasons, and high-demand periods. Adjusted timelines and penalties are transparently reflected.

**9. Force Majeure**
Neither party shall be held liable for delays caused by events beyond reasonable control, including natural disasters, strikes, or government actions.

**10. Termination**
Either party may terminate this Agreement with 15 days written notice, ensuring minimal operational disruption.

**11. Governing Law**
This Agreement shall be governed and interpreted in accordance with the laws of India.

**AI-EXPLAINABILITY NOTE**
Each clause in this Agreement is generated and justified by an AI system that balances delivery speed, cost efficiency, and operational risk to ensure fairness and transparency.

**VERIFICATION & EXECUTION**

| | SHIPPER | CARRIER |
| :--- | :--- | :--- |
| **Signature:** | ____________________ | ____________________ |
| **Name:** | {{SHIPPER_REP_NAME}} | {{CARRIER_REP_NAME}} |
| **Designation:** | Authorized Signatory | Authorized Signatory |
| **Date:** | {{DATE}} | {{DATE}} |
| | **OFFICIAL AI VERIFIED** | **OFFICIAL AI VERIFIED** |

Digitally Verified & AI-Authenticated Agreement
----------------------------------------------------------------
`
                    },
                    {
                        role: 'user',
                        content: `Analyze this shipment negotiation:
 
 SHIPPER REQUIREMENTS:
 - Route: ${negotiationContext.shipper_requirements.source} to ${negotiationContext.shipper_requirements.destination}
 - Budget: $${negotiationContext.shipper_requirements.budget_range.min} - $${negotiationContext.shipper_requirements.budget_range.max}
 - Deadline: ${negotiationContext.shipper_requirements.deadline}
 - Priority: ${negotiationContext.shipper_requirements.priority}
 - Special Conditions: ${negotiationContext.shipper_requirements.special_conditions?.join(', ')}
 
 CARRIER OFFER:
 - Proposed Price: $${negotiationContext.carrier_offer.proposed_price}
 - Estimated Delivery: ${negotiationContext.carrier_offer.estimated_delivery_date}
 - Cost Structure: Base $${negotiationContext.carrier_offer.cost_structure?.base_rate}, $${negotiationContext.carrier_offer.cost_structure?.per_mile}/mile
 - Risk Factors: Weather: ${negotiationContext.carrier_offer.risk_factors?.weather}, Traffic: ${negotiationContext.carrier_offer.risk_factors?.traffic}
 - Available Routes: ${negotiationContext.carrier_offer.available_routes?.join(', ')}
 
 Generate a fair, explainable agreement. BE SPECIFIC about Weather and Traffic (OSM) impact. GENERATE THE FULL 'agreement_text' MARKDOWN.`
                    }
                ],
                temperature: 0.7,
                max_tokens: 1500,
                response_format: { type: 'json_object' }
            })
        })

        if (!aiResponse.ok) {
            const errorText = await aiResponse.text()
            console.error('Groq API error:', errorText)
            return NextResponse.json(
                { error: 'AI service failed', details: errorText },
                { status: aiResponse.status }
            )
        }

        const aiResult = await aiResponse.json()
        const rawContent = aiResult.choices[0]?.message?.content
        console.log('Raw AI Response:', rawContent)

        if (!rawContent) {
            throw new Error('AI returned an empty response')
        }

        let negotiationResult;
        try {
            negotiationResult = JSON.parse(rawContent)
        } catch (parseError) {
            console.error('Failed to parse AI JSON:', rawContent)
            // Fallback: Try a simpler regex pick or throw
            throw new Error('AI failed to return valid JSON data')
        }

        // Validate recommendation for DB check constraint
        const recommendation = (negotiationResult.recommendation || 'counter').toLowerCase()
        const validRecommendations = ['accept', 'counter', 'reject']
        const finalRecommendation = validRecommendations.includes(recommendation) ? recommendation : 'counter'

        // Store negotiation result
        const { data: negotiation, error: negotiationError } = await supabase
            .from('ai_negotiations')
            .insert({
                shipment_id: shipmentRequest.id,
                carrier_id: carrierId,
                shipper_requirements: negotiationContext.shipper_requirements,
                carrier_offer: negotiationContext.carrier_offer,
                ai_recommendation: finalRecommendation,
                final_price: negotiationResult.final_price,
                final_deadline: negotiationResult.final_deadline,
                penalty_terms: negotiationResult.penalty_terms,
                reasoning: negotiationResult.reasoning,
                status: 'pending_approval'
            })
            .select()
            .single()

        if (negotiationError) {
            console.error('Negotiation storage error:', negotiationError)
            return NextResponse.json(
                { error: 'Database storage error', details: negotiationError.message },
                { status: 500 }
            )
        }

        // Update carrier response with AI result
        const { error: updateError } = await supabase
            .from('carrier_responses')
            .update({
                status: 'pending', // Must be one of: pending, accepted, rejected, completed
                notes: JSON.stringify({
                    original_notes: carrierResponse.notes,
                    ai_result: negotiationResult
                })
            })
            .eq('carrier_id', carrierId)
            .eq('shipment_id', shipmentRequest.id)

        if (updateError) {
            console.warn('Carrier response update warning:', updateError.message)
            // We don't necessarily want to fail the whole API if just the update fails,
            // but it's good to know.
        }

        return NextResponse.json({
            success: true,
            negotiation: negotiationResult,
            negotiation_id: negotiation.id
        })

    } catch (error: any) {
        console.error('AI Negotiation Catch-All Error:', error)
        return NextResponse.json(
            { error: 'Failed to process AI negotiation', details: error.message },
            { status: 500 }
        )
    }
}

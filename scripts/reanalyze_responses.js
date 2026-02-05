const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const groqApiKey = process.env.GROQ_API_KEY || process.env.XAI_API_KEY

if (!supabaseUrl || !supabaseServiceKey || !groqApiKey) {
    console.error('Missing required environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function reanalyzeExistingResponses() {
    console.log('Starting re-analysis of existing carrier responses...')

    try {
        // Get all carrier responses that don't have AI negotiations
        const { data: responses, error } = await supabase
            .from('carrier_responses')
            .select(`
                *,
                shipment_requests (
                    id,
                    source_location,
                    destination_location,
                    min_budget,
                    max_budget,
                    deadline,
                    priority_level,
                    special_conditions,
                    sla_rules
                )
            `)
            .not('shipment_id', 'is', null)

        if (error) {
            console.error('Error fetching responses:', error)
            return
        }

        console.log(`Found ${responses.length} pending carrier responses to analyze`)

        for (const response of responses) {
            try {
                // Check if AI negotiation already exists
                const { data: existingNegotiation } = await supabase
                    .from('ai_negotiations')
                    .select('id')
                    .eq('shipment_id', response.shipment_id)
                    .eq('carrier_id', response.carrier_id)
                    .single()

                if (existingNegotiation) {
                    console.log(`Skipping ${response.id} - already has AI analysis`)
                    continue
                }

                console.log(`Processing response ${response.id} for shipment ${response.shipment_id}`)

                // Prepare data for AI analysis
                const negotiationContext = {
                    shipper_requirements: {
                        source: response.shipment_requests.source_location,
                        destination: response.shipment_requests.destination_location,
                        budget_range: {
                            min: response.shipment_requests.min_budget,
                            max: response.shipment_requests.max_budget
                        },
                        deadline: response.shipment_requests.deadline,
                        priority: response.shipment_requests.priority_level,
                        special_conditions: response.shipment_requests.special_conditions,
                        sla_rules: response.shipment_requests.sla_rules
                    },
                    carrier_offer: {
                        proposed_price: response.proposed_price,
                        estimated_delivery_days: Math.ceil((new Date(response.estimated_delivery_date) - new Date()) / (1000 * 60 * 60 * 24)),
                        capacity: JSON.parse(response.notes || '{}').available_capacity || 50,
                        vehicle_type: JSON.parse(response.notes || '{}').vehicle_type || 'truck',
                        insurance: JSON.parse(response.notes || '{}').insurance_coverage || true,
                        tracking: JSON.parse(response.notes || '{}').tracking_available || true,
                        available_routes: JSON.parse(response.notes || '{}').available_routes || [],
                        risk_factors: JSON.parse(response.notes || '{}').risk_factors || { weather: 'low', traffic: 'medium', region: 'low' },
                        cost_structure: JSON.parse(response.notes || '{}').cost_structure || {
                            base_rate: 500,
                            per_mile: 2.5,
                            fuel_surcharge: 10
                        }
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
                                role: 'system',
                                content: `You are an advanced AI Negotiation Engine for fair logistics agreements. Your goal is to build TRUST through DEEP TRANSPARENCY.

You must analyze the shipment request and carrier offer to generate a "Final Fair Agreement".
You must explain your decision-making process using the following 14-Factor Explainability Framework:

1. **Weather Conditions Impact**: Analyze rain, storms, fog, etc.
2. **Public Peak Hour Congestion**: Analyze city-level rush hours.
3. **Public Holidays & Festival Traffic**: Check for regional holidays.
4. **Real-Time Traffic Tracking (OSM)**: Simulate checking OpenStreetMap for route efficiency.
5. **Route Selection**: Explain why this path was chosen (e.g., bypassing congestion).
6. **Delivery Time Risk Assessment**: Calculate probability of delay.
7. **Carrier Availability Constraints**: Consider workforce/vehicle limits.
8. **Carrier Profit Margin Limits**: Ensure carrier makes profit but strictly LIMIT excessive scaling.
9. **Fair Pricing & Cost Transparency**: Break down cost logic.
10. **No Unjustified Extra Charges**: Explicitly reject hidden fees.
11. **Penalty Adjustment Based on Risk**: Waive penalties for factors like Weather.
12. **Customer Cost Protection**: Prevent overcharging the shipper.
13. **Operational Feasibility Check**: Verify vehicle type and load capacity match.
14. **Final Fairness & Trust Score**: A composite score of the agreement's balance.

IF PRODUCT DETAILS ARE MISSING in the input, SIMULATE realistic product details (e.g., "Industrial Electronics", "Perishable Pharma") based on context to make the agreement concrete.

Your response must be a valid JSON object with this exact structure:
{
  "product_info": {
    "id": string,
    "name": string,
    "category": string
  },
  "agreement_text": string,
  "final_price": number,
  "final_deadline": "YYYY-MM-DD",
  "penalty_terms": {
    "penalty_per_day": number,
    "max_delay_tolerance_hours": number
  },
  "simple_clauses": string[],
  "recommendation": "accept" | "counter" | "reject",
  "scores": {
    "confidence": number,
    "fairness": number,
    "trust": number
  },
  "explanations": {
    "weather_traffic": {
        "status": string,
        "details": string[],
        "impact": string
    },
    "schedule_efficiency": {
        "peak_hours_impact": string,
        "holiday_impact": string
    },
    "cost_transparency": {
        "profit_limit_check": string,
        "extra_charges_check": string,
        "customer_protection": string
    },
    "risk_assessment": {
        "risk_level": "Low" | "Medium" | "High",
        "mitigation": string
    },
    "operational_check": {
        "feasibility": "Verified" | "Conditional",
        "vehicle_match": string
    }
  },
  "reasoning": "A brief summary of why this agreement is optimal."
}`
                            },
                            {
                                role: 'user',
                                content: `Analyze this shipment negotiation:

 SHIPPER REQUIREMENTS:
 - Route: ${negotiationContext.shipper_requirements.source} to ${negotiationContext.shipper_requirements.destination}
 - Budget: $${negotiationContext.shipper_requirements.budget_range.min} - $${negotiationContext.shipper_requirements.max_budget}
 - Deadline: ${negotiationContext.shipper_requirements.deadline}
 - Priority: ${negotiationContext.shipper_requirements.priority}
 - Special Conditions: ${negotiationContext.shipper_requirements.special_conditions?.join(', ')}

 CARRIER OFFER:
 - Proposed Price: $${negotiationContext.carrier_offer.proposed_price}
 - Estimated Delivery: ${negotiationContext.carrier_offer.estimated_delivery_days} days
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
                    console.error(`AI API error for response ${response.id}:`, await aiResponse.text())
                    continue
                }

                const aiResult = await aiResponse.json()
                const rawContent = aiResult.choices[0]?.message?.content

                if (!rawContent) {
                    console.error(`Empty AI response for ${response.id}`)
                    continue
                }

                let negotiationResult
                try {
                    negotiationResult = JSON.parse(rawContent)
                } catch (parseError) {
                    console.error(`JSON parse error for ${response.id}:`, rawContent)
                    continue
                }

                // Validate recommendation
                const recommendation = (negotiationResult.recommendation || 'counter').toLowerCase()
                const validRecommendations = ['accept', 'counter', 'reject']
                const finalRecommendation = validRecommendations.includes(recommendation) ? recommendation : 'counter'

                // Store negotiation result
                const { data: negotiation, error: negotiationError } = await supabase
                    .from('ai_negotiations')
                    .insert({
                        shipment_id: response.shipment_id,
                        carrier_id: response.carrier_id,
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
                    console.error(`Storage error for ${response.id}:`, negotiationError)
                    continue
                }

                // Update carrier response status
                await supabase
                    .from('carrier_responses')
                    .update({
                        status: 'ai_processed',
                        notes: JSON.stringify({
                            original_notes: response.notes,
                            ai_result: negotiationResult
                        })
                    })
                    .eq('id', response.id)

                console.log(`Successfully processed response ${response.id}`)

                // Rate limiting - wait 1 second between requests
                await new Promise(resolve => setTimeout(resolve, 1000))

            } catch (err) {
                console.error(`Error processing response ${response.id}:`, err.message)
            }
        }

        console.log('Re-analysis complete!')

    } catch (error) {
        console.error('Script error:', error)
    }
}

reanalyzeExistingResponses()
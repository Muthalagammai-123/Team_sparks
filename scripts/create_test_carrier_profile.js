const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestCarrierProfile() {
    const carrierId = 'fb1229db-3774-4619-89c8-7779138f3932';

    // Check if profile already exists
    const { data: existing } = await supabase
        .from('carrier_profiles')
        .select('*')
        .eq('carrier_id', carrierId)
        .single();

    if (existing) {
        console.log('Carrier profile already exists. Updating...');

        const { data, error } = await supabase
            .from('carrier_profiles')
            .update({
                base_location: 'Chennai, Tamil Nadu',
                latitude: 13.0827,
                longitude: 80.2707,
                available_capacity: 25.5,
                capacity_unit: 'tons',
                available_routes: ['Chennai-Bangalore', 'Chennai-Mumbai', 'Chennai-Hyderabad'],
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
                    base_rate: 650,
                    per_mile: 3.2,
                    fuel_surcharge: '12%'
                },
                reliability_score: 4.75,
                total_deliveries: 342,
                on_time_deliveries: 325,
                updated_at: new Date().toISOString()
            })
            .eq('carrier_id', carrierId)
            .select();

        if (error) {
            console.error('Error updating carrier profile:', error);
            return;
        }

        console.log('Carrier profile updated successfully:', data);
    } else {
        console.log('Creating new carrier profile...');

        const { data, error } = await supabase
            .from('carrier_profiles')
            .insert({
                carrier_id: carrierId,
                base_location: 'Chennai, Tamil Nadu',
                latitude: 13.0827,
                longitude: 80.2707,
                available_capacity: 25.5,
                capacity_unit: 'tons',
                available_routes: ['Chennai-Bangalore', 'Chennai-Mumbai', 'Chennai-Hyderabad'],
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
                    base_rate: 650,
                    per_mile: 3.2,
                    fuel_surcharge: '12%'
                },
                reliability_score: 4.75,
                total_deliveries: 342,
                on_time_deliveries: 325
            })
            .select();

        if (error) {
            console.error('Error creating carrier profile:', error);
            return;
        }

        console.log('Carrier profile created successfully:', data);
    }

    console.log('\n✅ Test carrier profile is ready!');
    console.log('\nTo test dynamic agreement generation:');
    console.log('1. Go to /negotiation');
    console.log('2. Fill in shipper terms');
    console.log('3. In carrier constraints, add:');
    console.log('   {');
    console.log(`     "carrier_id": "${carrierId}",`);
    console.log('     "business_details": {');
    console.log('       "company_name": "Chennai Express Logistics",');
    console.log('       "vehicle_type": "Refrigerated Truck",');
    console.log('       "insurance_coverage": "$2,000,000",');
    console.log('       "certifications": ["ISO 9001", "DOT Certified", "HACCP"]');
    console.log('     }');
    console.log('   }');
    console.log('4. Click "Negotiate" to see the dynamic agreement');
    console.log('5. Download the PDF with dynamic filename');
}

createTestCarrierProfile();

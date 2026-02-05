const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestShipment() {
    const carrierId = 'fb1229db-3774-4619-89c8-7779138f3932';

    // Create a test shipment request
    const { data: shipment, error: shipmentError } = await supabase
        .from('shipment_requests')
        .insert({
            shipper_id: carrierId, // Using carrier ID as shipper for testing
            source_location: 'Guindy, Chennai',
            destination_location: 'Marina Beach, Chennai',
            min_budget: 500,
            max_budget: 1000,
            deadline: '2026-02-10',
            priority_level: 'Normal',
            status: 'in_progress'
        })
        .select()
        .single();

    if (shipmentError) {
        console.error('Error creating shipment:', shipmentError);
        return;
    }

    console.log('Test shipment created:', shipment);
    console.log('\nTo view tracking with route:');
    console.log(`http://localhost:3000/track?carrier=${carrierId}&shipment=${shipment.id}`);
}

createTestShipment();

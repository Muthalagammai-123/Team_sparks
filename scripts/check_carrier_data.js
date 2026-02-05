const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCarrier() {
    const carrierId = 'fb1229db-3774-4619-89c8-7779138f3932';
    console.log('Checking carrier:', carrierId);

    const { data, error } = await supabase
        .from('carrier_live_location')
        .select('*')
        .eq('carrier_id', carrierId);

    if (error) {
        console.error('Fetch error:', error);
    } else {
        console.log('Carrier data:', JSON.stringify(data, null, 2));
    }
}

checkCarrier();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function enableRealtime() {
    console.log('Enabling Realtime for carrier_live_location...');

    // We can't run arbitrary SQL via the client easily unless we use a function or the REST API for publications
    // But we can check if the table is in the publication
    const { data, error } = await supabase.rpc('enable_realtime_for_table', { table_name: 'carrier_live_location' });

    if (error) {
        console.log('RPC failed (expected if not exists), trying direct SQL-like approach...');
        // Fallback: Just try to upsert something and see if it works
        const { error: upsertError } = await supabase.from('carrier_live_location').upsert({
            carrier_id: 'test-realtime',
            latitude: 0,
            longitude: 0,
            updated_at: new Date().toISOString()
        });
        if (upsertError) console.error('Upsert failed:', upsertError);
        else console.log('Test upsert successful. Please check if Realtime is enabled in Supabase Dashboard -> Database -> Publications.');
    } else {
        console.log('Realtime enabled successfully!');
    }
}

enableRealtime();

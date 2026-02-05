const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('carrier_live_location').select('*').limit(1);
    if (error) {
        console.error('Table check failed:', error);
    } else {
        console.log('Table exists, data:', data);
    }
}
check();

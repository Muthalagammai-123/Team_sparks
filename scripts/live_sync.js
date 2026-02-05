const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const carrierId = process.argv[2] || 'fb1229db-3774-4619-89c8-7779138f3932';

// Route simulation data
const route = [
    [80.2707, 13.0827],
    [80.2717, 13.0837],
    [80.2727, 13.0847],
    [80.2737, 13.0857],
    [80.2747, 13.0867],
    [80.2757, 13.0877],
    [80.2767, 13.0887],
    [80.2777, 13.0897],
    [80.2787, 13.0907],
    [80.2797, 13.0917]
];

async function updateLocation(step) {
    const coords = route[step % route.length];
    const speed = 45 + Math.random() * 10;
    const heading = (step * 36) % 360;

    console.log(`[${new Date().toLocaleTimeString()}] Updating carrier ${carrierId} -> Lat: ${coords[1]}, Lng: ${coords[0]}, Speed: ${speed.toFixed(1)}`);

    const { error } = await supabase
        .from('carrier_live_location')
        .upsert({
            carrier_id: carrierId,
            latitude: coords[1],
            longitude: coords[0],
            speed: speed,
            heading: heading,
            updated_at: new Date().toISOString()
        });

    if (error) {
        console.error('Error updating location:', error);
    }
}

let step = 0;
console.log('Starting Live Supabase Sync for Carrier:', carrierId);
setInterval(() => {
    updateLocation(step++);
}, 3000);

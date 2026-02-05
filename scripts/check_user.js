const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.resolve(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value.length > 0) env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function fixHistory() {
    let output = "";
    const log = (msg) => {
        console.log(msg);
        output += msg + "\n";
    };

    const targetId = 'fb1229db-3774-4619-89c8-7779138f3932';

    // Recent shipments
    const { data: shipments } = await supabase.from('shipment_requests').select('id, source_location, destination_location').limit(5);

    log(`Retrospectively notifying user ${targetId} about existing shipments...`);

    const newNotifs = shipments.map(s => ({
        carrier_id: targetId,
        shipment_id: s.id,
        message: `HISTORICAL: SHIPMENT DETECTED from ${s.source_location} to ${s.destination_location}. System restored.`,
        status: 'unread'
    }));

    const { error } = await supabase.from('carrier_notifications').insert(newNotifs);

    if (error) {
        log(`History FIX FAILED: ${error.message}`);
    } else {
        log(`History FIX SUCCESS! ${newNotifs.length} historical notifications added.`);
    }

    fs.writeFileSync('check_results.txt', output, 'utf8');
}

fixHistory();

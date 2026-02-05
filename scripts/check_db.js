console.log('Script started');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manual dotenv parsing
const envPath = path.resolve(__dirname, '../.env.local');
console.log('Looking for .env.local at:', envPath);
if (fs.existsSync(envPath)) {
    console.log('.env.local found');
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value.length > 0) {
            process.env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
        }
    });
} else {
    console.log('.env.local NOT found');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl ? 'Defined' : 'UNDEFINED');
console.log('Service Key:', supabaseServiceKey ? 'Defined' : 'UNDEFINED');

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkData() {
    console.log("--- Checking Database Status ---");
    try {
        const { count: carrierCount, error: cErr } = await supabase.from('carrier_profiles').select('*', { count: 'exact', head: true });
        if (cErr) console.error('Carrier fetch error:', cErr);
        console.log(`Total Carriers in Profiles: ${carrierCount}`);

        const { count: shipmentCount, error: sErr } = await supabase.from('shipment_requests').select('*', { count: 'exact', head: true });
        if (sErr) console.error('Shipment fetch error:', sErr);
        console.log(`Total Shipment Requests: ${shipmentCount}`);

        const { count: notificationCount, error: nErr } = await supabase.from('carrier_notifications').select('*', { count: 'exact', head: true });
        if (nErr) console.error('Notification fetch error:', nErr);
        console.log(`Total Carrier Notifications: ${notificationCount}`);

        const { data: recentNotifications } = await supabase
            .from('carrier_notifications')
            .select('carrier_id, status, message, created_at')
            .order('created_at', { ascending: false })
            .limit(10);

        if (recentNotifications && recentNotifications.length > 0) {
            console.log("\n--- Recent Notification Log ---");
            recentNotifications.forEach((n, i) => {
                console.log(`${i + 1}. To Carrier: ${n.carrier_id} | Status: ${n.status} | Created: ${n.created_at}`);
            });
        } else {
            console.log("\nNo notifications found in table.");
        }
    } catch (e) {
        console.error('Execution error:', e);
    }
}

checkData();

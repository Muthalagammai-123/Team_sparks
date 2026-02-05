const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const logFile = path.resolve(__dirname, 'data_check.log');
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
};

// Clear previous log
fs.writeFileSync(logFile, '');
log('Script started - Data Check');

// Manual dotenv parsing
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value.length > 0) {
            process.env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkData() {
    log("\n--- All Carrier Responses with Shipment Data ---\n");

    try {
        const { data: responses, error: rErr } = await supabase
            .from('carrier_responses')
            .select(`
                id,
                shipment_id,
                proposed_price,
                created_at,
                status,
                shipment_request:shipment_requests (
                    id,
                    source_location,
                    destination_location
                )
            `)
            .order('created_at', { ascending: false });

        if (rErr) {
            log('Error fetching responses: ' + JSON.stringify(rErr));
            return;
        }

        log(`Total: ${responses.length} responses\n`);

        responses.forEach((r, i) => {
            log(`--- Response ${i + 1} ---`);
            log(`  ID: ${r.id}`);
            log(`  Shipment ID: ${r.shipment_id}`);
            log(`  Price: $${r.proposed_price}`);
            log(`  Status: ${r.status}`);
            log(`  Created: ${r.created_at}`);
            log(`  Source: ${r.shipment_request?.source_location || 'NULL/MISSING'}`);
            log(`  Destination: ${r.shipment_request?.destination_location || 'NULL/MISSING'}`);
            log('');
        });

    } catch (e) {
        log('Execution error: ' + e.message);
    }
}

checkData().then(() => {
    log('Done');
    process.exit(0);
});

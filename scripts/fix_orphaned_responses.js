const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const logFile = path.resolve(__dirname, 'fix_output.log');
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
};

// Clear previous log
fs.writeFileSync(logFile, '');
log('Script started - Fix Orphaned Carrier Responses');

// Manual dotenv parsing
const envPath = path.resolve(__dirname, '../.env.local');
log('Looking for .env.local at: ' + envPath);
if (fs.existsSync(envPath)) {
    log('.env.local found');
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value.length > 0) {
            process.env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
        }
    });
} else {
    log('.env.local NOT found');
    process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

log('Supabase URL: ' + (supabaseUrl ? 'Defined' : 'UNDEFINED'));
log('Service Key: ' + (supabaseServiceKey ? 'Defined' : 'UNDEFINED'));

if (!supabaseUrl || !supabaseServiceKey) {
    log('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixOrphanedResponses() {
    log("\n--- Checking for Orphaned Carrier Responses ---\n");

    try {
        // 1. Get all carrier responses with their shipment_request join
        const { data: responses, error: rErr } = await supabase
            .from('carrier_responses')
            .select(`
                id,
                shipment_id,
                proposed_price,
                created_at,
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

        log(`Total Carrier Responses: ${responses.length}\n`);

        // 2. Find orphaned responses (no shipment_request data)
        const orphanedResponses = responses.filter(r => !r.shipment_request || !r.shipment_request.source_location);
        const validResponses = responses.filter(r => r.shipment_request && r.shipment_request.source_location);

        log(`Valid Responses (with shipment data): ${validResponses.length}`);
        log(`Orphaned Responses (missing shipment data): ${orphanedResponses.length}\n`);

        if (orphanedResponses.length > 0) {
            log("--- Orphaned Response Details ---");
            for (const orphan of orphanedResponses) {
                log(`  ID: ${orphan.id}`);
                log(`  Shipment ID: ${orphan.shipment_id}`);
                log(`  Proposed Price: $${orphan.proposed_price}`);
                log(`  Created: ${orphan.created_at}`);
                log(`  Shipment Request Data: ${JSON.stringify(orphan.shipment_request)}`);
                log('  ---');
            }

            // 3. Check if the shipment_id exists in shipment_requests table
            log("\n--- Checking if shipment IDs exist in shipment_requests ---");
            for (const orphan of orphanedResponses) {
                const { data: shipment, error: sErr } = await supabase
                    .from('shipment_requests')
                    .select('*')
                    .eq('id', orphan.shipment_id)
                    .single();

                if (sErr || !shipment) {
                    log(`  Shipment ${orphan.shipment_id}: DOES NOT EXIST in shipment_requests table`);
                    log(`    -> This response is truly orphaned. Will DELETE.`);

                    // Delete the orphaned response
                    const { error: deleteErr } = await supabase
                        .from('carrier_responses')
                        .delete()
                        .eq('id', orphan.id);

                    if (deleteErr) {
                        log(`    -> DELETE FAILED: ${deleteErr.message}`);
                    } else {
                        log(`    -> DELETED successfully`);
                    }

                    // Also delete any ai_negotiations for this shipment
                    const { error: delNegErr } = await supabase
                        .from('ai_negotiations')
                        .delete()
                        .eq('shipment_id', orphan.shipment_id);

                    if (!delNegErr) {
                        log(`    -> Cleaned up related ai_negotiations`);
                    }
                } else {
                    log(`  Shipment ${orphan.shipment_id}: EXISTS but has missing location data`);
                    log(`    Source: ${shipment.source_location || 'MISSING'}`);
                    log(`    Destination: ${shipment.destination_location || 'MISSING'}`);
                }
            }
        } else {
            log("No orphaned responses found. All data is clean!");
        }

        log("\n--- Fix Complete ---");

    } catch (e) {
        log('Execution error: ' + e.message);
        log(e.stack);
    }
}

fixOrphanedResponses().then(() => {
    log('Script finished');
    process.exit(0);
}).catch(e => {
    log('Fatal error: ' + e.message);
    process.exit(1);
});

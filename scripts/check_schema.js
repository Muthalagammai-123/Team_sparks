const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.resolve(__dirname, '../.env.local');
let env = {};
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value.length > 0) env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
    });
}

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function checkSchema() {
    console.log("Checking for data in carrier_reviews...");

    const { data, error } = await supabase
        .from('carrier_reviews')
        .select('*')
        .limit(2);

    const result = {
        data,
        error,
        success: !error && data && data.length > 0
    };

    fs.writeFileSync('check_result.txt', JSON.stringify(result, null, 2));
    console.log("Check complete. Result saved to check_result.txt");
}

checkSchema();

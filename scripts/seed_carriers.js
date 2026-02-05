const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manual dotenv parsing
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const cities = [
    { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
    { name: 'Coimbatore', lat: 11.0168, lng: 76.9558 },
    { name: 'Madurai', lat: 9.9252, lng: 78.1198 },
    { name: 'Trichy', lat: 10.7905, lng: 78.7047 },
    { name: 'Salem', lat: 11.6643, lng: 78.1460 },
    { name: 'Tiruppur', lat: 11.1085, lng: 77.3411 },
    { name: 'Erode', lat: 11.3410, lng: 77.7172 },
    { name: 'Vellore', lat: 12.9165, lng: 79.1325 }
];

async function seed() {
    console.log('Starting Seeding...');

    // 1. Create a "Main Test Carrier" in Auth if it doesn't exist
    // Note: We'll use a specific email so you can login.
    const testEmail = 'carrier@test.com';
    const testPass = 'Password123!';

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPass,
        email_confirm: true,
        user_metadata: { role: 'carrier', full_name: 'Test Carrier Main' }
    });

    if (authError && authError.message !== 'User already registered') {
        console.error('Error creating test user:', authError.message);
    }

    const carrierId = authData?.user?.id || (await supabase.from('auth.users').select('id').eq('email', testEmail).single()).data?.id;

    if (!carrierId) {
        // Fallback: search for the user if above didn't return (admin.createUser sometimes behaves differently)
        const { data: users } = await supabase.rpc('get_user_id_by_email', { email_param: testEmail });
        // Since I don't have that RPC, I'll just skip and assume user might exist or be created manually.
        console.log('Please ensure carrier@test.com is signed up.');
    } else {
        console.log('Main Carrier ID:', carrierId);
        // Create profile for main carrier
        await supabase.from('carrier_profiles').upsert({
            carrier_id: carrierId,
            available_capacity: 50,
            base_location: 'Chennai',
            available_routes: ['Chennai - Bangalore', 'Chennai - Mumbai'],
            reliability_score: 4.9,
            total_deliveries: 120,
            on_time_deliveries: 118,
            latitude: 13.0827,
            longitude: 80.2707
        });
    }

    // 2. Create 39 more mock profiles (using dummy UUIDs since they don't need to log in for search results)
    const mockProfiles = [];
    for (let i = 1; i <= 39; i++) {
        const city = cities[Math.floor(Math.random() * cities.length)];
        const latOffset = (Math.random() - 0.5) * 0.1;
        const lngOffset = (Math.random() - 0.5) * 0.1;

        mockProfiles.push({
            carrier_id: `00000000-0000-0000-0000-0000000000${i.toString().padStart(2, '0')}`,
            available_capacity: Math.floor(Math.random() * 100) + 10,
            base_location: city.name,
            available_routes: [`${city.name} - Bangalore`, `${city.name} - Hyderabad`],
            reliability_score: parseFloat((Math.random() * 2 + 3).toFixed(2)),
            total_deliveries: Math.floor(Math.random() * 500),
            on_time_deliveries: Math.floor(Math.random() * 400),
            latitude: city.lat + latOffset,
            longitude: city.lng + lngOffset
        });
    }

    const { error: pError } = await supabase.from('carrier_profiles').upsert(mockProfiles);
    if (pError) console.error('Error seeding profiles:', pError.message);
    else console.log('Successfully seeded 39 mock carrier profiles.');
}

seed();

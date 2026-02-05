const { Client } = require('pg');
const fs = require('fs');

const connectionString = 'postgres://postgres.whkyqkdbynadffgbmvtw:Monishaaaa!!@aws-0-us-west-1.pooler.supabase.com:6543/postgres';

const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
});

async function run() {
    console.log('Starting migration...');
    try {
        await client.connect();
        console.log('Connected!');

        const sql = `
            CREATE TABLE IF NOT EXISTS public.carrier_live_location (
                carrier_id UUID PRIMARY KEY,
                latitude DOUBLE PRECISION NOT NULL,
                longitude DOUBLE PRECISION NOT NULL,
                speed NUMERIC DEFAULT 0,
                heading NUMERIC DEFAULT 0,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            ALTER TABLE public.carrier_live_location ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS "Public View" ON public.carrier_live_location;
            CREATE POLICY "Public View" ON public.carrier_live_location FOR SELECT USING (true);
            DROP POLICY IF EXISTS "Carrier Update" ON public.carrier_live_location;
            CREATE POLICY "Carrier Update" ON public.carrier_live_location FOR ALL USING (true) WITH CHECK (true);
        `;

        await client.query(sql);
        console.log('Done!');

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

run();

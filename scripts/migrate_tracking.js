const { Client } = require('pg');
const fs = require('fs');

const connectionString = 'postgres://postgres.whkyqkdbynadffgbmvtw:Monishaaaa%21%21@aws-0-us-west-1.pooler.supabase.com:6543/postgres';

const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        console.log('Connecting to database...');
        await client.connect();

        const sql = `
            CREATE TABLE IF NOT EXISTS carrier_live_location (
                carrier_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
                latitude DOUBLE PRECISION NOT NULL,
                longitude DOUBLE PRECISION NOT NULL,
                speed NUMERIC DEFAULT 0,
                heading NUMERIC DEFAULT 0,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            ALTER TABLE carrier_live_location ENABLE ROW LEVEL SECURITY;

            DROP POLICY IF EXISTS "Carriers can update own location" ON carrier_live_location;
            CREATE POLICY "Carriers can update own location"
              ON carrier_live_location
              FOR ALL
              USING (auth.uid() = carrier_id)
              WITH CHECK (auth.uid() = carrier_id);

            DROP POLICY IF EXISTS "Anyone can view carrier locations" ON carrier_live_location;
            CREATE POLICY "Anyone can view carrier locations"
              ON carrier_live_location
              FOR SELECT
              USING (true);

            -- Enable Realtime
            ALTER TABLE carrier_live_location REPLICA IDENTITY FULL;
        `;

        console.log('Running migration SQL...');
        await client.query(sql);
        console.log('Migration successful: carrier_live_location table is ready.');

        // Note: Enabling realtime for a table often requires specific publication commands 
        // that are sometimes restricted in pooler connections. 
        // Recommended to run "ALTER PUBLICATION supabase_realtime ADD TABLE carrier_live_location;" 
        // in the Supabase Dashboard SQL editor if it fails here.

    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await client.end();
    }
}

migrate();

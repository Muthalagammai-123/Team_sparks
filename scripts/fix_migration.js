const { Client } = require('pg');
const fs = require('fs');

const connectionString = 'postgres://postgres.whkyqkdbynadffgbmvtw:Monishaaaa%21%21@aws-0-us-west-1.pooler.supabase.com:6543/postgres';

const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const logFile = 'migration_debug.txt';
    fs.writeFileSync(logFile, 'Starting migration...\n');

    try {
        await client.connect();
        fs.appendFileSync(logFile, 'Connected to database.\n');

        const sql = `
            -- Drop if exists to ensure a clean start
            DROP TABLE IF EXISTS public.carrier_live_location CASCADE;

            CREATE TABLE public.carrier_live_location (
                carrier_id UUID PRIMARY KEY,
                latitude DOUBLE PRECISION NOT NULL,
                longitude DOUBLE PRECISION NOT NULL,
                speed NUMERIC DEFAULT 0,
                heading NUMERIC DEFAULT 0,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            -- Enable RLS
            ALTER TABLE public.carrier_live_location ENABLE ROW LEVEL SECURITY;

            -- Policies
            CREATE POLICY "Allow individuals to update their own location" 
            ON public.carrier_live_location FOR ALL 
            USING (auth.uid() = carrier_id) 
            WITH CHECK (auth.uid() = carrier_id);

            CREATE POLICY "Allow anyone to view locations" 
            ON public.carrier_live_location FOR SELECT 
            USING (true);

            -- Ensure it is in the realtime publication
            -- This can sometimes fail in pooler, so we wrap it
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_publication_tables 
                    WHERE pubname = 'supabase_realtime' 
                    AND tablename = 'carrier_live_location'
                ) THEN
                    ALTER PUBLICATION supabase_realtime ADD TABLE carrier_live_location;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not add to publication automatically';
            END $$;
        `;

        await client.query(sql);
        fs.appendFileSync(logFile, 'Migration completed successfully.\n');

        // Final check
        const res = await client.query("SELECT * FROM information_schema.tables WHERE table_name = 'carrier_live_location'");
        fs.appendFileSync(logFile, `Table exists check: ${res.rowCount > 0 ? 'YES' : 'NO'}\n`);

    } catch (err) {
        fs.appendFileSync(logFile, `ERROR: ${err.message}\n`);
    } finally {
        await client.end();
    }
}

run();

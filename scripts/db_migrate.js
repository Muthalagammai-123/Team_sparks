const { Client } = require('pg');
const fs = require('fs');

// Trying the POOLER connection for the project found in .env.local
// Project Ref: whkyqkdbynadffgbmvtw
// User: postgres.whkyqkdbynadffgbmvtw
// Pass: Monishaaaa!!
// Host: aws-0-us-west-1.pooler.supabase.com
// Port: 6543

const connectionString = 'postgres://postgres.whkyqkdbynadffgbmvtw:Monishaaaa%21%21@aws-0-us-west-1.pooler.supabase.com:6543/postgres';

const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

const log = (msg) => {
    fs.appendFileSync('migrate_log.txt', msg + '\n');
    console.log(msg);
}

async function migrate() {
    try {
        fs.writeFileSync('migrate_log.txt', 'Starting migration with Pooler...\n');
        await client.connect();
        log('Connected to Database (Pooler)');

        // 1. Drop and Recreate Table
        const createTableQuery = `
      DROP TABLE IF EXISTS carrier_reviews;
      CREATE TABLE carrier_reviews (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        carrier_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        shipper_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        shipment_id UUID REFERENCES shipment_requests(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        is_positive BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      ALTER TABLE carrier_reviews ENABLE ROW LEVEL SECURITY;
      
      -- Grant Permissions explicitly
      GRANT SELECT, INSERT, UPDATE, DELETE ON carrier_reviews TO anon, authenticated, service_role;

      CREATE POLICY "Public can view reviews" ON carrier_reviews FOR SELECT USING (true);
      CREATE POLICY "Shippers can create reviews" ON carrier_reviews FOR INSERT WITH CHECK (auth.uid() = shipper_id);
      CREATE POLICY "Service role full access" ON carrier_reviews USING (true) WITH CHECK (true);
    `;

        log('Running Create Table...');
        await client.query(createTableQuery);
        log('Table carrier_reviews created/reset successfully');

        // 2. Seed Data
        const carrierId = 'fb1229db-3774-4619-89c8-7779138f3932';
        const reviews = [
            { carrier_id: carrierId, rating: 5, comment: "Excellent service...", is_positive: true },
            { carrier_id: carrierId, rating: 4, comment: "Good communication...", is_positive: true }
        ];

        log(`Seeding reviews...`);
        for (const review of reviews) {
            const query = `
          INSERT INTO carrier_reviews (carrier_id, rating, comment, is_positive)
          VALUES ($1, $2, $3, $4)
        `;
            try {
                await client.query(query, [review.carrier_id, review.rating, review.comment, review.is_positive]);
            } catch (e) {
                log(`Failed to insert review: ${e.message}`);
            }
        }

        // 3. Force REST API Cache Reload
        log("Notifying pgrst...");
        await client.query("NOTIFY pgrst, 'reload config'");
        log("Cache reload notified.");

    } catch (err) {
        log(`Migration FAILED: ${err.message}`);
        log(`Full Error: ${JSON.stringify(err)}`);
    } finally {
        await client.end();
    }
}

migrate();

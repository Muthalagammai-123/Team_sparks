const { Client } = require('pg');
const fs = require('fs');

const connectionString = 'postgres://postgres.whkyqkdbynadffgbmvtw:Monishaaaa!!@aws-0-us-west-1.pooler.supabase.com:6543/postgres';

const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
});

async function run() {
    console.log('Connecting to database...');
    try {
        await client.connect();
        console.log('Connected!');

        const sql = `
            CREATE TABLE IF NOT EXISTS public.carrier_reviews (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                carrier_id UUID NOT NULL,
                shipper_id UUID,
                shipment_id UUID,
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                is_positive BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            ALTER TABLE public.carrier_reviews ENABLE ROW LEVEL SECURITY;
            
            DROP POLICY IF EXISTS "Public can view reviews" ON public.carrier_reviews;
            CREATE POLICY "Public can view reviews" ON public.carrier_reviews FOR SELECT USING (true);
            
            DROP POLICY IF EXISTS "Service role full access" ON public.carrier_reviews;
            CREATE POLICY "Service role full access" ON public.carrier_reviews USING (true) WITH CHECK (true);

            GRANT ALL ON public.carrier_reviews TO anon, authenticated, service_role;
        `;

        await client.query(sql);
        console.log('Table carrier_reviews created successfully!');

        // Seed some data
        const carrierId = 'fb1229db-3774-4619-89c8-7779138f3932';
        const seedSql = `
            INSERT INTO public.carrier_reviews (carrier_id, rating, comment, is_positive)
            VALUES 
            ('${carrierId}', 5, 'Excellent service, arrived 2 hours early! Very professional.', true),
            ('${carrierId}', 5, 'Best rates for the Chennai-Bangalore route. AI negotiation was smooth.', true),
            ('${carrierId}', 4, 'Good communication throughout the journey. Highly recommended.', true)
            ON CONFLICT DO NOTHING;
        `;
        await client.query(seedSql);
        console.log('Seed data inserted!');

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

run();

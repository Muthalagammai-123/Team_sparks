const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.resolve(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value.length > 0) env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function seedReviews() {
    const carrierId = 'fb1229db-3774-4619-89c8-7779138f3932';

    // First ensure the table exists by trying a select (this is a bit hacky but works for demo)
    const reviews = [
        { carrier_id: carrierId, rating: 5, comment: "Excellent service, arrived 2 hours early! Very professional handling of fragile items.", is_positive: true },
        { carrier_id: carrierId, rating: 5, comment: "Best rates for the Chennai-Bangalore route. AI negotiation was smooth.", is_positive: true },
        { carrier_id: carrierId, rating: 4, comment: "Good communication throughout the journey. Highly recommended.", is_positive: true },
        { carrier_id: carrierId, rating: 2, comment: "Slight delay due to documentation issues at the border, but goods were safe.", is_positive: false },
        { carrier_id: carrierId, rating: 5, comment: "Amazing reliability score for a reason. Will definitely book again.", is_positive: true },
        { carrier_id: carrierId, rating: 1, comment: "Vehicle had some mechanical issues which caused a significant delay.", is_positive: false },
        { carrier_id: carrierId, rating: 4, comment: "Transparent pricing and easy to track live location.", is_positive: true },
        { carrier_id: carrierId, rating: 5, comment: "The AI agent got us a great deal. Carrier was very cooperative.", is_positive: true },
        { carrier_id: carrierId, rating: 5, comment: "Standard service, no complaints. Professional staff.", is_positive: true },
        { carrier_id: carrierId, rating: 3, comment: "Average experience. Price was slightly higher than expected.", is_positive: false }
    ];

    console.log("Seeding reviews...");
    const { error } = await supabase.from('carrier_reviews').insert(reviews);

    if (error) {
        console.error("Error seeding reviews:", error.message);
        if (error.message.includes("relation \"carrier_reviews\" does not exist")) {
            console.log("Table doesn't exist. You need to run the SQL in Supabase Dashboard first.");
        }
    } else {
        console.log("Successfully seeded 10 reviews.");
    }
}

seedReviews();

const { Client } = require('pg');
const fs = require('fs');

const log = (msg) => {
    fs.appendFileSync('table_verify_log.txt', msg + '\n');
    console.log(msg);
}
fs.writeFileSync('table_verify_log.txt', '');

const connectionString = 'postgres://postgres.whkyqkdbynadffgbmvtw:Monishaaaa%21%21@aws-0-us-west-1.pooler.supabase.com:6543/postgres';

const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'carrier_live_location'
            );
        `);
        log('Table exists: ' + res.rows[0].exists);

        if (res.rows[0].exists) {
            const columns = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'carrier_live_location';
            `);
            log('Columns: ' + JSON.stringify(columns.rows));
        }
    } catch (err) {
        log('Check failed: ' + err.message);
    } finally {
        await client.end();
    }
}

check();

// Script to add columns via Supabase REST API (using rpc)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.production');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
        envVars[match[1].trim()] = match[2].trim();
    }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseServiceKey = envVars.VITE_SUPABASE_SERVICE_KEY;

async function addColumns() {
    console.log('Adding address columns to users table via Supabase Management API...\n');

    // Use the Supabase REST API to execute SQL
    const sql = `
        ALTER TABLE users ADD COLUMN IF NOT EXISTS adresse_domicile TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS adresse_domicile_latitude NUMERIC;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS adresse_domicile_longitude NUMERIC;
    `;

    // Try using the query endpoint (requires service role)
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ sql_query: sql }),
    });

    if (!response.ok) {
        console.log('Direct SQL execution not available (normal for security).');
        console.log('\nPlease run this SQL manually in Supabase SQL Editor:');
        console.log('https://supabase.com/dashboard/project/snooemomgthyvrzwqgks/sql\n');
        console.log('```sql');
        console.log(sql);
        console.log('```');
        return;
    }

    const result = await response.json();
    console.log('Result:', result);
}

addColumns().catch(console.error);

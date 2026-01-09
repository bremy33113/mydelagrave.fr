// Script to add address columns to users table in Supabase
// Usage: node scripts/add-user-address-columns.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Read .env.production manually
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

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_KEY in .env.production');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function checkAndAddColumns() {
    console.log('='.repeat(60));
    console.log('Adding address columns to users table');
    console.log('='.repeat(60));
    console.log(`URL: ${supabaseUrl}\n`);

    // Check if columns exist by trying to select them
    const { data, error } = await supabase
        .from('users')
        .select('adresse_domicile, adresse_domicile_latitude, adresse_domicile_longitude')
        .limit(1);

    if (error) {
        if (error.message.includes('adresse_domicile')) {
            console.log('Columns do not exist. Please run the following SQL in Supabase SQL Editor:\n');
            console.log(`
-- Add address columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS adresse_domicile TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS adresse_domicile_latitude NUMERIC;
ALTER TABLE users ADD COLUMN IF NOT EXISTS adresse_domicile_longitude NUMERIC;

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name LIKE 'adresse_domicile%';
            `);
        } else {
            console.error('Error checking columns:', error.message);
        }
    } else {
        console.log('✓ Address columns already exist in users table!');
        console.log('Sample data:', data);
    }
}

checkAndAddColumns();

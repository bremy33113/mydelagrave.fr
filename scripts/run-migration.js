// Script to run migration on Supabase
// Usage: node scripts/run-migration.js

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

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function checkTables() {
    console.log('Checking existing tables...\n');

    const tables = [
        'users', 'clients', 'chantiers', 'phases_chantiers',
        'notes_chantiers', 'pointages', 'chantiers_contacts',
        'documents_chantiers', 'historique_phases',
        'ref_roles_user', 'ref_statuts_chantier', 'ref_categories_chantier',
        'ref_types_chantier', 'ref_clients', 'ref_job', 'ref_types_document'
    ];

    const results = [];

    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            results.push({ table, exists: false, error: error.message });
        } else {
            results.push({ table, exists: true, count });
        }
    }

    console.log('Table Status:');
    console.log('='.repeat(60));

    const missing = [];
    const existing = [];

    for (const r of results) {
        if (r.exists) {
            console.log(`✓ ${r.table.padEnd(25)} (${r.count} rows)`);
            existing.push(r.table);
        } else {
            console.log(`✗ ${r.table.padEnd(25)} - MISSING`);
            missing.push(r.table);
        }
    }

    console.log('='.repeat(60));
    console.log(`\nExisting: ${existing.length}/${tables.length}`);
    console.log(`Missing: ${missing.length}/${tables.length}`);

    if (missing.length > 0) {
        console.log('\n⚠️  Tables manquantes détectées!');
        console.log('Exécutez la migration SQL dans Supabase SQL Editor:');
        console.log('supabase/migrations/001_complete_schema.sql');
    } else {
        console.log('\n✓ Toutes les tables sont présentes!');
    }

    return { existing, missing };
}

async function main() {
    console.log('='.repeat(60));
    console.log('MyDelagrave - Supabase Database Check');
    console.log('='.repeat(60));
    console.log(`URL: ${supabaseUrl}\n`);

    try {
        await checkTables();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();

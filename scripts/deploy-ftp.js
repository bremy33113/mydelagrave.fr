// Deploy to FTP script
// Usage: node scripts/deploy-ftp.js

import { Client } from 'basic-ftp';
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

const FTP_HOST = envVars.FTP_HOST;
const FTP_USER = envVars.FTP_USER;
const FTP_PASS = envVars.FTP_PASS;
const FTP_PORT = parseInt(envVars.FTP_PORT || '21');
const FTP_REMOTE_DIR = envVars.FTP_REMOTE_DIR || '/public_html/';

if (!FTP_HOST || !FTP_USER || !FTP_PASS) {
    console.error('Missing FTP credentials in .env.production');
    process.exit(1);
}

const distPath = path.join(__dirname, '..', 'dist');

async function deploy() {
    const client = new Client();
    client.ftp.verbose = true;

    try {
        console.log('='.repeat(60));
        console.log('MyDelagrave - FTP Deployment');
        console.log('='.repeat(60));
        console.log(`Host: ${FTP_HOST}`);
        console.log(`User: ${FTP_USER}`);
        console.log(`Remote: ${FTP_REMOTE_DIR}`);
        console.log(`Local: ${distPath}`);
        console.log('='.repeat(60));

        console.log('\nConnecting to FTP server...');
        await client.access({
            host: FTP_HOST,
            port: FTP_PORT,
            user: FTP_USER,
            password: FTP_PASS,
            secure: false
        });

        console.log('Connected! Navigating to remote directory...');
        await client.ensureDir(FTP_REMOTE_DIR);

        console.log('Uploading files from dist/...');
        await client.uploadFromDir(distPath);

        console.log('\n' + '='.repeat(60));
        console.log('Deployment completed successfully!');
        console.log('='.repeat(60));

    } catch (err) {
        console.error('Deployment failed:', err.message);
        process.exit(1);
    } finally {
        client.close();
    }
}

deploy();

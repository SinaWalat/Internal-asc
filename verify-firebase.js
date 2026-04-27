const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');

console.log('--- Firebase Admin Verification Script ---');

// 1. Read .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
    console.error('ERROR: .env.local file not found!');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/FIREBASE_SERVICE_ACCOUNT_KEY='(.+)'/s);

if (!match) {
    console.error('ERROR: FIREBASE_SERVICE_ACCOUNT_KEY not found or format is incorrect in .env.local');
    console.log('Content preview:', envContent.substring(0, 100) + '...');
    process.exit(1);
}

const keyString = match[1];
console.log('Found FIREBASE_SERVICE_ACCOUNT_KEY string length:', keyString.length);

try {
    // 2. Parse JSON
    const serviceAccount = JSON.parse(keyString);
    console.log('Successfully parsed JSON.');
    console.log('Project ID:', serviceAccount.project_id);
    console.log('Client Email:', serviceAccount.client_email);

    // 3. Initialize App
    console.log('Attempting to initialize Firebase Admin App...');
    const app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id
    });
    console.log('Firebase Admin App initialized successfully:', app.name);
    console.log('SUCCESS: Credentials are valid and working!');

} catch (error) {
    console.error('ERROR during initialization:', error.message);
    if (error.stack) console.error(error.stack);
}

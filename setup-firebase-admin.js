import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const envPath = path.join(process.cwd(), '.env.local');

console.log('\x1b[36m%s\x1b[0m', '=== Firebase Admin Setup ===');
console.log('To fix the "Could not load the default credentials" error, we need to set up the Service Account Key.');
console.log('');
console.log('1. Go to Firebase Console > Project Settings > Service accounts');
console.log('   URL: https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk');
console.log('2. Click "Generate new private key"');
console.log('3. Open the downloaded JSON file');
console.log('');

rl.question('Paste the ENTIRE content of the JSON file here: ', (answer) => {
    try {
        // Validate JSON
        const json = JSON.parse(answer.trim());
        if (!json.project_id || !json.private_key) {
            throw new Error('Invalid Service Account JSON. Missing project_id or private_key.');
        }

        // Minify JSON for .env
        const minifiedJson = JSON.stringify(json);

        // Read existing .env.local
        let envContent = '';
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        // Check if key already exists
        if (envContent.includes('FIREBASE_SERVICE_ACCOUNT_KEY=')) {
            console.log('Updating existing FIREBASE_SERVICE_ACCOUNT_KEY in .env.local...');
            envContent = envContent.replace(/FIREBASE_SERVICE_ACCOUNT_KEY=.*/g, `FIREBASE_SERVICE_ACCOUNT_KEY='${minifiedJson}'`);
        } else {
            console.log('Adding FIREBASE_SERVICE_ACCOUNT_KEY to .env.local...');
            envContent += `\nFIREBASE_SERVICE_ACCOUNT_KEY='${minifiedJson}'\n`;
        }

        fs.writeFileSync(envPath, envContent);
        console.log('\x1b[32m%s\x1b[0m', 'Success! .env.local has been updated.');
        console.log('Please restart your development server for changes to take effect.');

    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', 'Error: ' + error.message);
    } finally {
        rl.close();
    }
});

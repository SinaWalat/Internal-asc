import 'server-only';
import { initializeApp, getApps, getApp, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

// You can use environment variables for service account credentials if needed
// For now, we'll rely on default Google Cloud credentials or emulator if running locally
// In production, you should set GOOGLE_APPLICATION_CREDENTIALS or use cert() with a service account object

function getFirebaseAdminApp(): App {
    if (getApps().length === 0) {
        try {
            if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
                try {
                    console.log('Attempting to parse FIREBASE_SERVICE_ACCOUNT_KEY...');
                    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
                    console.log('Successfully parsed service account key for project:', serviceAccount.project_id);
                    return initializeApp({
                        credential: cert(serviceAccount),
                        projectId: serviceAccount.project_id
                    });
                } catch (e) {
                    console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY, falling back to default credentials', e);
                }
            } else {
                console.log('FIREBASE_SERVICE_ACCOUNT_KEY not found in environment variables.');
            }

            return initializeApp({
                projectId: 'studio-6606920957-66aff' // Fallback to explicit project ID
            });
        } catch (error) {
            console.error('Failed to initialize Firebase Admin App:', error);
            throw new Error('Failed to initialize Firebase Admin. Ensure GOOGLE_APPLICATION_CREDENTIALS is set, FIREBASE_SERVICE_ACCOUNT_KEY is present, or you are logged in via gcloud.');
        }
    }
    return getApp();
}

export function getAdminAuth(): Auth {
    const app = getFirebaseAdminApp();
    return getAuth(app);
}

export function getAdminFirestore() {
    const app = getFirebaseAdminApp();
    return getFirestore(app);
}

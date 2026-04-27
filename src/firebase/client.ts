'use client';

import { initializeApp as initializeClientApp, getApps as getClientApps, getApp as getClientApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore'
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from '@/firebase/config';


// This function is ONLY for the client.
function initializeFirebaseClient() {
  if (!getClientApps().length) {
    let firebaseApp;
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      firebaseApp = initializeClientApp();
    } catch (e) {
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeClientApp(firebaseConfig);
    }

    return getClientSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getClientSdks(getClientApp());
}

function getClientSdks(firebaseApp: FirebaseApp) {
  // Initialize Firestore with settings to avoid QUIC errors
  const firestore = initializeFirestore(firebaseApp, {
    experimentalForceLongPolling: true,
  });

  if (typeof window !== 'undefined') {
    enableMultiTabIndexedDbPersistence(firestore).catch((err) => {
      if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a a time.
        // ...
        console.warn('Firestore persistence failed-precondition', err);
      } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        // ...
        console.warn('Firestore persistence unimplemented', err);
      }
    });
  }

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore,
    storage: getStorage(firebaseApp)
  };
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';

// Re-export the initialized firebase instance for client-side use
export { initializeFirebaseClient as initializeFirebase };

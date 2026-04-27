'use client';

import { useEffect } from 'react';

/**
 * Suppresses console errors from browser extensions and third-party scripts
 * that are outside our application's control
 */
export function ErrorSuppressor() {
    useEffect(() => {
        // Store original console.error
        const originalError = console.error;

        // Override console.error to filter out extension errors
        console.error = (...args: any[]) => {
            const errorString = args.join(' ');

            // Suppress errors from browser extensions (chrome-extension://)
            if (errorString.includes('chrome-extension://') ||
                errorString.includes('injected.bundle.js') ||
                errorString.includes('setExternalProvider')) {
                return; // Silently ignore these errors
            }

            // Pass through all other errors
            originalError.apply(console, args);
        };

        // Cleanup: restore original console.error when component unmounts
        return () => {
            console.error = originalError;
        };
    }, []);

    return null; // This component doesn't render anything
}

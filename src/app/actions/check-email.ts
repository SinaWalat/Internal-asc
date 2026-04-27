'use server';

import { getAdminAuth } from '@/firebase/admin';

export async function checkEmailExists(email: string): Promise<boolean> {
    try {
        const auth = getAdminAuth();
        await auth.getUserByEmail(email);
        return true; // User exists
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            return false; // User does not exist
        }
        // Log other errors but return false or throw depending on desired behavior
        // For safety, if we can't check, we might assume false to let them try (and fail later) 
        // or throw to block. Here we'll throw to be safe.
        console.error('Error checking email existence:', error);
        throw new Error('Could not verify email availability.');
    }
}

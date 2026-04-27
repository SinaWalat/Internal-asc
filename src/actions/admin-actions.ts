'use server';

import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { z } from 'zod';

const createAdminSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    role: z.enum(['global_admin', 'editor', 'viewer']),
    permissions: z.array(z.string()),
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;

export async function createAdminUser(data: CreateAdminInput, currentUserId: string) {
    try {
        const auth = getAdminAuth();
        const firestore = getAdminFirestore();

        // 1. Verify current user is a Global Admin
        const currentUserDoc = await firestore.collection('admins').doc(currentUserId).get();
        const currentRole = currentUserDoc.data()?.role;
        if (!currentUserDoc.exists || (currentRole !== 'global_admin' && currentRole !== 'Global Admin')) {
            return { success: false, error: 'Unauthorized: Only Global Admins can create new admins.' };
        }

        // 2. Validate input
        const validation = createAdminSchema.safeParse(data);
        if (!validation.success) {
            return { success: false, error: 'Invalid input data.' };
        }

        const { email, password, name, role, permissions } = validation.data;

        // 3. Create user in Firebase Auth
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: name,
            emailVerified: true,
        });

        // 4. Create admin document in Firestore
        await firestore.collection('admins').doc(userRecord.uid).set({
            email,
            name,
            role,
            permissions,
            created_at: new Date(),
            createdBy: currentUserId,
        });

        // 5. Set custom claims (optional, but good for security rules)
        await auth.setCustomUserClaims(userRecord.uid, {
            admin: true,
            role,
        });

        return { success: true, uid: userRecord.uid };

    } catch (error: any) {
        console.error('Error creating admin user:', error);
        // Handle specific Firebase Auth errors
        if (error.code === 'auth/email-already-exists') {
            return { success: false, error: 'A user with this email already exists.' };
        }
        return { success: false, error: error.message || 'Failed to create admin user.' };
    }
}

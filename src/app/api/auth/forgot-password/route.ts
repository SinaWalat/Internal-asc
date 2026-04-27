import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/firebase/admin';
import { sendPasswordResetEmail } from '@/actions/email-actions';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Generate password reset link using Firebase Admin SDK
        const adminAuth = getAdminAuth();
        const firebaseLink = await adminAuth.generatePasswordResetLink(email);

        // Extract oobCode from the Firebase link
        const urlObj = new URL(firebaseLink);
        const oobCode = urlObj.searchParams.get('oobCode');

        if (!oobCode) {
            throw new Error('Failed to extract reset code');
        }

        // Construct custom reset link
        const origin = new URL(request.url).origin;
        const resetLink = `${origin}/reset-password?oobCode=${oobCode}`;

        // Send the email using SendGrid
        const emailResult = await sendPasswordResetEmail(email, resetLink);

        if (!emailResult.success) {
            console.error('Failed to send email:', emailResult.error);
            return NextResponse.json(
                { error: 'Failed to send password reset email' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Password reset error:', error);

        // If user not found, we still return success to prevent email enumeration
        if (error.code === 'auth/user-not-found') {
            return NextResponse.json({ success: true });
        }

        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

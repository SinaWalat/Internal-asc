import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, getAdminAuth } from '@/firebase/admin';

export async function POST(req: NextRequest) {
    try {
        const { chatId, studentName, idToken } = await req.json();

        if (!chatId || !studentName || !idToken) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify the user is authenticated and is an admin
        const decodedToken = await getAdminAuth().verifyIdToken(idToken);

        // Optional: Check for admin custom claim if you use them
        // if (!decodedToken.admin) {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        // }

        const firestore = getAdminFirestore();
        await firestore.collection('chats').doc(chatId).update({
            studentName: studentName
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error syncing chat name:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

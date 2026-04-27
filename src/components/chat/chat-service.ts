import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    updateDoc,
    getDoc,
    setDoc,
    limit,
    getDocs
} from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';

export interface ChatMessage {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    createdAt: any;
    read: boolean;
    role?: 'student' | 'admin' | 'support';
}

export interface ChatConversation {
    id: string;
    participants: string[]; // [studentId, adminId] or [userId, 'support']
    lastMessage: string;
    lastMessageTime: any;
    unreadCount: number;
    studentId: string;
    studentName: string;
    studentEmail: string;
    status: 'active' | 'closed';
    participantNames?: Record<string, string>;
    participantRoles?: Record<string, string>;
    type?: 'support' | 'admin';
    studentSessionStartDate?: any;
}

export const ChatService = {
    // Start or get existing conversation
    startConversation: async (firestore: Firestore, userId: string, userName: string, userEmail: string) => {
        const chatId = `support_${userId}`;
        const chatDocRef = doc(firestore, 'chats', chatId);
        const chatDoc = await getDoc(chatDocRef);

        // Fetch real name from profile if userName is generic
        let finalName = userName;
        if (!userName || userName === 'Student') {
            try {
                const profileDoc = await getDoc(doc(firestore, 'profiles', userId));
                if (profileDoc.exists()) {
                    const data = profileDoc.data();
                    const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';

                    if (data.firstName && data.lastName) {
                        finalName = `${capitalize(data.firstName)} ${capitalize(data.lastName)}`;
                    } else if (data.fullName) {
                        finalName = data.fullName;
                    }
                }
            } catch (e) {
                console.error("Error fetching profile for chat creation:", e);
            }
        }

        if (!chatDoc.exists()) {
            await setDoc(chatDocRef, {
                participants: [userId, 'support'],
                studentId: userId,
                studentName: finalName,
                studentEmail: userEmail,
                lastMessage: '',
                lastMessageTime: serverTimestamp(),
                unreadCount: 0,
                status: 'active',
                type: 'support',
                createdAt: serverTimestamp(),
                studentSessionStartDate: serverTimestamp(), // Start of first session
            });

            // Send automatic welcome message
            const messagesRef = collection(firestore, 'chats', chatId, 'messages');
            const welcomeText = "Hi, thank you for reaching out. An agent will join shortly. Please describe your issue while you wait.";

            await addDoc(messagesRef, {
                text: welcomeText,
                senderId: 'support',
                senderName: 'Support Agent',
                createdAt: serverTimestamp(),
                read: false,
                role: 'support'
            });

            await updateDoc(chatDocRef, {
                lastMessage: welcomeText,
                lastMessageTime: serverTimestamp(),
                unreadCount: 1,
            });
        } else {
            // If chat exists, check if it's closed
            const data = chatDoc.data();
            if (data?.status === 'closed') {
                // Re-activate and set new session start time for student
                await updateDoc(chatDocRef, {
                    status: 'active',
                    studentSessionStartDate: serverTimestamp()
                });

                // Send welcome message for new session
                const messagesRef = collection(firestore, 'chats', chatId, 'messages');
                const welcomeText = "Hi, thank you for reaching out. An agent will join shortly. Please describe your issue while you wait.";

                await addDoc(messagesRef, {
                    text: welcomeText,
                    senderId: 'support',
                    senderName: 'Support Agent',
                    createdAt: serverTimestamp(),
                    read: false,
                    role: 'support'
                });

                await updateDoc(chatDocRef, {
                    lastMessage: welcomeText,
                    lastMessageTime: serverTimestamp(),
                    unreadCount: 1,
                });
            } else {
                // Active chat, check if empty
                const messagesRef = collection(firestore, 'chats', chatId, 'messages');
                const messagesSnapshot = await getDocs(query(messagesRef, limit(1)));

                if (messagesSnapshot.empty) {
                    const welcomeText = "Hi, thank you for reaching out. An agent will join shortly. Please describe your issue while you wait.";

                    await addDoc(messagesRef, {
                        text: welcomeText,
                        senderId: 'support',
                        senderName: 'Support Agent',
                        createdAt: serverTimestamp(),
                        read: false,
                        role: 'support'
                    });

                    await updateDoc(chatDocRef, {
                        lastMessage: welcomeText,
                        lastMessageTime: serverTimestamp(),
                        unreadCount: 1,
                    });
                }
            }
        }

        return chatId;
    },

    startAdminConversation: async (firestore: Firestore, currentUserId: string, currentUserName: string, otherUserId: string, otherUserName: string) => {
        const sortedIds = [currentUserId, otherUserId].sort();
        const chatId = `admin_${sortedIds.join('_')}`;
        const chatDocRef = doc(firestore, 'chats', chatId);
        const chatDoc = await getDoc(chatDocRef);

        if (!chatDoc.exists()) {
            await setDoc(chatDocRef, {
                participants: [currentUserId, otherUserId],
                participantNames: {
                    [currentUserId]: currentUserName || 'Unknown Admin',
                    [otherUserId]: otherUserName || 'Unknown Admin'
                },
                type: 'admin',
                lastMessage: '',
                lastMessageTime: serverTimestamp(),
                unreadCount: 0,
                status: 'active',
                createdAt: serverTimestamp(),
            });
        } else if (chatDoc.data()?.status === 'closed') {
            await updateDoc(chatDocRef, { status: 'active' });
        }
        return chatId;
    },

    // End a conversation
    endConversation: async (firestore: Firestore, chatId: string) => {
        const chatRef = doc(firestore, 'chats', chatId);

        // Send closing message
        const messagesRef = collection(firestore, 'chats', chatId, 'messages');
        const closingText = "Chat closed. Thanks for your time! Refresh the page to contact us again.";

        await addDoc(messagesRef, {
            text: closingText,
            senderId: 'support',
            senderName: 'System',
            createdAt: serverTimestamp(),
            read: false,
            role: 'support'
        });

        await updateDoc(chatRef, {
            status: 'closed',
            lastMessage: closingText,
            lastMessageTime: serverTimestamp()
        });
    },

    // Send a message
    sendMessage: async (firestore: Firestore, chatId: string, senderId: string, senderName: string, text: string, role: 'student' | 'admin' | 'support' = 'student') => {
        const messagesRef = collection(firestore, 'chats', chatId, 'messages');
        await addDoc(messagesRef, {
            text,
            senderId,
            senderName,
            createdAt: serverTimestamp(),
            read: false,
            role
        });

        // Update conversation metadata
        const chatRef = doc(firestore, 'chats', chatId);
        await updateDoc(chatRef, {
            lastMessage: text,
            lastMessageTime: serverTimestamp(),
            unreadCount: 1,
            // In a real app, you'd want to increment unread count for the *other* party
        });

        // Create notification for admin if sender is student
        if (role === 'student') {
            await addDoc(collection(firestore, 'notifications'), {
                title: 'New Chat Message',
                message: `${senderName}: ${text}`,
                type: 'info',
                read: false,
                createdAt: serverTimestamp(),
                link: '/admin/chat'
            });
        }
    },

    // Subscribe to messages in a conversation
    subscribeToMessages: (firestore: Firestore, chatId: string, callback: (messages: ChatMessage[]) => void) => {
        const messagesRef = collection(firestore, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ChatMessage[];
            callback(messages);
        });
    },

    // Subscribe to chat metadata
    subscribeToChat: (firestore: Firestore, chatId: string, callback: (chat: ChatConversation | null) => void) => {
        const chatRef = doc(firestore, 'chats', chatId);
        return onSnapshot(chatRef, (doc) => {
            if (doc.exists()) {
                callback({ id: doc.id, ...doc.data() } as ChatConversation);
            } else {
                callback(null);
            }
        });
    },

    // Subscribe to all conversations (for admin)
    subscribeToConversations: (firestore: Firestore, callback: (chats: ChatConversation[]) => void) => {
        const chatsRef = collection(firestore, 'chats');
        const q = query(chatsRef, orderBy('lastMessageTime', 'desc'));

        return onSnapshot(q, (snapshot) => {
            const chats = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ChatConversation[];
            callback(chats);
        });
    }
};

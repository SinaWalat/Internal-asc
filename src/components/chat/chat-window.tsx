import React, { useState, useEffect, useRef } from 'react';
import { useFirebase, useUser } from '@/firebase/client';
import { ChatService, ChatMessage } from './chat-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Info, Send, Loader2, ArrowLeft } from 'lucide-react';
import { cn, safeTimestampToDate } from '@/lib/utils';
import { format } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { doc, getDoc } from 'firebase/firestore';

// ... (existing imports)

interface ChatWindowProps {
    chatId: string;
    currentUserId: string;
    currentUserName: string;
    className?: string;
    isAdminView?: boolean;
}

export function ChatWindow({ chatId, currentUserId, currentUserName, className, isAdminView = false }: ChatWindowProps) {
    const { firestore } = useFirebase();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [chatStatus, setChatStatus] = useState<'active' | 'closed'>('active');
    const [sessionStartDate, setSessionStartDate] = useState<any>(null);
    const [studentProfile, setStudentProfile] = useState<any>(null);
    const [chatData, setChatData] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'chat' | 'info'>('chat');
    const [adminDetails, setAdminDetails] = useState<{ name: string; email: string; role: string; permissions: string[] } | null>(null);

    useEffect(() => {
        if (!firestore || !chatId) return;

        // Subscribe to messages
        const unsubscribeMessages = ChatService.subscribeToMessages(firestore, chatId, (msgs) => {
            setMessages(msgs);
            setLoading(false);
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        });

        // Subscribe to chat status
        const unsubscribeChat = ChatService.subscribeToChat(firestore, chatId, async (chat) => {
            if (chat) {
                setChatStatus(chat.status);
                setSessionStartDate(chat.studentSessionStartDate);
                setChatData(chat);

                // Fetch student profile if admin view and studentId is available
                if (isAdminView && chat.studentId && !studentProfile && chat.type !== 'admin') {
                    try {
                        const profileDoc = await getDoc(doc(firestore, 'profiles', chat.studentId));
                        if (profileDoc.exists()) {
                            setStudentProfile(profileDoc.data());
                        }
                    } catch (error) {
                        console.error("Error fetching student profile:", error);
                    }
                }

                // Fetch admin details if it's an admin chat
                if (isAdminView && chat.type === 'admin' && chat.participantNames) {
                    const otherId = Object.keys(chat.participantNames).find(id => id !== currentUserId);
                    if (otherId) {
                        try {
                            const adminDoc = await getDoc(doc(firestore, 'admins', otherId));
                            if (adminDoc.exists()) {
                                const data = adminDoc.data();
                                setAdminDetails({
                                    name: data.name || 'Admin',
                                    email: data.email,
                                    role: data.role,
                                    permissions: data.permissions || []
                                });
                            }
                        } catch (error) {
                            console.error("Error fetching admin details:", error);
                        }
                    }
                }
            }
        });

        return () => {
            unsubscribeMessages();
            unsubscribeChat();
        };
    }, [firestore, chatId, isAdminView]); // Added isAdminView dependency

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || !firestore || chatStatus === 'closed') return;

        const messageToSend = newMessage;
        setNewMessage(''); // Clear immediately for better UX

        try {
            const role = isAdminView ? 'admin' : 'student';
            await ChatService.sendMessage(firestore, chatId, currentUserId, currentUserName, messageToSend, role);
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    const handleEndChat = async () => {
        if (!firestore) return;
        await ChatService.endConversation(firestore, chatId);
    };

    // Filter messages for student view
    const filteredMessages = messages.filter(msg => {
        if (isAdminView) return true; // Admin sees all
        if (!sessionStartDate) return true; // Legacy support

        const msgDate = safeTimestampToDate(msg.createdAt);
        const sessionDate = safeTimestampToDate(sessionStartDate);

        if (!msgDate || !sessionDate) return true;
        return msgDate >= sessionDate;
    });

    if (viewMode === 'info' && isAdminView) {
        return (
            <div className={cn("flex flex-col h-full bg-background border rounded-lg overflow-hidden", className)}>
                <div className="p-2 border-b flex items-center gap-2 bg-muted/20">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setViewMode('chat')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-semibold text-sm">
                        {chatData?.type === 'admin' ? 'Admin Information' : 'Student Information'}
                    </span>
                </div>
                <div className="p-6 space-y-6">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                        <div className="text-lg font-semibold">
                            {(() => {
                                if (chatData?.type === 'admin') {
                                    return adminDetails?.name || chatData?.studentName || 'N/A';
                                }
                                const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
                                if (studentProfile?.firstName && studentProfile?.lastName) {
                                    return `${capitalize(studentProfile.firstName)} ${capitalize(studentProfile.lastName)}`;
                                }
                                return studentProfile?.fullName || chatData?.studentName || 'N/A';
                            })()}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                        <div className="text-lg font-semibold">
                            {chatData?.type === 'admin'
                                ? (adminDetails?.email || chatData?.studentEmail || 'N/A')
                                : (studentProfile?.email || chatData?.studentEmail || 'N/A')
                            }
                        </div>
                    </div>
                    {
                        chatData?.type === 'admin' && adminDetails && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-muted-foreground">Role</label>
                                    <div className="text-lg font-semibold capitalize">
                                        {adminDetails.role?.replace(/_/g, ' ') || 'N/A'}
                                    </div>
                                </div>
                                {adminDetails.permissions && adminDetails.permissions.length > 0 && (
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-muted-foreground">Subroles</label>
                                        <div className="flex flex-wrap gap-2">
                                            {adminDetails.permissions.map((permission) => (
                                                <Badge key={permission} variant="outline" className="capitalize">
                                                    {permission.replace(/manage_/g, '').replace(/_/g, ' ')}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )
                    }
                    {
                        chatData?.type !== 'admin' && (
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">University</label>
                                <div className="text-lg font-semibold">{studentProfile?.university || 'N/A'}</div>
                            </div>
                        )
                    }
                </div >
            </div >
        );
    }

    return (
        <div className={cn("flex flex-col h-full bg-background border rounded-lg overflow-hidden", className)}>
            {/* Header for Admin Actions */}
            {isAdminView && (
                <div className="p-2 border-b flex justify-end gap-2 bg-muted/20">
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setViewMode('info')}>
                        <Info className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-7 text-xs"
                                disabled={chatStatus === 'closed'}
                            >
                                {chatStatus === 'closed' ? 'Ended' : 'End Chat'}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>End Conversation</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to end this conversation? The student will be notified and the chat will be closed.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleEndChat} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    End Chat
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredMessages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            No messages yet. Start the conversation!
                        </div>
                    ) : (
                        filteredMessages.map((msg) => {
                            // Robust alignment logic using role
                            let isMe = false;

                            if (msg.role === 'support') {
                                // Support messages (auto-reply) are "me" for admins, "them" for students
                                isMe = isAdminView;
                            } else if (msg.role === 'admin') {
                                // Admin messages are "me" for admins (if sent by me), "them" for students
                                // If I am an admin, I want to see my own messages on the right.
                                // If I am an admin viewing another admin's message, it's on the left.
                                isMe = isAdminView && msg.senderId === currentUserId;
                            } else if (msg.role === 'student') {
                                // Student messages are "me" for students, "them" for admins
                                isMe = !isAdminView;
                            } else {
                                // Fallback for legacy messages without role
                                isMe = msg.senderId === currentUserId || (isAdminView && msg.senderId === 'support');
                            }

                            return (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex w-fit max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm break-words whitespace-pre-wrap",
                                        isMe
                                            ? "ml-auto bg-primary text-primary-foreground"
                                            : "bg-muted"
                                    )}
                                >
                                    {msg.text}
                                    <span className={cn("text-[10px]", isMe ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                        {safeTimestampToDate(msg.createdAt)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            );
                        })
                    )}

                    {chatStatus === 'closed' && (
                        <div className="flex justify-center py-4">
                            <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-medium">
                                This conversation has ended
                            </span>
                        </div>
                    )}

                    <div ref={scrollRef} />
                </div>
            </ScrollArea>
            <div className="p-4 border-t bg-background">
                <form onSubmit={handleSend} className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={chatStatus === 'closed' ? "Conversation ended" : "Type a message..."}
                        className="flex-1"
                        disabled={chatStatus === 'closed'}
                    />
                    <Button type="submit" size="icon" disabled={!newMessage.trim() || chatStatus === 'closed'}>
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Send</span>
                    </Button>
                </form>
            </div>
        </div>
    );
}

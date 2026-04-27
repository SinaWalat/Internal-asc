import React, { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase/client';
import { ChatService, ChatConversation } from './chat-service';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, safeTimestampToDate } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Info } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatListProps {
    onSelectChat: (chatId: string) => void;
    selectedChatId?: string | null;
    currentUserId?: string;
    dateFilter: 'today' | '7days' | '30days' | 'custom';
    customDateRange?: { from?: Date; to?: Date };
}

function ChatListItem({ chat, isSelected, onSelect, currentUserId }: { chat: ChatConversation, isSelected: boolean, onSelect: () => void, currentUserId?: string }) {
    const { firestore } = useFirebase();
    const [displayName, setDisplayName] = useState(chat.studentName || 'Unknown Student');
    const [loadingName, setLoadingName] = useState(false);
    const [adminDetails, setAdminDetails] = useState<{ email: string; role: string; name?: string } | null>(null);
    const [loadingAdmin, setLoadingAdmin] = useState(false);

    useEffect(() => {
        const fetchProfileName = async () => {
            if (!firestore || !chat.studentId || chat.type === 'admin') return;

            // If we already have a likely real name (not "Student"), maybe skip? 
            // But user specifically said "Student" is showing, so let's always try to fetch if it looks generic or just to be safe.

            try {
                setLoadingName(true);
                const profileDoc = await getDoc(doc(firestore, 'profiles', chat.studentId));
                if (profileDoc.exists()) {
                    const data = profileDoc.data();
                    let fullName = data.fullName;

                    // If fullName is missing or generic, try to construct from first and last name
                    if (!fullName || fullName === 'Student') {
                        const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';

                        if (data.firstName && data.lastName) {
                            fullName = `${capitalize(data.firstName)} ${capitalize(data.lastName)}`;
                        } else if (data.firstName) {
                            fullName = capitalize(data.firstName);
                        }
                    }

                    if (fullName) {
                        setDisplayName(fullName);

                        // Auto-fix the chat document if the name doesn't match the profile
                        if (fullName && chat.studentName !== fullName) {
                            updateDoc(doc(firestore, 'chats', chat.id), { studentName: fullName })
                                .catch(async (err) => {
                                    console.warn("Client-side update failed, trying server-side:", err);
                                    // Fallback to server-side update
                                    try {
                                        const auth = getAuth();
                                        const currentUser = auth.currentUser;
                                        if (currentUser) {
                                            const token = await currentUser.getIdToken();
                                            await fetch('/api/admin/sync-chat-name', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    chatId: chat.id,
                                                    studentName: fullName,
                                                    idToken: token
                                                })
                                            });
                                        }
                                    } catch (apiErr) {
                                        console.error("Server-side update also failed:", apiErr);
                                    }
                                });
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching profile name:", error);
            } finally {
                setLoadingName(false);
            }
        };

        fetchProfileName();
    }, [firestore, chat.studentId, chat.type, chat.id]); // Removed chat.studentName to prevent loop/unstable dependency

    // Helper to derive role label
    const deriveRoleLabel = (role: string, permissions: string[] = []) => {
        if (role === 'global_admin') return 'Global Admin';
        return 'Admin';
    };

    useEffect(() => {
        const fetchAdminDetails = async () => {
            if (!firestore || chat.type !== 'admin' || !currentUserId || !chat.participantNames) return;

            const otherId = Object.keys(chat.participantNames).find(id => id !== currentUserId);
            if (!otherId) return;

            // Check if we already have the name in participantNames (cached)
            const cachedName = chat.participantNames[otherId];
            const cachedRole = chat.participantRoles?.[otherId];

            if (cachedName && cachedName !== 'Admin' && cachedRole) {
                // We have everything cached, no need to show loading
            } else {
                setLoadingAdmin(true);
            }

            try {
                const adminDoc = await getDoc(doc(firestore, 'admins', otherId));
                if (adminDoc.exists()) {
                    const data = adminDoc.data();
                    const derivedRole = deriveRoleLabel(data.role, data.permissions);

                    setAdminDetails({
                        email: data.email,
                        role: derivedRole, // Use derived role here
                        name: data.name
                    });

                    // Update chat document if name or role is missing/outdated
                    const needsNameUpdate = data.name && chat.participantNames[otherId] !== data.name;
                    const needsRoleUpdate = derivedRole && chat.participantRoles?.[otherId] !== derivedRole;

                    if (needsNameUpdate || needsRoleUpdate) {
                        const updates: any = {};
                        if (needsNameUpdate) {
                            updates.participantNames = { ...chat.participantNames, [otherId]: data.name };
                        }
                        if (needsRoleUpdate) {
                            updates.participantRoles = { ...chat.participantRoles, [otherId]: derivedRole };
                        }

                        updateDoc(doc(firestore, 'chats', chat.id), updates)
                            .catch(err => console.error("Failed to update chat participant details:", err));
                    }
                }
            } catch (e) {
                console.error("Error fetching admin details", e);
            } finally {
                setLoadingAdmin(false);
            }
        };
        fetchAdminDetails();
    }, [firestore, chat.type, chat.participantNames, chat.participantRoles, currentUserId, chat.id]);

    // Admin chat name logic
    const getAdminChatName = () => {
        if (chat.type === 'admin' && chat.participantNames && currentUserId) {
            const otherId = Object.keys(chat.participantNames).find(id => id !== currentUserId);
            return otherId ? chat.participantNames[otherId] : 'Unknown Admin';
        }
        return displayName;
    };

    const finalName = chat.type === 'admin' ? getAdminChatName() : displayName;

    return (
        <button
            onClick={onSelect}
            className={cn(
                "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
                isSelected && "bg-accent",
                chat.type === 'admin' && "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
            )}
        >
            <div className="flex w-full flex-col gap-1">
                <div className="flex items-center">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>{finalName[0]?.toUpperCase() || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="font-semibold flex items-center gap-2">
                            {chat.type === 'admin' ? (
                                loadingAdmin && !adminDetails ? (
                                    <Skeleton className="h-4 w-32" />
                                ) : adminDetails ? (
                                    <>
                                        <span>{adminDetails.name || adminDetails.email}</span>
                                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900">
                                            {adminDetails.role}
                                        </Badge>
                                    </>
                                ) : (
                                    // Fallback to cached data if available
                                    chat.participantRoles && chat.participantNames && currentUserId ? (
                                        (() => {
                                            const otherId = Object.keys(chat.participantNames).find(id => id !== currentUserId);
                                            if (otherId && chat.participantRoles[otherId]) {
                                                return (
                                                    <>
                                                        <span>{chat.participantNames[otherId]}</span>
                                                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900">
                                                            {chat.participantRoles[otherId]}
                                                        </Badge>
                                                    </>
                                                );
                                            }
                                            return finalName;
                                        })()
                                    ) : finalName
                                )
                            ) : (
                                finalName
                            )}
                        </div>
                    </div>
                    <div className={cn(
                        "ml-auto text-xs",
                        isSelected ? "text-foreground" : "text-muted-foreground"
                    )}>
                        {chat.lastMessageTime && safeTimestampToDate(chat.lastMessageTime)
                            ? formatDistanceToNow(safeTimestampToDate(chat.lastMessageTime)!, { addSuffix: true })
                            : ''}
                    </div>
                </div>
                <div className="line-clamp-2 text-xs text-muted-foreground w-full">
                    {chat.lastMessage?.substring(0, 300) || "No messages yet"}
                </div>
            </div>
        </button>
    );
}

export function ChatList({ onSelectChat, selectedChatId, currentUserId, dateFilter, customDateRange }: ChatListProps) {
    const { firestore } = useFirebase();
    const [chats, setChats] = useState<ChatConversation[]>([]);

    useEffect(() => {
        if (!firestore) return;

        const unsubscribe = ChatService.subscribeToConversations(firestore, (updatedChats) => {
            setChats(updatedChats);
        });

        return () => unsubscribe();
    }, [firestore]);

    const filteredChats = chats.filter(chat => {
        if (!chat.lastMessageTime) return false;
        const chatDate = safeTimestampToDate(chat.lastMessageTime);
        if (!chatDate) return false;

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (dateFilter) {
            case 'today':
                return chatDate >= startOfToday;
            case '7days':
                const sevenDaysAgo = new Date(now);
                sevenDaysAgo.setDate(now.getDate() - 7);
                return chatDate >= sevenDaysAgo;
            case '30days':
                const thirtyDaysAgo = new Date(now);
                thirtyDaysAgo.setDate(now.getDate() - 30);
                return chatDate >= thirtyDaysAgo;
            case 'custom':
                if (customDateRange?.from) {
                    const from = new Date(customDateRange.from);
                    from.setHours(0, 0, 0, 0);
                    if (chatDate < from) return false;
                }
                if (customDateRange?.to) {
                    const to = new Date(customDateRange.to);
                    to.setHours(23, 59, 59, 999);
                    if (chatDate > to) return false;
                }
                return true;
            default:
                return true;
        }
    });

    return (
        <ScrollArea className="h-full">
            <div className="flex flex-col gap-1 p-2">
                {filteredChats.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8 text-sm">
                        No conversations found for this period.
                    </div>
                ) : (
                    filteredChats.map((chat) => (
                        <ChatListItem
                            key={chat.id}
                            chat={chat}
                            isSelected={selectedChatId === chat.id}
                            onSelect={() => onSelectChat(chat.id)}
                            currentUserId={currentUserId}
                        />
                    ))
                )}
            </div>
        </ScrollArea>
    );
}

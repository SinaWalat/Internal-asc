'use client';

import React, { useState } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase/client';
import { collection } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Plus, User } from 'lucide-react';
import { ChatService } from './chat-service';

interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: string;
    permissions?: string[];
}

interface NewChatDialogProps {
    currentUserId: string;
    currentUserName: string;
    onChatCreated: (chatId: string) => void;
}

export function NewChatDialog({ currentUserId, currentUserName, onChatCreated }: NewChatDialogProps) {
    const { firestore } = useFirebase();
    const [open, setOpen] = useState(false);
    const [loadingChat, setLoadingChat] = useState(false);

    const adminsQuery = useMemoFirebase(
        () => firestore ? collection(firestore, 'admins') : null,
        [firestore]
    );

    const { data: allAdmins, isLoading: loadingAdmins } = useCollection<AdminUser>(adminsQuery);

    const admins = allAdmins?.filter(admin => admin.id !== currentUserId) || [];

    const handleStartChat = async (otherAdmin: AdminUser) => {
        if (!firestore) return;
        setLoadingChat(true);
        try {
            const chatId = await ChatService.startAdminConversation(
                firestore,
                currentUserId,
                currentUserName,
                otherAdmin.id,
                otherAdmin.name || otherAdmin.email
            );
            onChatCreated(chatId);
            setOpen(false);
        } catch (error) {
            console.error("Error starting chat:", error);
        } finally {
            setLoadingChat(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="icon" variant="ghost">
                    <Plus className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Message</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-2 mt-4">
                    {admins.map(admin => (
                        <button
                            key={admin.id}
                            onClick={() => handleStartChat(admin)}
                            disabled={loadingChat}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                        >
                            <Avatar>
                                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-1">
                                <span className="font-medium">{admin.name || admin.email}</span>
                                <div className="flex flex-wrap gap-1 items-center">
                                    <span className="text-xs text-muted-foreground">
                                        {admin.role === 'global_admin' ? 'Global Admin' : 'Admin'}
                                    </span>
                                    {admin.permissions?.map(perm => (
                                        <Badge key={perm} variant="secondary" className="text-[10px] px-1 py-0 h-4 capitalize">
                                            {perm.replace(/manage_/g, '').replace(/_/g, ' ')}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </button>
                    ))}
                    {admins.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">No other admins found.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

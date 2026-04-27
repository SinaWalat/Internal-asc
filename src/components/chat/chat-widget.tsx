import React, { useState, useEffect } from 'react';
import { useFirebase, useUser } from '@/firebase/client';
import { ChatService } from './chat-service';
import { ChatWindow } from './chat-window';
import { Button } from '@/components/ui/button';
import { MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function ChatWidget() {
    const { user } = useUser();
    const { firestore } = useFirebase();
    const [isOpen, setIsOpen] = useState(false);
    const [chatId, setChatId] = useState<string | null>(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const [loading, setLoading] = useState(false);

    // Only check for EXISTING chat on mount/open, don't create one
    useEffect(() => {
        if (!user || !firestore || !isOpen) return;

        // We could check if a chat ALREADY exists here, but for now we'll just let the user initiate
        // If you wanted to restore previous session automatically:
        // ChatService.getExistingChat(user.uid).then(id => setChatId(id));
    }, [isOpen, user, firestore]);

    const handleStartChat = async () => {
        if (!user || !firestore) return;
        setLoading(true);
        try {
            const id = await ChatService.startConversation(
                firestore,
                user.uid,
                user.displayName || 'Student',
                user.email || ''
            );
            setChatId(id);
        } catch (error) {
            console.error("Failed to start chat:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
            {isOpen && (
                <Card className={cn(
                    "w-[350px] shadow-xl transition-all duration-300 overflow-hidden flex flex-col",
                    isMinimized ? "h-14" : "h-[500px]"
                )}>
                    {/* Header */}
                    <div className="bg-primary text-primary-foreground p-3 flex items-center justify-between shrink-0">
                        <div className="font-semibold flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            Support Chat
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
                                onClick={() => setIsMinimized(!isMinimized)}
                            >
                                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>

                    {/* Content */}
                    {!isMinimized && (
                        <>
                            {chatId ? (
                                <ChatWindow
                                    chatId={chatId}
                                    currentUserId={user.uid}
                                    currentUserName={user.displayName || 'Student'}
                                    className="border-0 rounded-none flex-1"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center flex-1 p-6 text-center gap-4">
                                    <div className="bg-primary/10 p-4 rounded-full">
                                        <MessageCircle className="h-8 w-8 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">How can we help?</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Our support team is here to assist you with any questions.
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handleStartChat}
                                        disabled={loading}
                                        className="w-full"
                                    >
                                        {loading ? "Starting..." : "Talk to Agent"}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </Card>
            )}

            {!isOpen && (
                <Button
                    size="lg"
                    className="h-14 w-14 rounded-full shadow-lg"
                    onClick={() => setIsOpen(true)}
                >
                    <MessageCircle className="h-6 w-6" />
                </Button>
            )}
        </div>
    );
}

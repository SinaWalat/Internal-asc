'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useFirestore } from '@/firebase/client';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Notification {
    id: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: any;
    type?: 'info' | 'warning' | 'success' | 'error';
    link?: string;
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const firestore = useFirestore();
    const router = useRouter();

    useEffect(() => {
        if (!firestore) return;

        // Query for notifications
        // Ideally, we might want to filter by user or role, but for now we'll fetch all admin notifications
        // Assuming there's a 'notifications' collection
        const q = query(
            collection(firestore, 'notifications'),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Notification));

            setNotifications(items);
            setUnreadCount(items.filter(n => !n.read).length);
        }, (error) => {
            console.error("Error fetching notifications:", error);
        });

        return () => unsubscribe();
    }, [firestore]);

    const markAsRead = async (id: string) => {
        if (!firestore) return;
        try {
            const docRef = doc(firestore, 'notifications', id);
            await updateDoc(docRef, { read: true });
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        if (!firestore) return;
        try {
            const batch = writeBatch(firestore);
            notifications.filter(n => !n.read).forEach(n => {
                const docRef = doc(firestore, 'notifications', n.id);
                batch.update(docRef, { read: true });
            });
            await batch.commit();
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
        if (notification.link) {
            router.push(notification.link);
            setIsOpen(false);
        }
    };

    const getIcon = (type?: string) => {
        switch (type) {
            case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-background" />
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold leading-none">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 text-xs text-muted-foreground hover:text-primary"
                            onClick={markAllAsRead}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                                        !notification.read && "bg-muted/20"
                                    )}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="mt-1 shrink-0">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className={cn("text-sm font-medium leading-none", !notification.read && "font-semibold")}>
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {notification.createdAt?.seconds
                                                ? formatDistanceToNow(new Date(notification.createdAt.seconds * 1000), { addSuffix: true })
                                                : 'Just now'}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <div className="shrink-0">
                                            <div className="h-2 w-2 rounded-full bg-blue-600" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}

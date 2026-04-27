'use client';

import * as React from 'react';
import { Search, Command } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SearchItem {
    title: string;
    href: string;
    icon?: React.ReactNode;
    description?: string;
}

const searchItems: SearchItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
        description: 'View analytics and statistics'
    },
    {
        title: 'Messages',
        href: '/admin/messages',
        description: 'View student messages'
    },
    {
        title: 'Universities',
        href: '/admin/universities',
        description: 'Manage universities'
    },
    {
        title: 'Missing Cards',
        href: '/admin/missing-cards',
        description: 'Track missing card reports'
    },
    {
        title: 'Live Support',
        href: '/admin/chat',
        description: 'Chat with students'
    },
    {
        title: 'KYC Verification',
        href: '/admin/kyc-verification',
        description: 'Verify student identities'
    },
    {
        title: 'Payments',
        href: '/admin/payments',
        description: 'View payment records'
    },
    {
        title: 'Card Designer',
        href: '/admin/card-designer',
        description: 'Design ID cards'
    },
    {
        title: 'Admins',
        href: '/admin/admins',
        description: 'Manage admin users'
    },
    {
        title: 'Audit Logs',
        href: '/admin/audit-logs',
        description: 'View system activity'
    },
];

export function GlobalSearch() {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const handleSelect = (href: string) => {
        setOpen(false);
        router.push(href);
    };

    return (
        <>
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search pages..."
                    className="pl-9 pr-20 h-10 border-muted-foreground/20 focus-visible:ring-primary"
                    style={{ background: 'none' }}
                    onClick={() => setOpen(true)}
                    readOnly
                />
                <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </div>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Type to search pages..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup heading="Pages">
                        {searchItems.map((item) => (
                            <CommandItem
                                key={item.href}
                                onSelect={() => handleSelect(item.href)}
                                className="cursor-pointer"
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium">{item.title}</span>
                                    {item.description && (
                                        <span className="text-xs text-muted-foreground">{item.description}</span>
                                    )}
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
}

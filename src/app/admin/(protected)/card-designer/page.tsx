'use client';

import { useAuthProtection } from '@/hooks/use-auth-protection';
import CardDesignerDashboard from '@/components/admin/card-designer-dashboard';
import { Button } from '@/components/ui/button';
import { useFirebase, useUser } from '@/firebase/client';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';

export default function CardDesignerPage() {
    const { isAdmin, isCheckingAdmin } = useAuthProtection();
    const { firestore } = useFirebase();
    const { user } = useUser();
    const [isFixing, setIsFixing] = useState(false);

    const handleFixPermissions = async () => {
        if (!firestore || !user) return;
        setIsFixing(true);
        try {
            await setDoc(doc(firestore, 'admins', user.uid), {
                email: user.email,
                name: user.displayName || 'Admin',
                role: 'global_admin',
                createdAt: new Date()
            });
            // Force reload to re-check permissions
            window.location.reload();
        } catch (error) {
            console.error('Error fixing permissions:', error);
            alert('Failed to update permissions');
            setIsFixing(false);
        }
    };

    if (isCheckingAdmin) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-muted-foreground">Verifying permissions...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="rounded-full bg-destructive/10 p-4 text-destructive">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-8 w-8"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">Access Denied</h2>
                        <p className="text-muted-foreground">You do not have permission to view this page.</p>
                        <p className="text-xs text-muted-foreground mt-2">Current User: {user?.email}</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleFixPermissions}
                        disabled={isFixing}
                    >
                        {isFixing ? 'Updating...' : 'Fix Permissions (Dev)'}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <CardDesignerDashboard />
        </div>
    );
}

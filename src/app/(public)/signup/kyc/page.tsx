'use client';

import { KYCForm } from '@/components/kyc-form';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase/client';
import { LogOut, Wind } from 'lucide-react';
import { signOut } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function KYCPage() {
    const auth = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        if (auth) {
            await signOut(auth);
            router.push('/login');
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
            <div className="absolute top-4 right-4">
                <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                        <Wind className="h-6 w-6 text-primary" />
                        <span>Acme Inc.</span>
                    </Link>
                </div>
                <KYCForm />
            </div>
        </div>
    );
}

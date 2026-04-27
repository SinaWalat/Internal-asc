
'use client';

import { ProfileForm } from '@/components/profile-form';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase/client';
import { LogOut, Wind } from 'lucide-react';
import { signOut } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CompleteProfilePage() {
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-white antialiased">
      {/* Premium subtle background accents */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-50/50 via-white to-white" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-gray-50 via-white to-white" />

      <div className="absolute top-4 right-4 z-50">
        <Button variant="outline" onClick={handleLogout} className="border-gray-200/60 bg-white/50 backdrop-blur-md text-gray-700 hover:text-gray-900 hover:bg-gray-50/80 rounded-xl transition-all shadow-sm">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      <div className="relative z-10 w-full max-w-[500px] px-4 py-8">
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex flex-col items-center gap-4 transition-transform hover:scale-105">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center ring-1 ring-orange-200/50 shadow-sm shadow-orange-100">
              <Wind className="h-7 w-7 text-orange-500" />
            </div>
            <span className="font-semibold text-2xl tracking-tight text-gray-900">Acme Inc.</span>
          </Link>
        </div>
        
        <ProfileForm />
        
        <div className="mt-10 text-center text-xs text-gray-400/80 font-medium tracking-wide uppercase">
          <p>© 2024 Acme Inc. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

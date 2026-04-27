
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useFirebase, useUser } from '@/firebase/client';
import { doc, getDoc } from 'firebase/firestore';

/**
 * A hook to check if the current user is an admin and handle incomplete profiles.
 * It does NOT perform general redirection for unauthenticated users.
 * @returns { a boolean `isAdmin` and a loading state `isCheckingAdmin` }
 */
export function useAuthProtection() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const pathname = usePathname();

  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  useEffect(() => {
    // Don't do anything until the user's auth state is resolved.
    if (isUserLoading) {
      return;
    }

    // If there is no user, they are not an admin. Stop checking.
    if (!user) {
      setIsAdmin(false);
      setIsCheckingAdmin(false);
      return;
    }

    // If the user is authenticated, check their status in Firestore.
    const checkAdminStatus = async () => {
      if (!firestore || !user) return;
      setIsCheckingAdmin(true);

      try {
        const adminDocRef = doc(firestore, 'admins', user.uid);
        const adminDoc = await getDoc(adminDocRef);

        if (adminDoc.exists()) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          // If not an admin, it's a student. Check for incomplete student profile.
          const profileDocRef = doc(firestore, 'profiles', user.uid);
          const profileDoc = await getDoc(profileDocRef);

          // If the profile exists but university is missing, and we are not already on the profile page, redirect.
          if (profileDoc.exists() && !profileDoc.data().university && pathname !== '/signup/profile') {
            router.replace('/signup/profile');
          }
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false); // Assume not an admin on error
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    checkAdminStatus();

  }, [user, isUserLoading, firestore, router, pathname]);

  return { user, isAdmin, isCheckingAdmin };
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useFirebase, useUser } from '@/firebase/client';
import { doc, getDoc } from 'firebase/firestore';

/**
 * A hook to check if the current user is a student.
 * If the user is an admin, it redirects to the admin dashboard.
 * If the user is not authenticated, it redirects to login.
 */
export function useStudentProtection() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const router = useRouter();
    const pathname = usePathname();

    const [isStudent, setIsStudent] = useState<boolean>(false);
    const [isCheckingStudent, setIsCheckingStudent] = useState(true);

    useEffect(() => {
        // Don't do anything until the user's auth state is resolved.
        if (isUserLoading) {
            return;
        }

        // If there is no user, redirect to login
        if (!user) {
            setIsStudent(false);
            setIsCheckingStudent(false);
            router.replace('/login');
            return;
        }

        // If the user is authenticated, check their status in Firestore.
        const checkStudentStatus = async () => {
            if (!firestore || !user) return;
            setIsCheckingStudent(true);

            try {
                // First, check if they are an admin
                const adminDocRef = doc(firestore, 'admins', user.uid);
                const adminDoc = await getDoc(adminDocRef);

                if (adminDoc.exists()) {
                    // User is an admin, redirect to admin dashboard
                    router.replace('/admin/dashboard');
                    return;
                }

                // If not admin, check if they are a student (profile exists)
                const profileDocRef = doc(firestore, 'profiles', user.uid);
                const profileDoc = await getDoc(profileDocRef);

                if (profileDoc.exists()) {
                    setIsStudent(true);
                    // Check for incomplete profile
                    if (!profileDoc.data().university && pathname !== '/student/dashboard') {
                        router.replace('/student/dashboard');
                    }
                } else {
                    // Neither admin nor student (shouldn't happen ideally, but maybe new user)
                    // Treat as potential student or redirect to signup?
                    // For now, let's assume they need to complete profile
                    router.replace('/student/dashboard');
                }

            } catch (error) {
                console.error("Error checking student status:", error);
                setIsStudent(false);
            } finally {
                setIsCheckingStudent(false);
            }
        };

        checkStudentStatus();

    }, [user, isUserLoading, firestore, router, pathname]);

    return { user, isStudent, isCheckingStudent };
}

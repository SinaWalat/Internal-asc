import { useState, useEffect } from 'react';
import { doc, DocumentData } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase/client';

interface CacheItem<T> {
    data: T;
    timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// In-memory cache
const memoryCache = new Map<string, CacheItem<any>>();

// LocalStorage helpers
function getFromLocalStorage<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;

    try {
        const stored = localStorage.getItem(key);
        if (!stored) return null;

        const parsed: CacheItem<T> = JSON.parse(stored);

        // Check if cache is still valid
        if (Date.now() - parsed.timestamp < CACHE_DURATION) {
            return parsed.data;
        } else {
            localStorage.removeItem(key);
            return null;
        }
    } catch (e) {
        console.error('Error reading from localStorage:', e);
        return null;
    }
}

function saveToLocalStorage<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return;

    try {
        const item: CacheItem<T> = {
            data,
            timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }
}

/**
 * Hook for student's KYC data with aggressive caching
 */
export function useStudentKYC() {
    const { user } = useUser();
    const firestore = useFirestore();
    const cacheKey = `student_kyc_${user?.uid}`;

    const [data, setData] = useState<any>(() => {
        // Try memory cache first
        if (memoryCache.has(cacheKey)) {
            return memoryCache.get(cacheKey)!.data;
        }
        // Try localStorage
        return getFromLocalStorage(cacheKey);
    });

    // FIXED: Only set loading to true if we don't have cached data
    const [loading, setLoading] = useState(() => !data);

    useEffect(() => {
        if (!user || !firestore) return;

        // If we already have data, we're not loading
        if (data) {
            setLoading(false);
        }

        // Set up real-time listener
        const kycRef = doc(firestore, 'KYC_Verifications', user.uid);

        const unsubscribe = (async () => {
            const { onSnapshot } = await import('firebase/firestore');
            return onSnapshot(kycRef, (doc) => {
                if (doc.exists()) {
                    const kycData = doc.data();

                    // Update all caches
                    memoryCache.set(cacheKey, { data: kycData, timestamp: Date.now() });
                    saveToLocalStorage(cacheKey, kycData);
                    setData(kycData);
                } else {
                    setData(null);
                }
                setLoading(false);
            }, (error) => {
                console.error('Error listening to KYC:', error);
                setLoading(false);
            });
        })();

        return () => {
            unsubscribe.then(unsub => unsub());
        };
    }, [user, firestore, cacheKey]);

    return { data, loading };
}

/**
 * Hook for student's profile data with aggressive caching
 */
export function useStudentProfile() {
    const { user } = useUser();
    const firestore = useFirestore();
    const cacheKey = `student_profile_${user?.uid}`;

    const [data, setData] = useState<any>(() => {
        // Try memory cache first
        if (memoryCache.has(cacheKey)) {
            return memoryCache.get(cacheKey)!.data;
        }
        // Try localStorage
        return getFromLocalStorage(cacheKey);
    });

    // FIXED: Only set loading to true if we don't have cached data
    const [loading, setLoading] = useState(() => !data);

    useEffect(() => {
        if (!user || !firestore) return;

        // Set up real-time listener
        const profileRef = doc(firestore, 'profiles', user.uid);

        const unsubscribe = (async () => {
            const { onSnapshot } = await import('firebase/firestore');
            return onSnapshot(profileRef, (doc) => {
                if (doc.exists()) {
                    const profileData = doc.data();

                    // Update all caches
                    memoryCache.set(cacheKey, { data: profileData, timestamp: Date.now() });
                    saveToLocalStorage(cacheKey, profileData);
                    setData(profileData);
                }
                setLoading(false);
            }, (error) => {
                console.error('Error listening to profile:', error);
                setLoading(false);
            });
        })();

        return () => {
            unsubscribe.then(unsub => unsub());
        };
    }, [user, firestore, cacheKey]);

    return { data, loading };
}

/**
 * Hook for student's missing card reports with caching
 */
export function useStudentMissingCards() {
    const { user } = useUser();
    const firestore = useFirestore();
    const cacheKey = `student_missing_cards_${user?.uid}`;

    const [data, setData] = useState<any[]>(() => {
        // Try memory cache first
        if (memoryCache.has(cacheKey)) {
            return memoryCache.get(cacheKey)!.data;
        }
        // Try localStorage
        return getFromLocalStorage(cacheKey) || [];
    });

    // FIXED: Only set loading to true if we don't have cached data
    const [loading, setLoading] = useState(() => data.length === 0);

    useEffect(() => {
        if (!user || !firestore) return;

        // Set up real-time listener
        const setupListener = async () => {
            const { collection, query, where, orderBy, onSnapshot } = await import('firebase/firestore');

            const q = query(
                collection(firestore, 'missing_cards'),
                where('uid', '==', user.uid),
                orderBy('createdAt', 'desc')
            );

            return onSnapshot(q, (snapshot) => {
                const reports = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

                // Update all caches
                memoryCache.set(cacheKey, { data: reports, timestamp: Date.now() });
                saveToLocalStorage(cacheKey, reports);
                setData(reports);
                setLoading(false);
            }, (error) => {
                console.error('Error listening to missing cards:', error);
                setLoading(false);
            });
        };

        const unsubscribe = setupListener();

        return () => {
            unsubscribe.then(unsub => unsub());
        };
    }, [user, firestore, cacheKey]);

    return { data, loading };
}

/**
 * Combined hook for dashboard data
 */
export function useStudentDashboardData() {
    const kyc = useStudentKYC();
    const profile = useStudentProfile();

    return {
        kycData: kyc.data,
        profileData: profile.data,
        loading: kyc.loading || profile.loading
    };
}

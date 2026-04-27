import { useState, useEffect } from 'react';
import { Query, DocumentData } from 'firebase/firestore';
import { firestoreCache } from '@/lib/firestore-cache';

export function useCachedData<T>(
    key: string,
    query: Query<DocumentData> | null
) {
    const [data, setData] = useState<T | null>(() => {
        // Initialize with cached data if available
        return firestoreCache.get<T>(key);
    });
    const [loading, setLoading] = useState(!data);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!query) return;

        setLoading(true);

        // Subscribe to cache updates
        const unsubscribe = firestoreCache.subscribe<T>(
            key,
            query,
            (newData) => {
                setData(newData);
                setLoading(false);
            },
            (err) => {
                setError(err);
                setLoading(false);
            }
        );

        return () => {
            unsubscribe();
        };
    }, [key, query]); // Re-subscribe if key or query changes

    return { data, loading, error };
}

import {
    onSnapshot,
    Query,
    DocumentData,
    QuerySnapshot,
    SnapshotOptions
} from 'firebase/firestore';

interface CacheItem<T> {
    data: T;
    timestamp: number;
}

type ListenerUnsubscribe = () => void;

class FirestoreCache {
    private static instance: FirestoreCache;
    private memoryCache: Map<string, CacheItem<any>>;
    private listeners: Map<string, ListenerUnsubscribe>;
    private activeSubscribers: Map<string, number>;

    private constructor() {
        this.memoryCache = new Map();
        this.listeners = new Map();
        this.activeSubscribers = new Map();
    }

    public static getInstance(): FirestoreCache {
        if (!FirestoreCache.instance) {
            FirestoreCache.instance = new FirestoreCache();
        }
        return FirestoreCache.instance;
    }

    /**
     * Get data from cache (Memory -> LocalStorage)
     */
    public get<T>(key: string): T | null {
        // 1. Check Memory
        if (this.memoryCache.has(key)) {
            // console.log(`[Cache] Memory hit for ${key}`);
            return this.memoryCache.get(key)!.data;
        }

        // 2. Check LocalStorage
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(key);
            if (stored) {
                try {
                    const parsed: CacheItem<T> = JSON.parse(stored);
                    // Hydrate memory cache
                    this.memoryCache.set(key, parsed);
                    // console.log(`[Cache] LocalStorage hit for ${key}`);
                    return parsed.data;
                } catch (e) {
                    console.error(`[Cache] Failed to parse localStorage for ${key}`, e);
                    localStorage.removeItem(key);
                }
            }
        }

        return null;
    }

    /**
     * Set data to cache (Memory -> LocalStorage)
     */
    public set<T>(key: string, data: T): void {
        const item: CacheItem<T> = {
            data,
            timestamp: Date.now(),
        };

        // 1. Update Memory
        this.memoryCache.set(key, item);

        // 2. Update LocalStorage
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(key, JSON.stringify(item));
            } catch (e) {
                console.error(`[Cache] Failed to save to localStorage for ${key}`, e);
            }
        }
    }

    /**
     * Subscribe to a Firestore Query
     * - Returns cached data immediately if available
     * - Sets up onSnapshot listener if not already active
     * - Updates cache on changes
     */
    public subscribe<T>(
        key: string,
        query: Query<DocumentData>,
        onUpdate: (data: T) => void,
        onError?: (error: Error) => void
    ): () => void {
        // Increment subscriber count
        const currentCount = this.activeSubscribers.get(key) || 0;
        this.activeSubscribers.set(key, currentCount + 1);

        // If listener doesn't exist, create it
        if (!this.listeners.has(key)) {
            // console.log(`[Cache] Setting up Firestore listener for ${key}`);

            const unsubscribe = onSnapshot(
                query,
                (snapshot: QuerySnapshot<DocumentData>) => {
                    const data = snapshot.docs.map((doc) => {
                        const docData = doc.data();
                        return {
                            id: doc.id,
                            ...docData,
                            // Serialize timestamps for storage
                            // We do this here to ensure consistency across memory/localstorage
                        };
                    }) as unknown as T;

                    // Update Cache
                    this.set(key, data);

                    // Notify current subscriber (and others will get it via their own hooks if we implemented an event emitter, 
                    // but for now, this callback targets the specific hook instance. 
                    // WAIT: The architecture needs to broadcast updates to all hooks using this key.
                    // Since we are passing `onUpdate` from a specific hook, we need a way to notify ALL hooks for this key.
                    // However, `onSnapshot` is one-per-query in this design.

                    // REVISION: To keep it simple and robust:
                    // We will rely on the fact that `onSnapshot` calls the callback. 
                    // But wait, if we have multiple components using the same key, we want them to share the listener.
                    // The current design: `subscribe` takes `onUpdate`. If we have 2 components, we call `subscribe` twice.
                    // If we only create ONE `onSnapshot`, we can only call ONE `onUpdate`.

                    // FIX: We need an Event Emitter or a Set of callbacks for each key.
                    this.notifySubscribers(key, data);
                },
                (error) => {
                    console.error(`[Cache] Firestore error for ${key}`, error);
                    if (onError) onError(error);
                }
            );

            this.listeners.set(key, unsubscribe);
        }

        // Add this callback to a subscriber list? 
        // For simplicity in this iteration, let's assume the `useCachedData` hook handles the local state update.
        // We need to register the callback.
        this.addCallback(key, onUpdate);

        // Return unsubscribe function
        return () => {
            this.removeCallback(key, onUpdate);
            const count = this.activeSubscribers.get(key) || 0;
            const newCount = Math.max(0, count - 1);
            this.activeSubscribers.set(key, newCount);

            if (newCount === 0) {
                // No more subscribers, kill the listener
                // console.log(`[Cache] Removing Firestore listener for ${key}`);
                const unsubscribe = this.listeners.get(key);
                if (unsubscribe) {
                    unsubscribe();
                    this.listeners.delete(key);
                }
            }
        };
    }

    // --- Event System for Broadcasting Updates ---
    private callbacks: Map<string, Set<(data: any) => void>> = new Map();

    private addCallback(key: string, callback: (data: any) => void) {
        if (!this.callbacks.has(key)) {
            this.callbacks.set(key, new Set());
        }
        this.callbacks.get(key)!.add(callback);
    }

    private removeCallback(key: string, callback: (data: any) => void) {
        if (this.callbacks.has(key)) {
            this.callbacks.get(key)!.delete(callback);
        }
    }

    private notifySubscribers(key: string, data: any) {
        if (this.callbacks.has(key)) {
            this.callbacks.get(key)!.forEach((callback) => callback(data));
        }
    }
}

export const firestoreCache = FirestoreCache.getInstance();

'use client';

import React, { useState } from 'react';
import { useFirebase } from '@/firebase/client';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function MigrationPage() {
    const { firestore } = useFirebase();
    const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
    const [logs, setLogs] = useState<string[]>([]);
    const [count, setCount] = useState(0);

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

    const runMigration = async () => {
        if (!firestore) return;
        setStatus('running');
        setLogs([]);
        setCount(0);

        try {
            addLog('Starting migration...');

            // 1. Fetch all reprint requests
            const reprintsRef = collection(firestore, 'reprint_requests');
            const snapshot = await getDocs(reprintsRef);

            addLog(`Found ${snapshot.size} reprint requests.`);

            let migratedCount = 0;

            for (const docSnap of snapshot.docs) {
                const data = docSnap.data();
                const reprintId = docSnap.id;
                const paymentId = data.paymentId || `migrated_${reprintId}`;

                addLog(`Processing reprint ${reprintId}...`);

                // Check if payment already exists to avoid overwriting (optional, but safer)
                const paymentRef = doc(firestore, 'payments', paymentId);
                const paymentSnap = await getDoc(paymentRef);

                if (paymentSnap.exists()) {
                    addLog(`Payment ${paymentId} already exists. Skipping.`);
                    continue;
                }

                // Create payment record
                await setDoc(paymentRef, {
                    paymentId: paymentId,
                    userId: data.studentId || data.uid || 'unknown',
                    userEmail: data.email || 'unknown',
                    userName: data.studentName || 'unknown',
                    amount: data.amount || 25000,
                    currency: 'IQD',
                    type: 'REPRINT',
                    status: 'PAID', // Assuming existing reprints are paid
                    provider: 'FIB',
                    createdAt: data.submittedAt || data.createdAt || new Date(),
                    metadata: {
                        reprintId: reprintId,
                        migrated: true
                    }
                });

                addLog(`Migrated ${reprintId} to payments/${paymentId}`);
                migratedCount++;
            }

            setCount(migratedCount);
            setStatus('completed');
            addLog(`Migration completed. ${migratedCount} records created.`);

        } catch (error: any) {
            console.error('Migration failed:', error);
            addLog(`Error: ${error.message}`);
            setStatus('error');
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Data Migration: Reprints to Payments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        This tool will scan the <code>reprint_requests</code> collection and create corresponding records in the <code>payments</code> collection.
                    </p>

                    <div className="flex items-center gap-4">
                        <Button
                            onClick={runMigration}
                            disabled={status === 'running'}
                        >
                            {status === 'running' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Start Migration
                        </Button>

                        {status === 'completed' && (
                            <div className="flex items-center text-green-600">
                                <CheckCircle className="mr-2 h-5 w-5" />
                                Done ({count} records)
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="flex items-center text-red-600">
                                <AlertCircle className="mr-2 h-5 w-5" />
                                Failed
                            </div>
                        )}
                    </div>

                    <div className="bg-muted p-4 rounded-md h-64 overflow-y-auto font-mono text-xs">
                        {logs.length === 0 ? (
                            <span className="text-muted-foreground">Ready to start...</span>
                        ) : (
                            logs.map((log, i) => <div key={i}>{log}</div>)
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

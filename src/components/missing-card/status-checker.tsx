'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, CheckCircle, Clock, PackageCheck, CreditCard, RefreshCw } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase/client';
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PaymentData {
    paymentId: string;
    qrCode: string;
    readableCode: string;
    personalAppLink: string;
}

export function StatusChecker({
    studentId,
    initialStatus = null
}: {
    studentId?: string;
    initialStatus?: any;
}) {
    const { user } = useUser();
    const { toast } = useToast();
    const [ticketCode, setTicketCode] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [status, setStatus] = useState<{
        id: string;
        status: string;
        studentName: string;
        updatedAt: string;
        adminMessage?: string;
        studentId: string;
        email: string;
        ticketCode: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const firestore = useFirestore();
    const initialStatusRef = useRef(initialStatus);

    // Payment State
    const [showPayment, setShowPayment] = useState(false);
    const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<'UNPAID' | 'PAID' | 'DECLINED'>('UNPAID');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [hasPaidReprint, setHasPaidReprint] = useState(false);

    // Helper to check reprint status
    const checkReprint = async (ticketId: string) => {
        try {
            const q = query(
                collection(firestore, 'reprint_requests'),
                where('originalTicketId', '==', ticketId)
            );
            const snapshot = await getDocs(q);
            return !snapshot.empty;
        } catch (error) {
            console.error("Error checking reprint status:", error);
            return false;
        }
    };

    // Define interface for the report data
    interface MissingCardReport {
        id: string;
        status: string;
        studentName: string;
        updatedAt: any;
        adminMessage?: string;
        studentId: string;
        email: string;
        ticketCode: string;
        createdAt?: any;
    }

    useEffect(() => {
        if (!firestore) return;

        // If we have initialStatus from props, use it but check reprint first
        if (initialStatus) {
            const handleInitialStatus = async () => {
                setIsChecking(true);
                try {
                    const isReprintPaid = await checkReprint(initialStatus.id);

                    if (isReprintPaid) {
                        setHasPaidReprint(true);
                        setPaymentStatus('PAID');
                    } else {
                        setHasPaidReprint(false);
                    }

                    setStatus(initialStatus);
                    setTicketCode(initialStatus.ticketCode);
                } catch (e) {
                    console.error("Error checking reprint status:", e);
                    setStatus(initialStatus);
                    setTicketCode(initialStatus.ticketCode);
                } finally {
                    setIsChecking(false);
                }
            };
            handleInitialStatus();
            return;
        }

        if (!studentId) return;

        setIsChecking(true);

        // Create the query
        const q = query(
            collection(firestore, 'missing_cards'),
            where('uid', '==', studentId),
        );

        // Set up the real-time listener
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            try {
                if (!snapshot.empty) {
                    const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MissingCardReport));
                    docs.sort((a, b) => {
                        const timeA = a.createdAt?.toMillis() || 0;
                        const timeB = b.createdAt?.toMillis() || 0;
                        return timeB - timeA;
                    });

                    const latest = docs[0];

                    // Check reprint status BEFORE setting state
                    const isReprintPaid = await checkReprint(latest.id);

                    if (isReprintPaid) {
                        setHasPaidReprint(true);
                        setPaymentStatus('PAID');
                    } else {
                        setHasPaidReprint(false);
                    }

                    setStatus({
                        id: latest.id,
                        status: latest.status,
                        studentName: latest.studentName,
                        updatedAt: latest.updatedAt?.toDate().toISOString(),
                        adminMessage: latest.adminMessage,
                        studentId: latest.studentId,
                        email: latest.email,
                        ticketCode: latest.ticketCode
                    });
                    setTicketCode(latest.ticketCode);
                } else {
                    // Handle case where no documents are found if necessary
                    // For now, we might want to clear status or do nothing
                }
            } catch (e) {
                console.error("Error processing real-time update:", e);
            } finally {
                setIsChecking(false);
            }
        }, (error: any) => {
            console.error("Error in real-time listener:", error);
            setIsChecking(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();

    }, [studentId, firestore, initialStatus]);

    // Removed separate useEffect for checkReprintStatus

    // Removed handleCheck - no longer needed since this is only for authenticated users

    const initiateReprint = async () => {
        setShowPayment(true);
        setIsProcessingPayment(true);
        try {
            const res = await fetch('/api/fib/payment', { method: 'POST' });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setPaymentData(data);
        } catch (error) {
            console.error('Error creating payment:', error);
            toast({
                variant: 'destructive',
                title: 'Payment Error',
                description: 'Could not initialize payment. Please try again.',
            });
            setShowPayment(false);
        } finally {
            setIsProcessingPayment(false);
        }
    };

    // Poll payment status
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (showPayment && paymentData && paymentStatus !== 'PAID') {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/fib/status/${paymentData.paymentId}`);
                    const data = await res.json();
                    if (data.status === 'PAID') {
                        setPaymentStatus('PAID');
                        await handlePaymentSuccess(paymentData.paymentId);
                        clearInterval(interval);
                    } else if (data.status === 'DECLINED') {
                        setPaymentStatus('DECLINED');
                        toast({
                            variant: 'destructive',
                            title: 'Payment Declined',
                            description: 'The payment was declined.',
                        });
                        clearInterval(interval);
                    }
                } catch (error) {
                    console.error('Error checking status:', error);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [showPayment, paymentData, paymentStatus]);

    const handlePaymentSuccess = async (paymentId: string) => {
        if (!status || !firestore) return;

        try {
            // Record the reprint request
            await addDoc(collection(firestore, 'reprint_requests'), {
                studentId: status.studentId,
                studentName: status.studentName,
                email: status.email,
                originalTicketId: status.id,
                paymentId: paymentId,
                amount: 25000,
                status: 'paid',
                submittedAt: serverTimestamp(),
                type: 'reprint'
            });

            // Create payment record in unified collection
            const paymentRef = doc(firestore, 'payments', paymentId);
            await setDoc(paymentRef, {
                paymentId: paymentId,
                userId: status.studentId, // Using studentId from status as user.uid might not be available if checking via public link (though this flow requires auth)
                userEmail: status.email,
                userName: status.studentName,
                amount: 25000, // Fixed fee for reprint
                currency: 'IQD',
                type: 'REPRINT',
                status: 'PAID',
                provider: 'FIB',
                createdAt: new Date(),
                metadata: {
                    reprintId: status.id
                }
            });

            toast({
                title: 'Payment Successful',
                description: 'Your reprint request has been submitted.',
            });

            // Optionally update local state to show success
        } catch (error) {
            console.error('Error recording reprint:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Payment successful but failed to record request. Please contact support.',
            });
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'found':
                return {
                    color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
                    icon: <CheckCircle className="w-8 h-8" />,
                    title: 'Card Found!',
                    description: 'Great news! Your card has been located.',
                };
            case 'searching':
                return {
                    color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
                    icon: <Clock className="w-8 h-8" />,
                    title: 'Searching',
                    description: 'We are currently looking for your card.',
                };
            case 'not_found':
                return {
                    color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
                    icon: <AlertCircle className="w-8 h-8" />,
                    title: 'Not Found',
                    description: 'We could not find your card.',
                };
            case 'returned':
                return {
                    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
                    icon: <PackageCheck className="w-8 h-8" />,
                    title: 'Returned',
                    description: 'This card has been returned to you.',
                };
            default:
                return {
                    color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                    icon: <Clock className="w-8 h-8" />,
                    title: 'Pending',
                    description: 'Your report has been received.',
                };
        }
    };

    return (
        <div className="space-y-6">

            {error && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3 text-red-800 dark:text-red-200"
                >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{error}</p>
                </motion.div>
            )}

            {status && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg overflow-hidden"
                >
                    <div className="bg-muted/50 p-4 border-b">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Ticket Status</span>
                            <span className="font-mono font-bold text-primary">{ticketCode}</span>
                        </div>
                    </div>
                    <div className="p-4 sm:p-6 space-y-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className={`p-3 rounded-full ${hasPaidReprint || paymentStatus === 'PAID'
                                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                : getStatusConfig(status.status).color
                                }`}>
                                {hasPaidReprint || paymentStatus === 'PAID'
                                    ? <RefreshCw className="w-8 h-8" />
                                    : getStatusConfig(status.status).icon
                                }
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold capitalize">
                                    {hasPaidReprint || paymentStatus === 'PAID'
                                        ? 'Reprint Processing'
                                        : getStatusConfig(status.status).title
                                    }
                                </h3>
                                <p className="text-muted-foreground">
                                    {hasPaidReprint || paymentStatus === 'PAID'
                                        ? 'Your replacement card request has been received.'
                                        : getStatusConfig(status.status).description
                                    }
                                </p>
                            </div>
                        </div>

                        {status.adminMessage && (
                            <div className="bg-muted/30 border rounded p-4 text-sm">
                                <p className="font-medium mb-1 text-muted-foreground">Message from Admin:</p>
                                <p className="italic">"{status.adminMessage}"</p>
                            </div>
                        )}

                        {status.status === 'not_found' && !showPayment && paymentStatus !== 'PAID' && !hasPaidReprint && (
                            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded p-4">
                                <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">Request Replacement</h4>
                                <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
                                    Since your card was not found, you can order a replacement card. A fee of 25,000 IQD applies.
                                </p>
                                {user ? (
                                    <Button onClick={initiateReprint} className="w-full sm:w-auto">
                                        <CreditCard className="w-4 h-4 mr-2" />
                                        Order Replacement (25,000 IQD)
                                    </Button>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">
                                            Please log in to order a replacement card.
                                        </p>
                                        <Button
                                            onClick={() => window.location.href = '/login?redirect=/student/missing-card'}
                                            className="w-full sm:w-auto"
                                        >
                                            Log In to Order Replacement
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {(hasPaidReprint || paymentStatus === 'PAID') && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-4 flex flex-col items-center text-center gap-2">
                                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                                <h4 className="font-semibold text-green-800 dark:text-green-200">Reprint Requested</h4>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    Payment received. Your replacement card is being processed.
                                </p>
                            </div>
                        )}

                        {showPayment && paymentStatus !== 'PAID' && !hasPaidReprint && (
                            <div className="border rounded-lg p-4 bg-muted/10">
                                <h4 className="font-semibold mb-4 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" />
                                    Payment Required
                                </h4>
                                {!paymentData ? (
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <p className="mt-2 text-sm text-muted-foreground">Initializing payment...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="bg-white p-4 rounded-lg shadow-sm">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={paymentData.qrCode} alt="Payment QR Code" className="h-48 w-48 object-contain" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm text-muted-foreground">Scan with FIB app or use code:</p>
                                            <p className="text-xl font-mono font-bold mt-1">{paymentData.readableCode}</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Waiting for payment...
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {status.status === 'found' && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-4 text-sm text-green-800 dark:text-green-200">
                                <p className="font-medium mb-1">Next Steps:</p>
                                <p>Please visit the administration office to collect your card. Bring a valid ID for verification.</p>
                            </div>
                        )}

                        <div className="text-xs text-muted-foreground pt-4 border-t flex justify-between">
                            <span>Student: {status.studentName}</span>
                            <span>Last Updated: {new Date(status.updatedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

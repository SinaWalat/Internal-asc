'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase/client';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Eye, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useCachedData } from '@/hooks/use-cached-data';
import { safeTimestampToDate } from '@/lib/utils';
import Image from 'next/image';
import { getDocs, query, orderBy } from 'firebase/firestore';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { logAuditAction } from '@/lib/audit-log';
import { useUser } from '@/firebase/client';
import { sendKYCApprovalEmail, sendKYCRejectionEmail } from '@/actions/email-actions';

interface KYCVerification {
    id: string;
    studentId: string;
    email: string;
    fullName: string;
    status: 'pending' | 'approved' | 'rejected';
    documents: {
        front: string;
        back: string;
        selfie: string;
    };
    paymentId: string;
    submittedAt: any;
}

export default function KYCVerificationPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [selectedVerification, setSelectedVerification] = useState<KYCVerification | null>(null);

    const kycQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'KYC_Verifications'), orderBy('submittedAt', 'desc')) : null,
        [firestore]
    );

    const { data: cachedVerifications, loading: cachedLoading } = useCachedData<KYCVerification[]>('admin_kyc_verifications', kycQuery);

    const verifications = cachedVerifications || [];
    const isLoading = cachedLoading;

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Show all verifications


    const totalPages = verifications.length > 0 ? Math.ceil(verifications.length / itemsPerPage) : 0;
    const paginatedVerifications = useMemo(() => {
        if (verifications.length === 0) return [];
        return verifications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [verifications, currentPage, itemsPerPage]);

    // Reset to page 1 if verifications change significantly
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [verifications, totalPages, currentPage]);

    const handleApprove = async (id: string) => {
        if (!firestore) return;

        try {
            const docRef = doc(firestore, 'KYC_Verifications', id);
            await updateDoc(docRef, { status: 'approved' });

            // Log the audit action
            if (user?.email) {
                await logAuditAction(
                    firestore,
                    'kyc_approved',
                    user.email,
                    id,
                    'kyc',
                    { studentName: selectedVerification?.fullName, email: selectedVerification?.email }
                );
            }

            setSelectedVerification(null);
            // refresh();

            // Send Email Notification
            if (selectedVerification?.email && selectedVerification?.fullName) {
                const emailResult = await sendKYCApprovalEmail(selectedVerification.email, selectedVerification.fullName);
                if (!emailResult.success) {
                    console.error('Failed to send email:', emailResult.error);
                    toast({
                        title: 'Warning',
                        description: 'KYC approved but email notification failed.',
                        variant: 'destructive'
                    });
                } else {
                    toast({
                        title: 'Approved',
                        description: 'KYC approved and email sent to student.',
                    });
                }
            } else {
                toast({
                    title: 'Approved',
                    description: 'KYC verification has been approved.',
                });
            }
        } catch (error) {
            console.error('Error approving:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to approve verification.',
            });
        }
    };

    const handleReject = async (id: string) => {
        if (!firestore) return;

        try {
            const docRef = doc(firestore, 'KYC_Verifications', id);
            await updateDoc(docRef, { status: 'rejected' });

            // Log the audit action
            if (user?.email) {
                await logAuditAction(
                    firestore,
                    'kyc_rejected',
                    user.email,
                    id,
                    'kyc',
                    { studentName: selectedVerification?.fullName, email: selectedVerification?.email }
                );
            }

            setSelectedVerification(null);
            // refresh();

            // Send Email Notification
            if (selectedVerification?.email && selectedVerification?.fullName) {
                const emailResult = await sendKYCRejectionEmail(selectedVerification.email, selectedVerification.fullName);
                if (!emailResult.success) {
                    console.error('Failed to send email:', emailResult.error);
                    toast({
                        title: 'Warning',
                        description: 'KYC rejected but email notification failed.',
                        variant: 'destructive'
                    });
                } else {
                    toast({
                        title: 'Rejected',
                        description: 'KYC rejected and email sent to student.',
                    });
                }
            } else {
                toast({
                    title: 'Rejected',
                    description: 'KYC verification has been rejected.',
                });
            }
        } catch (error) {
            console.error('Error rejecting:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to reject verification.',
            });
        }
    };

    const handleOnHold = async (id: string) => {
        if (!firestore) return;

        try {
            const docRef = doc(firestore, 'KYC_Verifications', id);
            await updateDoc(docRef, { status: 'pending' });

            // Log the audit action
            if (user?.email) {
                await logAuditAction(
                    firestore,
                    'kyc_on_hold',
                    user.email,
                    id,
                    'kyc',
                    { studentName: selectedVerification?.fullName, email: selectedVerification?.email }
                );
            }

            setSelectedVerification(null);
            // refresh();

            toast({
                title: 'On Hold',
                description: 'KYC verification has been put on hold.',
            });
        } catch (error) {
            console.error('Error setting on hold:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update verification status.',
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">KYC Verification</h1>
                    <p className="text-muted-foreground">Review and approve student identity verifications.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Verifications</CardTitle>
                    <CardDescription>
                        {verifications.length} total verification{verifications.length !== 1 ? 's' : ''}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {verifications.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No pending verifications</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right rtl:text-left">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedVerifications.map((verification) => (
                                    <TableRow key={verification.id}>
                                        <TableCell className="font-medium">{verification.fullName}</TableCell>
                                        <TableCell>{verification.email}</TableCell>
                                        <TableCell>
                                            {safeTimestampToDate(verification.submittedAt)?.toLocaleDateString() || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {verification.status === 'approved' && (
                                                <Badge className="bg-green-600 hover:bg-green-700">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Verified
                                                </Badge>
                                            )}
                                            {verification.status === 'rejected' && (
                                                <Badge className="bg-red-600 hover:bg-red-700">
                                                    <XCircle className="h-3 w-3 mr-1" />
                                                    Rejected
                                                </Badge>
                                            )}
                                            {verification.status === 'pending' && (
                                                <Badge className="bg-yellow-600 hover:bg-yellow-700">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    Pending
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right rtl:text-left">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedVerification(verification)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                {verification.status === 'pending' ? 'Review' : 'View'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Pagination Controls */}
            {verifications.length > 0 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                    <div className="flex-1 text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 rtl:rotate-180" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-2 rtl:mr-2 rtl:ml-0 rtl:rotate-180" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Review Dialog */}
            <Dialog open={!!selectedVerification} onOpenChange={() => setSelectedVerification(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Review KYC Verification</DialogTitle>
                        <DialogDescription>
                            {selectedVerification?.fullName} - {selectedVerification?.email}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedVerification && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm font-medium mb-2">Student ID (Front)</p>
                                    <div className="relative w-full h-48">
                                        <Image
                                            src={selectedVerification.documents.front}
                                            alt="Student ID Front"
                                            fill
                                            className="object-cover rounded-lg border"
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium mb-2">Student ID (Back)</p>
                                    <div className="relative w-full h-48">
                                        <Image
                                            src={selectedVerification.documents.back}
                                            alt="Student ID Back"
                                            fill
                                            className="object-cover rounded-lg border"
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium mb-2">Selfie</p>
                                    <div className="relative w-full h-48">
                                        <Image
                                            src={selectedVerification.documents.selfie}
                                            alt="Selfie"
                                            fill
                                            className="object-cover rounded-lg border"
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedVerification(null)}
                                >
                                    Close
                                </Button>
                                <Select
                                    onValueChange={(value) => {
                                        if (value === 'approve') handleApprove(selectedVerification.id);
                                        else if (value === 'reject') handleReject(selectedVerification.id);
                                        else if (value === 'hold') handleOnHold(selectedVerification.id);
                                    }}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Change Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="approve">
                                            <div className="flex items-center">
                                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                                Approve
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="reject">
                                            <div className="flex items-center">
                                                <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                                Reject
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="hold">
                                            <div className="flex items-center">
                                                <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                                                On Hold
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

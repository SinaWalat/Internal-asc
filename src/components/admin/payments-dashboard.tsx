'use client';

import * as React from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

import { useCollection, useFirebase, useMemoFirebase } from '@/firebase/client';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PaymentRecord = {
    id: string;
    fullName: string;
    email: string;
    paymentId: string;
    submittedAt: string;
    status: string;
    type: 'New Issue' | 'Reprint';
};

export function PaymentsDashboard() {
    const { firestore } = useFirebase();

    // Query KYC verifications (New Issues)
    const kycQuery = useMemoFirebase(
        () =>
            firestore
                ? query(
                    collection(firestore, 'KYC_Verifications'),
                    orderBy('submittedAt', 'desc')
                )
                : null,
        [firestore]
    );

    // Query Reprint Requests
    const reprintsQuery = useMemoFirebase(
        () =>
            firestore
                ? query(
                    collection(firestore, 'reprint_requests'),
                    orderBy('submittedAt', 'desc')
                )
                : null,
        [firestore]
    );

    const { data: kycDocs, isLoading: loadingKyc } = useCollection<any>(kycQuery);
    const { data: reprintDocs, isLoading: loadingReprints } = useCollection<any>(reprintsQuery);

    // Combine and normalize data
    const payments = React.useMemo(() => {
        const allPayments: PaymentRecord[] = [];

        if (kycDocs) {
            kycDocs.forEach(doc => {
                if (doc.paymentId) {
                    allPayments.push({
                        id: doc.id,
                        fullName: doc.fullName,
                        email: doc.email,
                        paymentId: doc.paymentId,
                        submittedAt: doc.submittedAt,
                        status: 'paid',
                        type: 'New Issue'
                    });
                }
            });
        }

        if (reprintDocs) {
            reprintDocs.forEach(doc => {
                allPayments.push({
                    id: doc.id,
                    fullName: doc.studentName, // Note: field name difference
                    email: doc.email,
                    paymentId: doc.paymentId,
                    submittedAt: doc.submittedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                    status: 'paid',
                    type: 'Reprint'
                });
            });
        }

        // Sort by date desc
        return allPayments.sort((a, b) => {
            const dateA = new Date(a.submittedAt).getTime();
            const dateB = new Date(b.submittedAt).getTime();
            return dateB - dateA;
        });
    }, [kycDocs, reprintDocs]);

    const isLoading = loadingKyc || loadingReprints;

    // Pagination State
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10;

    const totalPages = payments ? Math.ceil(payments.length / itemsPerPage) : 0;
    const paginatedPayments = React.useMemo(() => {
        if (!payments) return [];
        return payments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [payments, currentPage, itemsPerPage]);

    // Reset to page 1 if data changes significantly
    React.useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [payments, totalPages, currentPage]);

    return (
        <>

            <Card>
                <CardHeader>
                    <CardTitle>All Payments</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[200px]">Student</TableHead>
                                    <TableHead className="min-w-[100px]">Type</TableHead>
                                    <TableHead className="min-w-[150px]">Payment ID</TableHead>
                                    <TableHead className="min-w-[100px]">Amount</TableHead>
                                    <TableHead className="min-w-[100px]">Status</TableHead>
                                    <TableHead className="min-w-[150px]">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">
                                            Loading payments...
                                        </TableCell>
                                    </TableRow>
                                ) : !payments || payments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">
                                            <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p className="text-muted-foreground">No payments found</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedPayments.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell>
                                                <div className="font-medium">{payment.fullName || 'Unknown'}</div>
                                                <div className="text-xs text-muted-foreground">{payment.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={payment.type === 'Reprint' ? 'secondary' : 'outline'}>
                                                    {payment.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {payment.paymentId}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium">25,000 IQD</span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                                    Paid
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {payment.submittedAt
                                                    ? format(new Date(payment.submittedAt), 'PP p')
                                                    : 'Unknown'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Pagination Controls */}
            {payments && payments.length > 0 && (
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
        </>
    );
}

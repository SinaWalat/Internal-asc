'use client';

import * as React from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { ChevronLeft, ChevronRight, Activity, Info } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuditActionDescription } from '@/lib/audit-log';
import type { AuditAction } from '@/lib/audit-log';

type AuditLog = {
    id: string;
    action: AuditAction;
    adminEmail: string;
    targetId: string;
    targetType: 'message' | 'admin' | 'kyc';
    details?: Record<string, any>;
    timestamp: {
        seconds: number;
        nanoseconds: number;
    } | null;
};

export function AuditLogDashboard() {
    const { firestore } = useFirebase();

    const auditLogsQuery = useMemoFirebase(
        () =>
            firestore
                ? query(collection(firestore, 'audit_logs'), orderBy('timestamp', 'desc'))
                : null,
        [firestore]
    );
    const { data: auditLogs } = useCollection<AuditLog>(auditLogsQuery);

    // Pagination State
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10;

    // Selected log for detail view
    const [selectedLog, setSelectedLog] = React.useState<AuditLog | null>(null);

    const totalPages = auditLogs ? Math.ceil(auditLogs.length / itemsPerPage) : 0;
    const paginatedLogs = React.useMemo(() => {
        if (!auditLogs) return [];
        return auditLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [auditLogs, currentPage, itemsPerPage]);

    // Reset to page 1 if logs change significantly
    React.useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [auditLogs, totalPages, currentPage]);

    const getActionBadgeVariant = (action: AuditAction) => {
        if (action.includes('deleted')) return 'destructive';
        if (action.includes('approved')) return 'success';
        if (action.includes('rejected')) return 'destructive';
        if (action.includes('edited')) return 'secondary';
        return 'outline';
    };

    const getTargetTypeBadge = (type: string) => {
        const badges: Record<string, string> = {
            message: 'Message',
            admin: 'Admin',
            kyc: 'KYC',
        };
        return badges[type] || type;
    };

    const getDetailedDescription = (log: AuditLog): string => {
        const { action, details } = log;

        switch (action) {
            case 'kyc_approved':
                return `Approved KYC verification for ${details?.studentName || details?.email || 'Unknown student'}`;
            case 'kyc_rejected':
                return `Rejected KYC verification for ${details?.studentName || details?.email || 'Unknown student'}`;
            case 'kyc_on_hold':
                return `Put KYC verification on hold for ${details?.studentName || details?.email || 'Unknown student'}`;
            case 'message_deleted':
                return `Deleted message "${details?.subject || 'Unknown'}" from ${details?.from || 'Unknown'}`;
            case 'message_edited':
                return `Edited message "${details?.subject || 'Unknown'}"`;
            case 'admin_deleted':
                return `Deleted admin ${details?.email || 'Unknown'}`;
            case 'admin_edited':
                return `Edited admin ${details?.email || 'Unknown'} (Role: ${details?.role || 'Unknown'})`;
            default:
                return getAuditActionDescription(action);
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Activity History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[200px]">Admin</TableHead>
                                    <TableHead className="min-w-[200px]">Action</TableHead>
                                    <TableHead className="min-w-[100px]">Type</TableHead>
                                    <TableHead className="min-w-[150px]">Target ID</TableHead>
                                    <TableHead className="min-w-[150px]">Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!auditLogs || auditLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">
                                            <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p className="text-muted-foreground">No audit logs yet</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedLogs.map((log) => (
                                        <TableRow
                                            key={log.id}
                                            className="cursor-pointer transition-colors h-[53px]"
                                            onClick={() => setSelectedLog(log)}
                                        >
                                            <TableCell className="font-medium">{log.adminEmail}</TableCell>
                                            <TableCell>
                                                <Badge variant={getActionBadgeVariant(log.action) as any}>
                                                    {getAuditActionDescription(log.action)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{getTargetTypeBadge(log.targetType)}</Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs truncate max-w-[150px]">
                                                {log.targetId}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {log.timestamp
                                                    ? formatDistanceToNow(new Date(log.timestamp.seconds * 1000), {
                                                        addSuffix: true,
                                                    })
                                                    : 'Just now'}
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
            {auditLogs && auditLogs.length > 0 && (
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

            {/* Detail Dialog */}
            <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Action Details</DialogTitle>
                        <DialogDescription>
                            What this admin did
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-6">
                            {/* Main Action Description */}
                            <div className="bg-primary/10 p-4 rounded-lg border-l-4 border-primary">
                                <div className="space-y-2">
                                    {selectedLog.action === 'kyc_approved' && (
                                        <>
                                            <p className="font-medium text-lg">Approved KYC verification for:</p>
                                            <p className="text-base font-semibold">{selectedLog.details?.studentName || 'Unknown student'}</p>
                                            {selectedLog.details?.email && (
                                                <p className="text-sm font-mono bg-primary/20 px-2 py-1 rounded inline-block">
                                                    {selectedLog.details.email}
                                                </p>
                                            )}
                                        </>
                                    )}
                                    {selectedLog.action === 'kyc_rejected' && (
                                        <>
                                            <p className="font-medium text-lg">Rejected KYC verification for:</p>
                                            <p className="text-base font-semibold">{selectedLog.details?.studentName || 'Unknown student'}</p>
                                            {selectedLog.details?.email && (
                                                <p className="text-sm font-mono bg-primary/20 px-2 py-1 rounded inline-block">
                                                    {selectedLog.details.email}
                                                </p>
                                            )}
                                        </>
                                    )}
                                    {selectedLog.action === 'kyc_on_hold' && (
                                        <>
                                            <p className="font-medium text-lg">Put KYC verification on hold for:</p>
                                            <p className="text-base font-semibold">{selectedLog.details?.studentName || 'Unknown student'}</p>
                                            {selectedLog.details?.email && (
                                                <p className="text-sm font-mono bg-primary/20 px-2 py-1 rounded inline-block">
                                                    {selectedLog.details.email}
                                                </p>
                                            )}
                                        </>
                                    )}
                                    {selectedLog.action === 'message_deleted' && (
                                        <>
                                            <p className="font-medium text-lg">Deleted message:</p>
                                            <p className="text-base font-semibold bg-primary/20 px-3 py-2 rounded inline-block">
                                                "{selectedLog.details?.subject || 'Unknown'}"
                                            </p>
                                            {selectedLog.details?.from && (
                                                <p className="text-sm mt-2">
                                                    From: <span className="font-mono bg-primary/20 px-2 py-1 rounded">{selectedLog.details.from}</span>
                                                </p>
                                            )}
                                        </>
                                    )}
                                    {selectedLog.action === 'message_edited' && (
                                        <>
                                            <p className="font-medium text-lg">Edited message from:</p>
                                            <p className="text-base font-mono bg-primary/20 px-3 py-2 rounded inline-block">
                                                {selectedLog.details?.from || 'Unknown'}
                                            </p>
                                            {selectedLog.details?.subject && (
                                                <p className="text-sm mt-2">
                                                    Subject: <span className="font-semibold">"{selectedLog.details.subject}"</span>
                                                </p>
                                            )}
                                        </>
                                    )}
                                    {selectedLog.action === 'admin_deleted' && (
                                        <>
                                            <p className="font-medium text-lg">Deleted admin:</p>
                                            <p className="text-base font-mono bg-primary/20 px-3 py-2 rounded inline-block">
                                                {selectedLog.details?.email || 'Unknown'}
                                            </p>
                                        </>
                                    )}
                                    {selectedLog.action === 'admin_edited' && (
                                        <>
                                            <p className="font-medium text-lg">Edited admin:</p>
                                            <p className="text-base font-mono bg-primary/20 px-3 py-2 rounded inline-block">
                                                {selectedLog.details?.email || 'Unknown'}
                                            </p>
                                            <p className="text-sm mt-2">
                                                Role: <span className="font-semibold bg-primary/20 px-2 py-1 rounded">{selectedLog.details?.role || 'Unknown'}</span>
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Who and When */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between py-2 border-b">
                                    <span className="text-sm text-muted-foreground">Admin:</span>
                                    <span className="font-medium">{selectedLog.adminEmail}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b">
                                    <span className="text-sm text-muted-foreground">When:</span>
                                    <span className="font-medium">
                                        {selectedLog.timestamp
                                            ? format(new Date(selectedLog.timestamp.seconds * 1000), 'PPpp')
                                            : 'Just now'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-sm text-muted-foreground">Type:</span>
                                    <Badge variant="outline">{getTargetTypeBadge(selectedLog.targetType)}</Badge>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

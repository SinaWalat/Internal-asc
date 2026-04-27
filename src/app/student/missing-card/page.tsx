'use client';

import { useState } from 'react';
import { useUser } from '@/firebase/client';
import { StatusChecker } from '@/components/missing-card/status-checker';
import { ReportForm } from '@/components/missing-card/report-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useStudentMissingCards } from '@/hooks/use-student-data';

export default function MissingCardPage() {
    const { user } = useUser();
    const { toast } = useToast();
    const { data: allReports, loading } = useStudentMissingCards();
    const [view, setView] = useState<'loading' | 'report' | 'status'>(() => {
        // Initialize view based on cached data
        return allReports.length > 0 ? 'status' : 'loading';
    });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const totalPages = Math.ceil(allReports.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentReports = allReports.slice(startIndex, endIndex);

    // Determine initial status from the latest report
    const initialStatus = allReports.length > 0 ? {
        id: allReports[0].id,
        status: allReports[0].status,
        studentName: allReports[0].studentName,
        updatedAt: allReports[0].updatedAt?.toDate?.().toISOString() || allReports[0].updatedAt,
        adminMessage: allReports[0].adminMessage,
        studentId: allReports[0].studentId,
        email: allReports[0].email,
        ticketCode: allReports[0].ticketCode
    } : null;

    // Update view when data loads
    if (loading && view === 'loading') {
        // Still loading initial data
    } else if (!loading && view === 'loading') {
        // Data loaded, determine view
        setView(allReports.length > 0 ? 'status' : 'report');
    }

    const handleReportSuccess = (code: string) => {
        setView('status');
        toast({
            title: "Report Sent",
            description: "Your missing card report has been submitted successfully.",
        });
    };

    // Only show loader if we're loading AND don't have cached data
    if (loading && allReports.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Missing Card Center</h1>
                <p className="text-muted-foreground">
                    {view === 'report'
                        ? "Report your lost card to get started."
                        : "Track your missing card status or order a replacement."}
                </p>
            </div>

            {view === 'status' && (
                <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setView('report')}>
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Report Another Card
                    </Button>
                </div>
            )}

            {view === 'report' ? (
                <Card className="border-2">
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle>Report Missing Card</CardTitle>
                        <CardDescription>Please provide details about your missing card.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                        <ReportForm onSuccess={handleReportSuccess} />
                    </CardContent>
                </Card>
            ) : (
                <>
                    <StatusChecker
                        studentId={user?.uid}
                        initialStatus={initialStatus}
                    />

                    {/* Reports History Table */}
                    {allReports.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Report History</CardTitle>
                                <CardDescription>All your previous missing card reports</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left p-3 font-medium text-sm text-muted-foreground">Ticket Code</th>
                                                <th className="text-left p-3 font-medium text-sm text-muted-foreground">Status</th>
                                                <th className="text-left p-3 font-medium text-sm text-muted-foreground">Reported Date</th>
                                                <th className="text-left p-3 font-medium text-sm text-muted-foreground">Last Updated</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentReports.map((report, index) => (
                                                <tr key={report.id} className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${index === 0 && currentPage === 1 ? 'bg-muted/30' : ''}`}>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono font-semibold text-primary">{report.ticketCode}</span>
                                                            {index === 0 && currentPage === 1 && <Badge variant="outline" className="text-xs">Latest</Badge>}
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <Badge variant={
                                                            report.status === 'found' || report.status === 'returned' ? 'default' :
                                                                report.status === 'not_found' ? 'destructive' :
                                                                    report.status === 'searching' ? 'secondary' :
                                                                        'outline'
                                                        } className="capitalize">
                                                            {report.status.replace('_', ' ')}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3 text-sm text-muted-foreground">
                                                        {report.createdAt?.seconds ? format(new Date(report.createdAt.seconds * 1000), 'PPP') : 'N/A'}
                                                    </td>
                                                    <td className="p-3 text-sm text-muted-foreground">
                                                        {report.updatedAt?.seconds ? format(new Date(report.updatedAt.seconds * 1000), 'PPP') : 'N/A'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {totalPages > 1 && (
                                    <PaginationControls
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={setCurrentPage}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}

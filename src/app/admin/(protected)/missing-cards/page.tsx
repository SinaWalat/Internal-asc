'use client';

import { useEffect, useState } from 'react';
import { sendStatusUpdateEmail } from '@/actions/missing-card-actions';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, Search, Edit2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
import { Label } from '@/components/ui/label';
import { useFirebase, useMemoFirebase, useCollection } from '@/firebase/client';
import { collection, doc, updateDoc, orderBy, query, Timestamp } from 'firebase/firestore';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { safeTimestampToDate } from '@/lib/utils';

interface MissingCardTicket {
    id: string;
    ticketCode: string;
    studentName: string;
    studentId: string;
    email: string;
    description?: string;
    status: 'pending' | 'searching' | 'found' | 'not_found' | 'returned';
    adminMessage?: string;
    closed?: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function MissingCardsAdminPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const { firestore } = useFirebase();

    // Dialog State
    const [selectedTicket, setSelectedTicket] = useState<MissingCardTicket | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newStatus, setNewStatus] = useState<string>('');
    const [adminMessage, setAdminMessage] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const ticketsQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'missing_cards'), orderBy('createdAt', 'desc')) : null,
        [firestore]
    );

    const { data: ticketsData, isLoading: loading } = useCollection<MissingCardTicket>(ticketsQuery);
    const tickets = ticketsData || [];

    const openUpdateDialog = (ticket: MissingCardTicket) => {
        // Don't allow editing closed tickets
        if (ticket.closed) {
            return;
        }
        setSelectedTicket(ticket);
        setNewStatus(ticket.status);
        setAdminMessage(ticket.adminMessage || '');
        setIsDialogOpen(true);
    };

    const handleUpdateStatus = async () => {
        if (!selectedTicket) return;

        setIsUpdating(true);
        try {
            // Determine if ticket should be closed
            // Close only when card is not found or has been returned
            const shouldClose = newStatus === 'not_found' || newStatus === 'returned';

            // Update Firestore
            const docRef = doc(firestore, 'missing_cards', selectedTicket.id);
            await updateDoc(docRef, {
                status: newStatus,
                adminMessage: adminMessage,
                closed: shouldClose,
                updatedAt: Timestamp.now(),
            });

            // Send Email
            await sendStatusUpdateEmail(
                selectedTicket.email,
                selectedTicket.studentName,
                newStatus,
                adminMessage
            );

            // Update UI handled by real-time listener
            // Refresh tickets
            // refresh();
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Failed to update status:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'found':
                return <Badge className="bg-green-500 hover:bg-green-600">Found</Badge>;
            case 'searching':
                return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Searching</Badge>;
            case 'not_found':
                return <Badge variant="destructive">Not Found</Badge>;
            case 'returned':
                return <Badge variant="secondary">Returned</Badge>;
            default:
                return <Badge variant="outline">Pending</Badge>;
        }
    };

    const filteredTickets = tickets.filter(
        (ticket) =>
            ticket.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.studentId.includes(searchTerm) ||
            ticket.ticketCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination Logic
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

    const paginatedTickets = filteredTickets.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Missing Cards</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Reported Lost Cards</CardTitle>
                    <div className="relative max-w-sm mt-4">
                        <Search className="absolute left-2.5 top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
                        <Input
                            placeholder="Search by name, ID, or ticket code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                            style={{ background: 'none' }}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[120px]">Ticket Code</TableHead>
                                    <TableHead className="min-w-[200px]">Student</TableHead>
                                    <TableHead className="min-w-[120px]">Student ID</TableHead>
                                    <TableHead className="min-w-[200px]">Description</TableHead>
                                    <TableHead className="min-w-[120px]">Status</TableHead>
                                    <TableHead className="min-w-[120px]">Date Reported</TableHead>
                                    <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!loading && paginatedTickets.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            No tickets found.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!loading && paginatedTickets.map((ticket) => (
                                    <TableRow
                                        key={ticket.id}
                                        className={ticket.closed ? 'opacity-60' : ''}
                                    >
                                        <TableCell className="font-mono font-medium">
                                            {ticket.ticketCode}
                                            {ticket.closed && (
                                                <span className="ml-2 text-xs text-muted-foreground">(Closed)</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{ticket.studentName}</span>
                                                <span className="text-xs text-muted-foreground">{ticket.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{ticket.studentId}</TableCell>
                                        <TableCell className="max-w-[200px] truncate">
                                            {ticket.description || 'N/A'}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                        <TableCell>{safeTimestampToDate(ticket.createdAt)?.toLocaleDateString() || 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openUpdateDialog(ticket)}
                                                disabled={ticket.closed}
                                            >
                                                <Edit2 className="w-4 h-4 mr-2" />
                                                Edit
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {totalPages > 0 && (
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Ticket Status</DialogTitle>
                        <DialogDescription>
                            Change the status of this ticket. The student will be notified via email.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <Select value={newStatus} onValueChange={setNewStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="searching">Searching</SelectItem>
                                    <SelectItem value="found">Found</SelectItem>
                                    <SelectItem value="not_found">Not Found</SelectItem>
                                    <SelectItem value="returned">Returned</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Message to Student (Optional)</Label>
                            <Textarea
                                value={adminMessage}
                                onChange={(e) => setAdminMessage(e.target.value)}
                                placeholder="e.g., We checked the library but couldn't find it..."
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateStatus} disabled={isUpdating}>
                            {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Update Status
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

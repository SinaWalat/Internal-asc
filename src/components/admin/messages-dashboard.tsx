
'use client';

import * as React from 'react';
import {
  collection,
  query,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { MoreHorizontal, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { safeTimestampToDate } from '@/lib/utils';


import { useFirebase, useMemoFirebase, useCollection } from '@/firebase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Input } from '../ui/input';
import { logAuditAction } from '@/lib/audit-log';
import { useUser } from '@/firebase/client';

type Message = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: {
    seconds: number;
    nanoseconds: number;
  } | null;
  read: boolean;
};

export function MessagesDashboard() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();

  const messagesQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'contact_messages_rows'), orderBy('created_at', 'desc'))
        : null,
    [firestore]
  );
  const { data: messages, isLoading } = useCollection<Message>(messagesQuery);

  // Pagination State
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const totalPages = messages ? Math.ceil(messages.length / itemsPerPage) : 0;
  const paginatedMessages = React.useMemo(() => {
    if (!messages) return [];
    return messages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [messages, currentPage, itemsPerPage]);

  // Reset to page 1 if messages change significantly or filter changes (future proofing)
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [messages, totalPages, currentPage]);

  const [messageToDelete, setMessageToDelete] = React.useState<Message | null>(
    null
  );
  const [messageToEdit, setMessageToEdit] = React.useState<Message | null>(
    null
  );
  const [editedContent, setEditedContent] = React.useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleDelete = async () => {
    if (!messageToDelete || !firestore) return;
    const docRef = doc(firestore, 'contact_messages_rows', messageToDelete.id);

    deleteDoc(docRef)
      .then(async () => {
        // Log the audit action
        if (user?.email) {
          await logAuditAction(
            firestore,
            'message_deleted',
            user.email,
            messageToDelete.id,
            'message',
            { subject: messageToDelete.subject, from: messageToDelete.email }
          );
        }
        toast({
          title: 'Message Deleted',
          description: 'The message has been successfully deleted.',
        });
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setMessageToDelete(null);
      })
  };

  const handleUpdate = async () => {
    if (!messageToEdit || !firestore) return;
    const docRef = doc(firestore, 'contact_messages_rows', messageToEdit.id);
    const updatedData = {
      name: editedContent.name,
      email: editedContent.email,
      subject: editedContent.subject,
      message: editedContent.message
    };

    updateDoc(docRef, updatedData)
      .then(async () => {
        // Log the audit action
        if (user?.email) {
          // Fetch the latest document data to ensure we have the original email
          const docSnap = await getDoc(docRef);
          const currentData = docSnap.data() as Message | undefined;

          await logAuditAction(
            firestore,
            'message_edited',
            user.email,
            messageToEdit.id,
            'message',
            {
              subject: editedContent.subject,
              from: currentData?.email || messageToEdit.email || 'Unknown'
            }
          );
        }
        toast({
          title: 'Message Updated',
          description: 'The message has been successfully updated.',
        });
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: updatedData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setMessageToEdit(null);
      })
  };

  const openEditDialog = (message: Message) => {
    setMessageToEdit(message);
    setEditedContent({
      name: message.name,
      email: message.email,
      subject: message.subject,
      message: message.message
    });
  };

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl shadow-orange-500/5 rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle>Contact Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">From</TableHead>
                  <TableHead className="min-w-[200px]">Subject</TableHead>
                  <TableHead className="min-w-[300px]">Message</TableHead>
                  <TableHead className="min-w-[150px]">Sent</TableHead>
                  <TableHead className="min-w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isLoading && messages?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      No messages yet.
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && paginatedMessages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell>
                      <div className='font-medium'>{message.name}</div>
                      <div className='text-xs text-muted-foreground'>{message.email}</div>
                    </TableCell>
                    <TableCell className="font-medium">{message.subject}</TableCell>
                    <TableCell className="text-muted-foreground text-sm truncate max-w-xs">{message.message}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {(() => {
                        const date = safeTimestampToDate(message.created_at);
                        return date ? formatDistanceToNow(date, { addSuffix: true }) : 'Just now';
                      })()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(message)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setMessageToDelete(message)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {messages && messages.length > 0 && (
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!messageToDelete}
        onOpenChange={() => setMessageToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              message.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!messageToEdit}
        onOpenChange={() => setMessageToEdit(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Message</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <Input value={editedContent.name} onChange={(e) => setEditedContent({ ...editedContent, name: e.target.value })} placeholder="Name" />
            <Input value={editedContent.email} onChange={(e) => setEditedContent({ ...editedContent, email: e.target.value })} placeholder="Email" />
            <Input value={editedContent.subject} onChange={(e) => setEditedContent({ ...editedContent, subject: e.target.value })} placeholder="Subject" />
            <Textarea
              value={editedContent.message}
              onChange={(e) => setEditedContent({ ...editedContent, message: e.target.value })}
              rows={5}
              placeholder="Message"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMessageToEdit(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}



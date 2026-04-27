
"use client";

import * as React from "react";
import {
  collection,
  query,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { MoreHorizontal, Pencil, Trash2, ChevronLeft, ChevronRight, Plus, RefreshCw, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useCollection, useFirebase, useMemoFirebase } from "@/firebase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "../ui/skeleton";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "../ui/form";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { logAuditAction } from '@/lib/audit-log';
import { useUser } from '@/firebase/client';
import { createAdminUser } from "@/actions/admin-actions";

type Admin = {
  id: string;

  email: string;
  name?: string;
  role: "global_admin" | "editor" | "viewer";
  permissions?: string[];
  created_at: {
    seconds: number;
    nanoseconds: number;
  } | null;
};

const AVAILABLE_PERMISSIONS = [
  { id: 'view_dashboard', label: 'View Dashboard' },
  { id: 'manage_messages', label: 'Manage Messages' },
  { id: 'manage_universities', label: 'Manage Universities' },
  { id: 'manage_missing_cards', label: 'Manage Missing Cards' },
  { id: 'manage_live_support', label: 'Live Support' },
  { id: 'manage_admins', label: 'Manage Admins' },
  { id: 'manage_kyc', label: 'KYC Verification' },
  { id: 'view_audit_log', label: 'View Audit Log' },
  { id: 'view_payments', label: 'View Payments' },
  { id: 'manage_card_designer', label: 'Card Designer' },
  { id: 'view_analytics', label: 'View Analytics' },
];

const editFormSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  role: z.enum(["global_admin", "editor", "viewer"]),
  permissions: z.array(z.string()).optional(),
});

const createFormSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/, {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    }),
  role: z.enum(["global_admin", "editor", "viewer"]),
  permissions: z.array(z.string()),
});

export function AdminsDashboard() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();

  const adminsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, "admins"), orderBy("created_at", "desc"))
        : null,
    [firestore]
  );
  const { data: admins, isLoading } = useCollection<Admin>(adminsQuery);

  // Pagination State
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const totalPages = admins ? Math.ceil(admins.length / itemsPerPage) : 0;
  const paginatedAdmins = React.useMemo(() => {
    if (!admins) return [];
    return admins.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [admins, currentPage, itemsPerPage]);

  // Reset to page 1 if admins change significantly
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [admins, totalPages, currentPage]);

  const [adminToDelete, setAdminToDelete] = React.useState<Admin | null>(null);
  const [adminToEdit, setAdminToEdit] = React.useState<Admin | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);

  const editForm = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      email: "",
      role: "viewer",
      permissions: [],
    }
  });

  const createForm = useForm<z.infer<typeof createFormSchema>>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      email: "",
      role: "viewer",
      permissions: [],
      password: "",
    }
  });

  React.useEffect(() => {
    if (adminToEdit) {
      editForm.reset({
        email: adminToEdit.email,
        name: adminToEdit.name || "",
        role: adminToEdit.role,
        permissions: adminToEdit.permissions || [],
      });
    }
  }, [adminToEdit, editForm]);

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    createForm.setValue("password", password);
  };

  const handleCreate = async (values: z.infer<typeof createFormSchema>) => {
    if (!user) return;
    setIsCreating(true);
    try {
      // If global admin, give all permissions automatically
      const permissions = values.role === 'global_admin'
        ? AVAILABLE_PERMISSIONS.map(p => p.id)
        : values.permissions;

      const result = await createAdminUser({
        ...values,
        permissions,
      }, user.uid);

      if (result.success) {
        toast({
          title: "Admin Created",
          description: "The new admin account has been created successfully.",
        });
        setIsCreateOpen(false);
        createForm.reset();

        // Log audit
        if (firestore) {
          await logAuditAction(
            firestore,
            'admin_created',
            user.email || 'unknown',
            result.uid || 'unknown',
            'admin',
            { email: values.email, role: values.role }
          );
        }
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating admin:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!adminToDelete || !firestore) return;
    const docRef = doc(firestore, "admins", adminToDelete.id);

    deleteDoc(docRef)
      .then(async () => {
        if (user?.email) {
          await logAuditAction(
            firestore,
            'admin_deleted',
            user.email,
            adminToDelete.id,
            'admin',
            { email: adminToDelete.email, role: adminToDelete.role }
          );
        }
        toast({
          title: "Admin Deleted",
          description: "The admin has been successfully deleted.",
        });
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: "delete",
        });
        errorEmitter.emit("permission-error", permissionError);
      })
      .finally(() => {
        setAdminToDelete(null);
      });
  };

  const handleUpdate = async (values: z.infer<typeof editFormSchema>) => {
    if (!adminToEdit || !firestore) return;
    const docRef = doc(firestore, "admins", adminToEdit.id);

    // If global admin, enforce all permissions
    const permissions = values.role === 'global_admin'
      ? AVAILABLE_PERMISSIONS.map(p => p.id)
      : values.permissions;

    const updatedData = {
      ...values,
      permissions,
    };

    updateDoc(docRef, updatedData)
      .then(async () => {
        if (user?.email) {
          await logAuditAction(
            firestore,
            'admin_edited',
            user.email,
            adminToEdit.id,
            'admin',
            { email: values.email, role: values.role }
          );
        }
        toast({
          title: "Admin Updated",
          description: "The admin has been successfully updated.",
        });
        setAdminToEdit(null);
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: "update",
          requestResourceData: updatedData,
        });
        errorEmitter.emit("permission-error", permissionError);
      });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Admins</CardTitle>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Admin
          </Button>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isLoading && admins?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-24">
                      No admins found.
                    </TableCell>
                  </TableRow>
                )}
                {paginatedAdmins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.email}</TableCell>
                    <TableCell>
                      <Badge variant={admin.role === 'global_admin' ? 'default' : 'secondary'}>
                        {admin.role.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            disabled={user?.uid === admin.id}
                          >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setAdminToEdit(admin)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setAdminToDelete(admin)}
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
      {admins && admins.length > 0 && (
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
        open={!!adminToDelete}
        onOpenChange={() => setAdminToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              admin account.
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

      {/* Create Admin Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Admin</DialogTitle>
            <DialogDescription>
              Create a new administrator account. They will be able to log in with these credentials.
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="admin@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="global_admin">Global Admin</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      <Button type="button" variant="outline" onClick={generatePassword}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Generate
                      </Button>
                    </div>
                    <FormDescription>
                      Password must be at least 6 characters.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 border rounded-lg p-4">
                <h3 className="font-medium">Permissions</h3>
                <div className="grid grid-cols-2 gap-4">
                  {AVAILABLE_PERMISSIONS.map((permission) => (
                    <FormField
                      key={permission.id}
                      control={createForm.control}
                      name="permissions"
                      render={({ field }) => {
                        const isGlobalAdmin = createForm.watch("role") === "global_admin";
                        return (
                          <FormItem
                            key={permission.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={isGlobalAdmin || field.value?.includes(permission.id)}
                                disabled={isGlobalAdmin}
                                onCheckedChange={(checked) => {
                                  if (isGlobalAdmin) return;
                                  return checked
                                    ? field.onChange([...field.value, permission.id])
                                    : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== permission.id
                                      )
                                    )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {permission.label}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Admin"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!adminToEdit} onOpenChange={() => setAdminToEdit(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="global_admin">
                          Global Admin
                        </SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 border rounded-lg p-4">
                <h3 className="font-medium">Permissions</h3>
                <div className="grid grid-cols-2 gap-4">
                  {AVAILABLE_PERMISSIONS.map((permission) => (
                    <FormField
                      key={permission.id}
                      control={editForm.control}
                      name="permissions"
                      render={({ field }) => {
                        const isGlobalAdmin = editForm.watch("role") === "global_admin";
                        return (
                          <FormItem
                            key={permission.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={isGlobalAdmin || field.value?.includes(permission.id)}
                                disabled={isGlobalAdmin}
                                onCheckedChange={(checked) => {
                                  if (isGlobalAdmin) return;
                                  return checked
                                    ? field.onChange([...(field.value || []), permission.id])
                                    : field.onChange(
                                      (field.value || []).filter(
                                        (value) => value !== permission.id
                                      )
                                    )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {permission.label}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAdminToEdit(null)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}


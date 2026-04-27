'use client';

import { useEffect, useState, useRef } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, GraduationCap, Filter, Edit2, Upload, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useFirebase, useMemoFirebase, useCollection } from '@/firebase/client';
import { collection, getDocs, query, orderBy, doc, updateDoc, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, getStorage } from 'firebase/storage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PaginationControls } from '@/components/ui/pagination-controls';

interface StudentProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    university?: string;
    bloodGroup?: string;
    photoURL?: string;
    studentId?: string;
    customFields?: { [key: string]: string | number };
}

import { useToast } from '@/hooks/use-toast';
import { UniversityManager } from '@/components/admin/university-manager';

export default function UniversitiesAdminPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUniversity, setSelectedUniversity] = useState<string>('all');
    const { firestore } = useFirebase();
    const storage = getStorage();

    // Edit Dialog State
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);
    const [editFirstName, setEditFirstName] = useState('');
    const [editLastName, setEditLastName] = useState('');
    const [editStudentId, setEditStudentId] = useState('');
    const [editUniversity, setEditUniversity] = useState('');
    const [editBloodGroup, setEditBloodGroup] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Image Upload State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const studentsQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'profiles'), orderBy('firstName')) : null,
        [firestore]
    );

    const { data: studentsData, isLoading: loading } = useCollection<StudentProfile>(studentsQuery);
    const students = studentsData || [];

    // University Config State
    const [universityConfigs, setUniversityConfigs] = useState<any[]>([]);
    const [editCustomFields, setEditCustomFields] = useState<{ [key: string]: string | number }>({});

    // Fetch University Configurations
    useEffect(() => {
        if (!firestore) return;
        const fetchConfigs = async () => {
            const snapshot = await getDocs(collection(firestore, 'universities'));
            const configs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUniversityConfigs(configs);
        };
        fetchConfigs();
    }, [firestore]);

    // Update custom fields when university changes
    useEffect(() => {
        if (!editUniversity) {
            setEditCustomFields({});
            return;
        }

        const config = universityConfigs.find(u => u.name === editUniversity);
        if (config && editingStudent) {
            // Merge existing custom fields with defaults
            const currentFields = editingStudent.customFields || {};
            const newFields: any = { ...currentFields };

            // Ensure all configured fields exist
            config.customFields?.forEach((field: any) => {
                if (newFields[field.key] === undefined) {
                    newFields[field.key] = '';
                }
            });
            setEditCustomFields(newFields);
        } else if (config) {
            // New student or just switched uni
            const newFields: any = {};
            config.customFields?.forEach((field: any) => {
                newFields[field.key] = '';
            });
            setEditCustomFields(newFields);
        }
    }, [editUniversity, universityConfigs, editingStudent]);

    const handleEditClick = (student: StudentProfile) => {
        setEditingStudent(student);
        setEditFirstName(student.firstName || '');
        setEditLastName(student.lastName || '');
        setEditStudentId(student.studentId || '');
        setEditUniversity(student.university || '');
        setEditBloodGroup(student.bloodGroup || '');
        setEditCustomFields(student.customFields || {});
        setImagePreview(student.photoURL || null);
        setImageFile(null);
        setIsEditDialogOpen(true);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async () => {
        if (!editingStudent) return;

        setIsSaving(true);
        try {
            let photoURL = editingStudent.photoURL || null;

            // Upload new image if selected
            if (imageFile) {
                const storageRef = ref(storage, `profile-images/${editingStudent.id}`);
                await uploadBytes(storageRef, imageFile);
                photoURL = await getDownloadURL(storageRef);
            }

            // Update Firestore
            const docRef = doc(firestore, 'profiles', editingStudent.id);
            await updateDoc(docRef, {
                firstName: editFirstName,
                lastName: editLastName,
                studentId: editStudentId,
                university: editUniversity,
                bloodGroup: editBloodGroup,
                photoURL: photoURL,
                customFields: editCustomFields
            });



            // Refresh the list
            // refresh();
            setIsEditDialogOpen(false);
            setEditingStudent(null);
        } catch (error) {
            console.error('Failed to update profile:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Extract unique universities for filter
    const universities = Array.from(
        new Set(students.map((s) => s.university).filter(Boolean))
    ).sort();

    const filteredStudents = students.filter((student) => {
        const matchesSearch =
            student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (student.studentId && student.studentId.includes(searchTerm));

        const matchesUniversity =
            selectedUniversity === 'all' || student.university === selectedUniversity;

        return matchesSearch && matchesUniversity;
    });

    // Pagination Logic
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

    const paginatedStudents = filteredStudents.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedUniversity]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Universities & Students</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Student Directory</CardTitle>
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
                            <Input
                                placeholder="Search by name, email, or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                                style={{ background: 'none' }}
                            />
                        </div>
                        <div className="flex gap-2">
                            <UniversityManager />
                            <div className="w-full sm:w-[250px]">
                                <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                                    <SelectTrigger>
                                        <div className="flex items-center gap-2">
                                            <Filter className="w-4 h-4 text-muted-foreground" />
                                            <SelectValue placeholder="Filter by University" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Universities</SelectItem>
                                        {universities.map((uni) => (
                                            <SelectItem key={uni as string} value={uni as string}>
                                                {uni as string}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button variant="outline" onClick={() => {
                                const headers = ['First Name', 'Last Name', 'Email', 'Student ID', 'University', 'Blood Group'];
                                const csvContent = [
                                    headers.join(','),
                                    ...students.map(student => [
                                        student.firstName,
                                        student.lastName,
                                        student.email,
                                        student.studentId || '',
                                        student.university || '',
                                        student.bloodGroup || ''
                                    ].map(field => `"${field}"`).join(','))
                                ].join('\n');

                                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                const link = document.createElement('a');
                                if (link.download !== undefined) {
                                    const url = URL.createObjectURL(blob);
                                    link.setAttribute('href', url);
                                    link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
                                    link.style.visibility = 'hidden';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }
                            }}>
                                <Upload className="w-4 h-4 mr-2 rotate-180" />
                                Export CSV
                            </Button>
                            <Button variant="outline" onClick={() => document.getElementById('csv-import-input')?.click()}>
                                <Upload className="w-4 h-4 mr-2" />
                                Import CSV
                            </Button>
                            <input
                                id="csv-import-input"
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file || !firestore) return;

                                    const reader = new FileReader();
                                    reader.onload = async (event) => {
                                        const text = event.target?.result as string;
                                        const lines = text.split('\n');
                                        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

                                        // Basic validation of headers
                                        if (!headers.includes('Email') || !headers.includes('First Name')) {
                                            toast({
                                                variant: "destructive",
                                                title: "Invalid CSV Format",
                                                description: "CSV must contain 'First Name' and 'Email' columns."
                                            });
                                            return;
                                        }

                                        let successCount = 0;
                                        let errorCount = 0;
                                        let skippedCount = 0;

                                        // Create a Set of existing emails for fast lookup (case-insensitive)
                                        const existingEmails = new Set(students.map(s => s.email?.toLowerCase()));

                                        for (let i = 1; i < lines.length; i++) {
                                            if (!lines[i].trim()) continue;

                                            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                                            const studentData: any = {};

                                            headers.forEach((header, index) => {
                                                if (header === 'First Name') studentData.firstName = values[index];
                                                else if (header === 'Last Name') studentData.lastName = values[index];
                                                else if (header === 'Email') studentData.email = values[index];
                                                else if (header === 'Student ID') studentData.studentId = values[index];
                                                else if (header === 'University') studentData.university = values[index];
                                                else if (header === 'Blood Group') studentData.bloodGroup = values[index];
                                            });

                                            if (studentData.email) {
                                                // Check if email already exists
                                                if (existingEmails.has(studentData.email.toLowerCase())) {
                                                    skippedCount++;
                                                    continue;
                                                }

                                                try {
                                                    await addDoc(collection(firestore, 'profiles'), {
                                                        ...studentData,
                                                        createdAt: new Date(),
                                                        role: 'student'
                                                    });
                                                    // Add to local set to prevent duplicates within the same CSV file
                                                    existingEmails.add(studentData.email.toLowerCase());
                                                    successCount++;
                                                } catch (err) {
                                                    console.error("Error adding student:", err);
                                                    errorCount++;
                                                }
                                            }
                                        }

                                        let message = `Successfully added ${successCount} new students.`;
                                        if (skippedCount > 0) message += ` Skipped ${skippedCount} duplicates.`;
                                        if (errorCount > 0) message += ` Failed to add ${errorCount} rows.`;

                                        toast({
                                            title: successCount > 0 ? "Import Successful" : "Import Completed",
                                            description: message
                                        });

                                        // Reset input
                                        e.target.value = '';
                                    };
                                    reader.readAsText(file);
                                }}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[200px]">Name</TableHead>
                                    <TableHead className="min-w-[200px]">University</TableHead>
                                    <TableHead className="min-w-[200px]">Email</TableHead>
                                    <TableHead className="min-w-[120px]">Blood Group</TableHead>
                                    <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!loading && paginatedStudents.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No students found matching your criteria.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!loading && paginatedStudents.map((student) => (
                                    <TableRow
                                        key={student.id}
                                        className="cursor-pointer"
                                        onClick={() => handleEditClick(student)}
                                    >
                                        <TableCell className="font-medium">
                                            {student.firstName} {student.lastName}
                                            {student.studentId && (
                                                <span className="block text-xs text-muted-foreground">
                                                    ID: {student.studentId}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <GraduationCap className="w-4 h-4 text-muted-foreground" />
                                                <span>{student.university || 'N/A'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{student.email}</TableCell>
                                        <TableCell>
                                            {student.bloodGroup ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
                                                    {student.bloodGroup}
                                                </span>
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditClick(student);
                                                }}
                                            >
                                                <Edit2 className="w-4 h-4" />
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

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Student Profile</DialogTitle>
                        <DialogDescription>
                            Update student details and profile image.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        {/* Image Upload Section */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className="w-32 h-32 border-2 border-muted rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-4xl font-semibold text-muted-foreground">
                                            {editFirstName[0]}
                                            {editLastName[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Upload className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Change Photo
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    value={editFirstName}
                                    onChange={(e) => setEditFirstName(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    value={editLastName}
                                    onChange={(e) => setEditLastName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="studentId">Student ID</Label>
                            <Input
                                id="studentId"
                                value={editStudentId}
                                onChange={(e) => setEditStudentId(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="university">University</Label>
                            <Input
                                id="university"
                                value={editUniversity}
                                onChange={(e) => setEditUniversity(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="bloodGroup">Blood Group</Label>
                            <Select value={editBloodGroup} onValueChange={setEditBloodGroup}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Blood Group" />
                                </SelectTrigger>
                                <SelectContent>
                                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                                        <SelectItem key={bg} value={bg}>
                                            {bg}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Dynamic Fields Section */}
                        {universityConfigs.find(u => u.name === editUniversity)?.customFields?.length > 0 && (
                            <div className="border-t pt-4 mt-2">
                                <h4 className="text-sm font-medium mb-3 text-muted-foreground">University Specific Fields</h4>
                                <div className="grid gap-4">
                                    {universityConfigs.find(u => u.name === editUniversity)?.customFields.map((field: any) => (
                                        <div key={field.key} className="grid gap-2">
                                            <Label htmlFor={`custom-${field.key}`}>{field.label}</Label>
                                            <Input
                                                id={`custom-${field.key}`}
                                                type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                                value={editCustomFields[field.key] || ''}
                                                onChange={(e) => setEditCustomFields(prev => ({
                                                    ...prev,
                                                    [field.key]: e.target.value
                                                }))}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveProfile} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

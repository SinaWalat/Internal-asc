'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Settings, Loader2, Building2 } from 'lucide-react';
import { useFirestore } from '@/firebase/client';
import { collection, getDocs, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface CustomField {
    key: string;
    label: string;
    type: 'text' | 'number' | 'date';
}

export interface Department {
    name: string;
    code: string;
}

export interface University {
    id: string; // This will be the university name
    name: string;
    code?: string;
    customFields: CustomField[];
    departments?: Department[];
}

export function UniversityManager() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [universities, setUniversities] = useState<University[]>([]);
    const [loading, setLoading] = useState(true);
    const [isManagerOpen, setIsManagerOpen] = useState(false);

    // Edit/Create State
    const [editingUniversity, setEditingUniversity] = useState<University | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [newUniName, setNewUniName] = useState('');
    const [newUniCode, setNewUniCode] = useState('');

    // Field Editor State
    const [tempFields, setTempFields] = useState<CustomField[]>([]);
    const [newFieldKey, setNewFieldKey] = useState('');
    const [newFieldLabel, setNewFieldLabel] = useState('');
    const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'date'>('text');

    // Department Editor State
    const [tempDepartments, setTempDepartments] = useState<Department[]>([]);
    const [newDeptName, setNewDeptName] = useState('');
    const [newDeptCode, setNewDeptCode] = useState('');

    useEffect(() => {
        if (!firestore) return;

        const unsubscribe = onSnapshot(collection(firestore, 'universities'), (snapshot) => {
            const unis = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as University[];
            setUniversities(unis);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [firestore]);

    const handleCreateUniversity = async () => {
        if (!newUniName.trim() || !firestore) return;
        const id = newUniName.trim(); // Use name as ID for simplicity

        try {
            await setDoc(doc(firestore, 'universities', id), {
                name: newUniName.trim(),
                code: newUniCode.trim().toUpperCase(),
                customFields: [],
                departments: []
            });
            setNewUniName('');
            setNewUniCode('');
            toast({ title: "University Created" });
        } catch (error) {
            console.error(error);
            toast({ title: "Error creating university", variant: "destructive" });
        }
    };

    const handleDeleteUniversity = async (id: string) => {
        if (!confirm('Are you sure? This will not delete students but will remove configuration.') || !firestore) return;
        try {
            await deleteDoc(doc(firestore, 'universities', id));
            toast({ title: "University Deleted" });
        } catch (error) {
            console.error(error);
            toast({ title: "Error deleting university", variant: "destructive" });
        }
    };

    const openEditor = (uni: University) => {
        setEditingUniversity(uni);
        setTempFields([...(uni.customFields || [])]);
        setTempDepartments([...(uni.departments || [])]);
        setIsEditorOpen(true);
    };

    const handleAddField = () => {
        if (!newFieldKey || !newFieldLabel) return;
        // Simple validation to ensure key is unique
        if (tempFields.some(f => f.key === newFieldKey)) {
            toast({ title: "Field key must be unique", variant: "destructive" });
            return;
        }

        setTempFields([...tempFields, { key: newFieldKey, label: newFieldLabel, type: newFieldType }]);
        setNewFieldKey('');
        setNewFieldLabel('');
        setNewFieldType('text');
    };

    const handleRemoveField = (index: number) => {
        const newFields = [...tempFields];
        newFields.splice(index, 1);
        setTempFields(newFields);
    };

    const handleAddDepartment = () => {
        if (!newDeptName || !newDeptCode) return;
        if (tempDepartments.some(d => d.code === newDeptCode)) {
            toast({ title: "Department code must be unique", variant: "destructive" });
            return;
        }

        setTempDepartments([...tempDepartments, { name: newDeptName, code: newDeptCode.toUpperCase() }]);
        setNewDeptName('');
        setNewDeptCode('');
    };

    const handleRemoveDepartment = (index: number) => {
        const newDepts = [...tempDepartments];
        newDepts.splice(index, 1);
        setTempDepartments(newDepts);
    };

    const handleSaveConfiguration = async () => {
        if (!editingUniversity || !firestore) return;
        try {
            await setDoc(doc(firestore, 'universities', editingUniversity.id), {
                ...editingUniversity,
                customFields: tempFields,
                departments: tempDepartments
            });
            setIsEditorOpen(false);
            toast({ title: "Configuration Saved" });
        } catch (error) {
            console.error(error);
            toast({ title: "Error saving configuration", variant: "destructive" });
        }
    };

    return (
        <>
            <Button variant="outline" onClick={() => setIsManagerOpen(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Manage Universities
            </Button>

            <Dialog open={isManagerOpen} onOpenChange={setIsManagerOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>University Manager</DialogTitle>
                        <DialogDescription>
                            Add universities and configure their specific data fields.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex gap-2 mb-4 items-end">
                        <div className="grid gap-2 flex-1">
                            <Label>University Name</Label>
                            <Input
                                placeholder="e.g. Catholic University in Erbil"
                                value={newUniName}
                                onChange={(e) => setNewUniName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2 w-32">
                            <Label>Code</Label>
                            <Input
                                placeholder="e.g. CUE"
                                value={newUniCode}
                                onChange={(e) => setNewUniCode(e.target.value.toUpperCase())}
                                maxLength={5}
                            />
                        </div>
                        <Button onClick={handleCreateUniversity}>Add</Button>
                    </div>

                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Depts</TableHead>
                                    <TableHead>Custom Fields</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {universities.map(uni => (
                                    <TableRow key={uni.id}>
                                        <TableCell className="font-medium">{uni.name}</TableCell>
                                        <TableCell>
                                            <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                                {uni.code || '-'}
                                            </span>
                                        </TableCell>
                                        <TableCell>{uni.departments?.length || 0}</TableCell>
                                        <TableCell>
                                            {uni.customFields?.map(f => (
                                                <span key={f.key} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground mr-1">
                                                    {f.label}
                                                </span>
                                            ))}
                                            {(!uni.customFields || uni.customFields.length === 0) && <span className="text-muted-foreground text-xs">None</span>}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => openEditor(uni)}>
                                                <Settings className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteUniversity(uni.id)}>
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {universities.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                            No universities configured.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Configuration Editor Dialog */}
            <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Configure: {editingUniversity?.name}</DialogTitle>
                        <DialogDescription>
                            Manage departments and custom fields for this university.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="departments">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="departments">Departments</TabsTrigger>
                            <TabsTrigger value="fields">Custom Fields</TabsTrigger>
                        </TabsList>

                        <TabsContent value="departments" className="space-y-4 mt-4">
                            <div className="grid grid-cols-3 gap-2 items-end border p-4 rounded-md bg-muted/20">
                                <div className="col-span-2">
                                    <Label className="text-xs">Department Name</Label>
                                    <Input
                                        value={newDeptName}
                                        onChange={(e) => setNewDeptName(e.target.value)}
                                        placeholder="e.g. Architecture"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <div>
                                        <Label className="text-xs">Code</Label>
                                        <Input
                                            value={newDeptCode}
                                            onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())}
                                            placeholder="AR"
                                            maxLength={4}
                                            className="font-mono"
                                        />
                                    </div>
                                    <Button onClick={handleAddDepartment} size="icon" className="mb-[2px]">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="border rounded-md max-h-[300px] overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Department Name</TableHead>
                                            <TableHead>Code</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tempDepartments.map((dept, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>{dept.name}</TableCell>
                                                <TableCell className="font-mono text-xs">{dept.code}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => handleRemoveDepartment(idx)}>
                                                        <Trash2 className="w-4 h-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {tempDepartments.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                                                    No departments defined.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        <TabsContent value="fields" className="space-y-4 mt-4">
                            <div className="grid grid-cols-3 gap-2 items-end border p-4 rounded-md bg-muted/20">
                                <div>
                                    <Label className="text-xs">Field Label</Label>
                                    <Input
                                        value={newFieldLabel}
                                        onChange={(e) => {
                                            setNewFieldLabel(e.target.value);
                                            setNewFieldKey(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                                        }}
                                        placeholder="Label"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Key</Label>
                                    <Input
                                        value={newFieldKey}
                                        onChange={(e) => setNewFieldKey(e.target.value)}
                                        placeholder="key"
                                        className="font-mono text-xs"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <Label className="text-xs">Type</Label>
                                        <Select value={newFieldType} onValueChange={(v: any) => setNewFieldType(v)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="text">Text</SelectItem>
                                                <SelectItem value="number">Number</SelectItem>
                                                <SelectItem value="date">Date</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button onClick={handleAddField} size="icon" className="mb-[2px]">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="border rounded-md max-h-[300px] overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Label</TableHead>
                                            <TableHead>Key</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tempFields.map((field, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>{field.label}</TableCell>
                                                <TableCell className="font-mono text-xs">{field.key}</TableCell>
                                                <TableCell className="capitalize">{field.type}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => handleRemoveField(idx)}>
                                                        <Trash2 className="w-4 h-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {tempFields.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                                                    No custom fields defined.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditorOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveConfiguration}>Save Configuration</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

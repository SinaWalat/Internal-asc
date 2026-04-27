'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Type, ImageIcon, Save, Printer, Download, Trash2, LayoutTemplate, CreditCard, Loader2, ChevronLeft, ChevronRight, Search, CheckCircle } from 'lucide-react';
import { useFirebase, useUser } from '@/firebase/client';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import dynamic from 'next/dynamic';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

// Dynamically import Konva component to avoid SSR issues
const CardDesignCanvas = dynamic(() => import('./card-design-canvas'), { ssr: false });

interface CardField {
    id: string;
    type: 'text' | 'image';
    side: 'front' | 'back';
    position: { x: number; y: number };
    size: { width: number; height: number };
    mapping: string;
    style?: {
        fontSize?: number;
        fontFamily?: string;
        color?: string;
        textAlign?: 'left' | 'center' | 'right';
        fontWeight?: string;
        fontStyle?: string;
    };
    rotation?: number;
    value?: string; // For preview
}

interface CardTemplate {
    id?: string;
    name: string;
    frontImageUrl: string;
    backImageUrl: string;
    fields: CardField[];
    createdAt?: any;
    updatedAt?: any;
    createdBy?: string;
}

export default function CardDesignerDashboard() {
    const { toast } = useToast();
    const { firestore, storage } = useFirebase();
    const { user } = useUser();

    const [template, setTemplate] = useState<CardTemplate>({
        name: 'Student ID Card',
        frontImageUrl: '',
        backImageUrl: '',
        fields: [],
    });

    const [frontImage, setFrontImage] = useState<File | null>(null);
    const [backImage, setBackImage] = useState<File | null>(null);
    const [frontPreview, setFrontPreview] = useState<string>('');
    const [backPreview, setBackPreview] = useState<string>('');

    const [selectedField, setSelectedField] = useState<string | null>(null);
    const [currentSide, setCurrentSide] = useState<'front' | 'back'>('front');
    // Removed manual drag state

    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
    const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });

    const [studentListPage, setStudentListPage] = useState(1);
    const studentListItemsPerPage = 5;

    const canvasRef = useRef<HTMLDivElement>(null);

    // ... (existing state)

    // Calculate paginated students for the list
    const studentListTotalPages = Math.ceil(students.length / studentListItemsPerPage);
    const paginatedStudentsForList = students.slice(
        (studentListPage - 1) * studentListItemsPerPage,
        studentListPage * studentListItemsPerPage
    );

    // University Config State
    const [universities, setUniversities] = useState<any[]>([]);
    const [selectedUniversity, setSelectedUniversity] = useState<string>('');

    useEffect(() => {
        if (!firestore) return;
        const fetchUniversities = async () => {
            const snapshot = await getDocs(collection(firestore, 'universities'));
            const unis = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUniversities(unis);
        };
        fetchUniversities();
    }, [firestore]);

    // Handle image upload
    const handleImageUpload = (file: File, side: 'front' | 'back') => {
        if (side === 'front') {
            setFrontImage(file);
            setFrontPreview(URL.createObjectURL(file));
        } else {
            setBackImage(file);
            setBackPreview(URL.createObjectURL(file));
        }
    };

    // Upload images to Firebase Storage
    const uploadImages = async () => {
        if (!storage || !frontImage || !backImage) return;

        try {
            const frontRef = ref(storage, `card-templates/${Date.now()}-front.png`);
            const backRef = ref(storage, `card-templates/${Date.now()}-back.png`);

            await uploadBytes(frontRef, frontImage);
            await uploadBytes(backRef, backImage);

            const frontUrl = await getDownloadURL(frontRef);
            const backUrl = await getDownloadURL(backRef);

            setTemplate(prev => ({
                ...prev,
                frontImageUrl: frontUrl,
                backImageUrl: backUrl,
            }));

            return { frontUrl, backUrl };
        } catch (error) {
            console.error('Error uploading images:', error);
            return null;
        }
    };

    // Add a new field
    const addField = (type: 'text' | 'image') => {
        const newField: CardField = {
            id: `field-${Date.now()}`,
            type,
            side: currentSide,
            position: { x: 50, y: 50 },
            size: { width: type === 'text' ? 200 : 100, height: type === 'text' ? 30 : 100 },
            mapping: type === 'text' ? 'fullName' : 'documents.selfie',
            style: type === 'text' ? {
                fontSize: 16,
                fontFamily: 'Arial',
                color: '#000000',
                textAlign: 'left',
            } : undefined,
        };

        setTemplate(prev => ({
            ...prev,
            fields: [...prev.fields, newField],
        }));
        setSelectedField(newField.id);
    };

    // Delete a field
    const deleteField = (fieldId: string) => {
        setTemplate(prev => ({
            ...prev,
            fields: prev.fields.filter(f => f.id !== fieldId),
        }));
        setSelectedField(null);
    };

    // Update field position
    const updateFieldPosition = (fieldId: string, x: number, y: number) => {
        setTemplate(prev => ({
            ...prev,
            fields: prev.fields.map(f =>
                f.id === fieldId ? { ...f, position: { x, y } } : f
            ),
        }));
    };

    // Update field mapping
    const updateFieldMapping = (fieldId: string, mapping: string) => {
        setTemplate(prev => ({
            ...prev,
            fields: prev.fields.map(f =>
                f.id === fieldId ? { ...f, mapping } : f
            ),
        }));
    };

    // Update field style
    const updateFieldStyle = (fieldId: string, styleKey: string, value: any) => {
        setTemplate(prev => ({
            ...prev,
            fields: prev.fields.map(f =>
                f.id === fieldId ? {
                    ...f,
                    style: { ...f.style, [styleKey]: value }
                } : f
            ),
        }));
    };

    // Save template to Firestore
    const saveTemplate = async () => {
        if (!firestore || !user) return;

        try {
            const urls = await uploadImages();
            if (!urls) return;

            // Clean fields to remove undefined values
            const cleanedFields = template.fields.map(field => {
                const cleanedField: any = {
                    id: field.id,
                    type: field.type,
                    side: field.side,
                    position: field.position,
                    size: field.size,
                    mapping: field.mapping,
                };

                // Only add style if it exists and has values
                if (field.style && field.type === 'text') {
                    cleanedField.style = {
                        fontSize: field.style.fontSize || 16,
                        fontFamily: field.style.fontFamily || 'Arial',
                        color: field.style.color || '#000000',
                        textAlign: field.style.textAlign || 'left',
                    };
                }

                return cleanedField;
            });

            const templateData = {
                name: template.name,
                frontImageUrl: urls.frontUrl,
                backImageUrl: urls.backUrl,
                fields: cleanedFields,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                createdBy: user.uid,
            };

            await addDoc(collection(firestore, 'card_templates'), templateData);
            alert('Template saved successfully!');
        } catch (error) {
            console.error('Error saving template:', error);
            alert('Error saving template');
        }
    };

    // Handle canvas changes
    const handleCanvasChange = (updatedFields: CardField[]) => {
        setTemplate(prev => ({
            ...prev,
            fields: prev.fields.map(f => {
                const updated = updatedFields.find(uf => uf.id === f.id);
                return updated ? { ...f, ...updated } : f;
            })
        }));
    };

    // Update canvas dimensions
    const [activeTab, setActiveTab] = useState('upload');

    useEffect(() => {
        const updateDimensions = () => {
            if (canvasRef.current) {
                const { offsetWidth, offsetHeight } = canvasRef.current;
                // Only update if dimensions actually changed and are non-zero
                if (offsetWidth > 0 && offsetHeight > 0 &&
                    (offsetWidth !== canvasDimensions.width || offsetHeight !== canvasDimensions.height)) {
                    setCanvasDimensions({
                        width: offsetWidth,
                        height: offsetHeight
                    });
                }
            }
        };

        // Initial update
        updateDimensions();

        // Use ResizeObserver to detect size changes
        const resizeObserver = new ResizeObserver(() => {
            // Wrap in requestAnimationFrame to avoid "ResizeObserver loop limit exceeded" error
            requestAnimationFrame(() => {
                updateDimensions();
            });
        });

        if (canvasRef.current) {
            resizeObserver.observe(canvasRef.current);
        }

        // Also update when tab changes (backup)
        const timer = setTimeout(updateDimensions, 100);

        return () => {
            resizeObserver.disconnect();
            clearTimeout(timer);
        };
    }, [activeTab, currentSide]); // Re-run when tab or side changes to re-attach observer if needed

    // Fetch students from KYC verifications
    const fetchStudents = async () => {
        if (!firestore) return;

        setIsLoadingStudents(true);
        try {
            const kycCollection = collection(firestore, 'KYC_Verifications');
            const snapshot = await getDocs(kycCollection);

            const studentData = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }))
                .filter((s: any) => !s.cardPrinted);

            setStudents(studentData);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setIsLoadingStudents(false);
        }
    };

    // Toggle student selection
    const toggleStudentSelection = (studentId: string) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    // Select all students
    const selectAllStudents = () => {
        setSelectedStudents(students.map(s => s.id));
    };

    // Deselect all students
    const deselectAllStudents = () => {
        setSelectedStudents([]);
    };

    // Mark a single student as printed
    const markAsPrinted = async (student: any) => {
        if (!firestore) return;

        try {
            // 1. Add to Printed_ID_Cards collection
            await setDoc(doc(firestore, 'Printed_ID_Cards', student.id), {
                ...student,
                cardPrinted: true,
                cardPrintedAt: Timestamp.now(),
                originalKycId: student.id
            });

            // 2. Update KYC_Verifications status
            await updateDoc(doc(firestore, 'KYC_Verifications', student.id), {
                cardPrinted: true,
                cardPrintedAt: Timestamp.now()
            });

            // 3. Refresh list
            // Optimistically remove from list or just refetch
            setStudents(prev => prev.filter(s => s.id !== student.id));

            // Also remove from selected if selected
            if (selectedStudents.includes(student.id)) {
                toggleStudentSelection(student.id);
            }

            toast({
                title: "Marked as Printed",
                description: `Successfully marked ${student.fullName} as printed.`,
                variant: "default",
            });
        } catch (error) {
            console.error('Error marking as printed:', error);
            toast({
                title: "Error",
                description: "Failed to mark student as printed. Please try again.",
                variant: "destructive",
            });
        }
    };

    // Generate and download PDF
    const downloadCardsAsPDF = async () => {
        if (selectedStudents.length === 0) {
            alert('Please select at least one student');
            return;
        }

        setIsGeneratingPDF(true);

        try {
            // Create a new PDF document
            // A4 size: 210mm x 297mm
            // Card size: 85.6mm x 53.98mm (standard ID-1)
            // Create a new PDF document
            // A4 size: 210mm x 297mm
            // Card size: 85.6mm x 53.98mm (standard ID-1)
            const pdfDoc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: [87, 56]
            });

            const selectedData = students.filter(s => selectedStudents.includes(s.id));
            let pageAdded = false;

            for (let i = 0; i < selectedData.length; i++) {
                const student = selectedData[i];

                // Capture Front
                const frontId = `card-front-${student.id}`;
                const frontEl = document.getElementById(frontId);
                if (frontEl) {
                    if (pageAdded) pdfDoc.addPage([87, 56], 'landscape');

                    // Scroll to element to ensure it's rendered correctly
                    frontEl.scrollIntoView();
                    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for rendering

                    const canvas = await html2canvas(frontEl, {
                        scale: 4, // High quality
                        useCORS: true, // Allow loading cross-origin images (Firebase Storage)
                        logging: false,
                        backgroundColor: '#ffffff'
                    } as any);

                    const imgData = canvas.toDataURL('image/png');
                    pdfDoc.addImage(imgData, 'PNG', 0, 0, 87, 56);
                    pageAdded = true;
                }

                // Capture Back
                const backId = `card-back-${student.id}`;
                const backEl = document.getElementById(backId);
                if (backEl) {
                    if (pageAdded) pdfDoc.addPage([87, 56], 'landscape');

                    // Scroll to element
                    backEl.scrollIntoView();
                    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay

                    const canvas = await html2canvas(backEl, {
                        scale: 4,
                        useCORS: true,
                        logging: false,
                        backgroundColor: '#ffffff'
                    } as any);

                    const imgData = canvas.toDataURL('image/png');
                    pdfDoc.addImage(imgData, 'PNG', 0, 0, 87, 56);
                    pageAdded = true;
                }
            }
            pdfDoc.autoPrint();

            // Generate Blob URL
            const pdfBlobUrl = pdfDoc.output('bloburl');
            setGeneratedPdfUrl(pdfBlobUrl);

            // Print via iframe
            const printFrame = document.getElementById('print-frame') as HTMLIFrameElement;
            if (printFrame) {
                printFrame.src = pdfBlobUrl;
                // Wait for PDF to load in iframe then print
                printFrame.onload = () => {
                    if (printFrame.contentWindow) {
                        printFrame.contentWindow.print();
                    }
                };
            }

            // Mark students as printed in Firestore
            if (firestore) {
                const kycCollection = collection(firestore, 'KYC_Verifications');
                const updatePromises = selectedStudents.map(studentId => {
                    const studentDocRef = doc(kycCollection, studentId);
                    return updateDoc(studentDocRef, {
                        cardPrinted: true,
                        cardPrintedAt: Timestamp.now()
                    });
                });

                await Promise.all(updatePromises);

                // Refresh students list to reflect changes
                fetchStudents();
            }

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const selectedFieldData = template.fields.find(f => f.id === selectedField);
    const currentSideFields = template.fields.filter(f => f.side === currentSide);

    // Get selected student data for printing
    const selectedStudentData = students.filter(s => selectedStudents.includes(s.id));

    // Render field value for a student
    const renderFieldValue = (field: CardField, student: any) => {
        // Handle nested field mapping (e.g., 'documents.selfie')
        const getNestedValue = (obj: any, path: string) => {
            return path.split('.').reduce((current, key) => current?.[key], obj);
        };

        // If specific university is selected for preview, try to find a student from that uni
        // This is just for preview rendering if we have a list of students
        // But here 'student' is passed in.

        const value = getNestedValue(student, field.mapping) || '';

        if (field.type === 'image') {
            // For image fields, use the mapped value directly
            const photoUrl = value;

            return photoUrl ? (
                <img
                    src={photoUrl}
                    alt="Student"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    }}
                />
            ) : (
                <div style={{
                    width: '100%',
                    height: '100%',
                    background: '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: '#666',
                }}>
                    No Photo
                </div>
            );
        }

        // For text fields
        return (
            <span style={{
                fontSize: `${field.style?.fontSize || 16}px`,
                fontFamily: field.style?.fontFamily || 'Arial',
                color: field.style?.color || '#000000',
                textAlign: field.style?.textAlign || 'left',
                display: 'block',
                width: '100%',
            }}>
                {value}
            </span>
        );
    };

    // Preview State
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewPage, setPreviewPage] = useState(1);
    const previewItemsPerPage = 1; // Show 1 student at a time

    // Calculate preview pagination
    const previewTotalPages = Math.ceil(selectedStudents.length / previewItemsPerPage);
    const paginatedPreviewStudents = selectedStudents
        .slice((previewPage - 1) * previewItemsPerPage, previewPage * previewItemsPerPage)
        .map(id => students.find(s => s.id === id))
        .filter(Boolean);

    // Reset preview page when opening
    useEffect(() => {
        if (isPreviewOpen) setPreviewPage(1);
    }, [isPreviewOpen]);

    return (
        <>
            {/* Print-only styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-cards, .print-cards * {
                        visibility: visible;
                    }
                    .print-cards {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    @page {
                        size: 87mm 56mm;
                        margin: 0;
                    }
                    .card-print-item {
                        page-break-after: always;
                        width: 87mm !important;
                        height: 56mm !important;
                        position: relative;
                        overflow: hidden;
                        background: white;
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    .card-print-item img {
                        max-width: none !important;
                        max-height: none !important;
                        width: 100% !important;
                        height: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .card-print-item:last-child {
                        page-break-after: auto;
                    }
                }
            `}} />

            {/* Hidden iframe for printing */}
            <iframe id="print-frame" style={{ position: 'absolute', width: 0, height: 0, border: 0 }} />

            {/* Hidden Source for PDF Generation - Always render but keep off-screen */}
            <div
                className="print-cards"
                style={{
                    position: 'fixed',
                    left: '-10000px',
                    top: 0,
                    width: '87mm', // Fixed width for consistent rendering
                    zIndex: -1000
                }}
            >
                {selectedStudentData.map(student => (
                    <React.Fragment key={student.id}>
                        {/* Front side */}
                        <div id={`card-front-${student.id}`} className="card-print-item" style={{ width: '87mm', height: '56mm', position: 'relative', background: 'white', overflow: 'hidden' }}>
                            {frontPreview && (
                                <img
                                    src={frontPreview}
                                    alt="Card Front"
                                    style={{
                                        position: 'absolute',
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover', // Ensure it covers the full card
                                        top: 0,
                                        left: 0,
                                        maxWidth: 'none',
                                    }}
                                />
                            )}
                            {template.fields
                                .filter(f => f.side === 'front')
                                .map(field => {
                                    // Calculate percentages based on the canvas dimensions where the field was placed
                                    // If dimensions are not captured (e.g. direct print without design), fallback to a standard width
                                    // But usually user designs first.
                                    const baseWidth = canvasDimensions.width || 800; // Fallback width
                                    const baseHeight = canvasDimensions.height || (800 / 1.5536);

                                    const leftPercent = (field.position.x / baseWidth) * 100;
                                    const topPercent = (field.position.y / baseHeight) * 100;
                                    const widthPercent = (field.size.width / baseWidth) * 100;
                                    const heightPercent = (field.size.height / baseHeight) * 100;

                                    return (
                                        <div
                                            key={field.id}
                                            style={{
                                                position: 'absolute',
                                                left: `${leftPercent}%`,
                                                top: `${topPercent}%`,
                                                width: `${widthPercent}%`,
                                                height: `${heightPercent}%`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: field.style?.textAlign === 'center' ? 'center' :
                                                    field.style?.textAlign === 'right' ? 'flex-end' : 'flex-start',
                                            }}
                                        >
                                            {renderFieldValue(field, student)}
                                        </div>
                                    );
                                })}
                        </div>

                        {/* Back side */}
                        <div id={`card-back-${student.id}`} className="card-print-item" style={{ width: '87mm', height: '56mm', position: 'relative', background: 'white', overflow: 'hidden' }}>
                            {backPreview && (
                                <img
                                    src={backPreview}
                                    alt="Card Back"
                                    style={{
                                        position: 'absolute',
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        top: 0,
                                        left: 0,
                                        maxWidth: 'none',
                                    }}
                                />
                            )}
                            {template.fields
                                .filter(f => f.side === 'back')
                                .map(field => {
                                    const baseWidth = canvasDimensions.width || 800;
                                    const baseHeight = canvasDimensions.height || (800 / 1.5536);

                                    const leftPercent = (field.position.x / baseWidth) * 100;
                                    const topPercent = (field.position.y / baseHeight) * 100;
                                    const widthPercent = (field.size.width / baseWidth) * 100;
                                    const heightPercent = (field.size.height / baseHeight) * 100;

                                    return (
                                        <div
                                            key={field.id}
                                            style={{
                                                position: 'absolute',
                                                left: `${leftPercent}%`,
                                                top: `${topPercent}%`,
                                                width: `${widthPercent}%`,
                                                height: `${heightPercent}%`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: field.style?.textAlign === 'center' ? 'center' :
                                                    field.style?.textAlign === 'right' ? 'flex-end' : 'flex-start',
                                            }}
                                        >
                                            {renderFieldValue(field, student)}
                                        </div>
                                    );
                                })}
                        </div>
                    </React.Fragment>
                ))}
            </div>

            {/* Main UI */}
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Card Designer</CardTitle>
                        <CardDescription>
                            Design and customize student ID cards with drag-and-drop fields
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                                <TabsTrigger value="upload">1. Upload Template</TabsTrigger>
                                <TabsTrigger value="design">2. Design Fields</TabsTrigger>
                                <TabsTrigger value="print">3. Print Cards</TabsTrigger>
                                <TabsTrigger value="printed">4. Printed ID Cards</TabsTrigger>
                            </TabsList>

                            {/* Tab 1: Upload Template */}
                            <TabsContent value="upload" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Front Side Upload */}
                                    <div className="space-y-2">
                                        <Label>Front Side Design</Label>
                                        <div className="border-2 border-dashed rounded-lg p-4 text-center">
                                            {frontPreview ? (
                                                <div className="space-y-2">
                                                    <img src={frontPreview} alt="Front" className="w-full h-64 object-contain" />
                                                    <Button variant="outline" size="sm" onClick={() => {
                                                        setFrontImage(null);
                                                        setFrontPreview('');
                                                    }}>
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Remove
                                                    </Button>
                                                </div>
                                            ) : (
                                                <label className="cursor-pointer">
                                                    <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                                                    <p className="text-sm text-muted-foreground">Click to upload front design</p>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'front')}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    {/* Back Side Upload */}
                                    <div className="space-y-2">
                                        <Label>Back Side Design</Label>
                                        <div className="border-2 border-dashed rounded-lg p-4 text-center">
                                            {backPreview ? (
                                                <div className="space-y-2">
                                                    <img src={backPreview} alt="Back" className="w-full h-64 object-contain" />
                                                    <Button variant="outline" size="sm" onClick={() => {
                                                        setBackImage(null);
                                                        setBackPreview('');
                                                    }}>
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Remove
                                                    </Button>
                                                </div>
                                            ) : (
                                                <label className="cursor-pointer">
                                                    <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                                                    <p className="text-sm text-muted-foreground">Click to upload back design</p>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'back')}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button disabled={!frontImage || !backImage}>
                                        Continue to Design
                                    </Button>
                                </div>
                            </TabsContent>

                            {/* Tab 2: Design Fields */}
                            <TabsContent value="design" className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant={currentSide === 'front' ? 'default' : 'outline'}
                                            onClick={() => setCurrentSide('front')}
                                        >
                                            Front
                                        </Button>
                                        <Button
                                            variant={currentSide === 'back' ? 'default' : 'outline'}
                                            onClick={() => setCurrentSide('back')}
                                        >
                                            Back
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button onClick={() => addField('text')} size="sm">
                                            <Type className="h-4 w-4 mr-2" />
                                            Add Text
                                        </Button>
                                        <Button onClick={() => addField('image')} size="sm">
                                            <ImageIcon className="h-4 w-4 mr-2" />
                                            Add Image
                                        </Button>
                                        <Button onClick={saveTemplate} variant="default">
                                            <Download className="h-4 w-4 mr-2" />
                                            Save Template
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    {/* Canvas */}
                                    <div className="col-span-2">
                                        <div
                                            ref={canvasRef}
                                            className="relative border-2 rounded-lg overflow-hidden bg-gray-100"
                                            style={{ width: '100%', aspectRatio: '1.5536' }}
                                        >
                                            {canvasDimensions.width > 0 && (
                                                <CardDesignCanvas
                                                    width={canvasDimensions.width}
                                                    height={canvasDimensions.height}
                                                    elements={currentSideFields.map(f => ({
                                                        ...f,
                                                        value: f.type === 'image' ?
                                                            (f.mapping === 'documents.selfie' ? '/placeholder-user.jpg' : f.mapping) :
                                                            f.mapping // Use mapping as text value for designer
                                                    }))}
                                                    onChange={handleCanvasChange}
                                                    selectedElementId={selectedField}
                                                    setSelectedElementId={setSelectedField}
                                                    backgroundImage={currentSide === 'front' ? frontPreview : backPreview}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Field Properties */}
                                    <div className="space-y-4">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-sm">Field Properties</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                {selectedFieldData ? (
                                                    <>
                                                        <div className="space-y-2">
                                                            <Label>Map to Student Data</Label>
                                                            <Select
                                                                value={selectedFieldData.mapping}
                                                                onValueChange={(value) => updateFieldMapping(selectedFieldData.id, value)}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="fullName">Full Name</SelectItem>
                                                                    <SelectItem value="email">Email</SelectItem>
                                                                    <SelectItem value="studentId">Student ID</SelectItem>
                                                                    <SelectItem value="documents.selfie">Photo (Selfie)</SelectItem>
                                                                    <SelectItem value="documents.front">ID Front</SelectItem>
                                                                    <SelectItem value="documents.back">ID Back</SelectItem>
                                                                    <SelectItem value="department">Department</SelectItem>
                                                                    <SelectItem value="enrollmentDate">Enrollment Date</SelectItem>
                                                                    {selectedUniversity && universities.find(u => u.name === selectedUniversity)?.customFields?.map((field: any) => (
                                                                        <SelectItem key={field.key} value={`customFields.${field.key}`}>
                                                                            {field.label} (Custom)
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        {selectedFieldData.type === 'text' && (
                                                            <>
                                                                <div className="space-y-2">
                                                                    <Label>Font Size</Label>
                                                                    <Input
                                                                        type="number"
                                                                        value={selectedFieldData.style?.fontSize || 16}
                                                                        onChange={(e) => updateFieldStyle(selectedFieldData.id, 'fontSize', parseInt(e.target.value))}
                                                                    />
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <Label>Text Color</Label>
                                                                    <Input
                                                                        type="color"
                                                                        value={selectedFieldData.style?.color || '#000000'}
                                                                        onChange={(e) => updateFieldStyle(selectedFieldData.id, 'color', e.target.value)}
                                                                    />
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <Label>Text Align</Label>
                                                                    <Select
                                                                        value={selectedFieldData.style?.textAlign || 'left'}
                                                                        onValueChange={(value) => updateFieldStyle(selectedFieldData.id, 'textAlign', value)}
                                                                    >
                                                                        <SelectTrigger>
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="left">Left</SelectItem>
                                                                            <SelectItem value="center">Center</SelectItem>
                                                                            <SelectItem value="right">Right</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </>
                                                        )}

                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            className="w-full"
                                                            onClick={() => deleteField(selectedFieldData.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete Field
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">
                                                        Select a field to edit its properties
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Tab 3: Print Cards */}
                            <TabsContent value="print" className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold">Select Students</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Choose students to print ID cards for
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {students.length > 0 && (
                                            <>
                                                <Button variant="outline" size="sm" onClick={selectAllStudents}>
                                                    Select All
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={deselectAllStudents}>
                                                    Deselect All
                                                </Button>
                                            </>
                                        )}
                                        <Button onClick={fetchStudents} disabled={isLoadingStudents}>
                                            {isLoadingStudents ? 'Loading...' : 'Load Students'}
                                        </Button>
                                        <div className="flex gap-2">
                                            <Button onClick={downloadCardsAsPDF} disabled={selectedStudents.length === 0 || isGeneratingPDF}>
                                                {isGeneratingPDF ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Preparing Print...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Printer className="h-4 w-4 mr-2" />
                                                        Print Cards
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {students.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                        <Printer className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                                        <h3 className="text-lg font-semibold mb-2">No Students Loaded</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Click "Load Students" to fetch approved students from KYC verifications
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 gap-4">
                                            {paginatedStudentsForList.map(student => (
                                                <Card key={student.id} className={selectedStudents.includes(student.id) ? 'border-blue-500' : ''}>
                                                    <CardContent className="p-4">
                                                        <div className="flex items-center gap-4">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedStudents.includes(student.id)}
                                                                onChange={() => toggleStudentSelection(student.id)}
                                                                className="h-4 w-4"
                                                            />
                                                            <div className="flex-1 grid grid-cols-4 gap-4">
                                                                <div>
                                                                    <p className="text-sm font-medium">Full Name</p>
                                                                    <p className="text-sm text-muted-foreground">{student.fullName || 'N/A'}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium">Email</p>
                                                                    <p className="text-sm text-muted-foreground">{student.email || 'N/A'}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium">Student ID</p>
                                                                    <p className="text-sm text-muted-foreground">{student.studentId || student.id}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium">Status</p>
                                                                    <p className="text-sm text-muted-foreground">{student.status || 'N/A'}</p>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => markAsPrinted(student)}
                                                                className="ml-2"
                                                                title="Mark as Printed"
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>

                                        {/* Student List Pagination */}
                                        {studentListTotalPages > 1 && (
                                            <div className="flex items-center justify-end gap-4">
                                                <div className="flex items-center gap-1 bg-muted/50 rounded-md p-1 border">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setStudentListPage(p => Math.max(1, p - 1))}
                                                        disabled={studentListPage === 1}
                                                        className="h-8 w-8"
                                                    >
                                                        <ChevronLeft className="h-4 w-4" />
                                                    </Button>
                                                    <span className="text-sm font-medium px-3 min-w-[4rem] text-center">
                                                        {studentListPage} / {studentListTotalPages}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setStudentListPage(p => Math.min(studentListTotalPages, p + 1))}
                                                        disabled={studentListPage === studentListTotalPages}
                                                        className="h-8 w-8"
                                                    >
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Inline Preview Section */}
                                        {selectedStudents.length > 0 && (
                                            <div className="mt-8 pt-8 border-t">
                                                <div className="flex items-center justify-between mb-6">
                                                    <div>
                                                        <h3 className="text-lg font-semibold">Card Previews</h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {paginatedPreviewStudents[0]?.fullName || `Previewing ${selectedStudents.length} cards`}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex justify-center">
                                                    {paginatedPreviewStudents.map((student: any) => (
                                                        <div key={student.id} className="w-full max-w-4xl">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                                {/* Front Preview */}
                                                                <div className="relative w-full aspect-[1.5536] border rounded-md overflow-hidden shadow-sm bg-white">
                                                                    {frontPreview && (
                                                                        <img
                                                                            src={frontPreview}
                                                                            alt="Front"
                                                                            className="absolute inset-0 w-full h-full object-cover"
                                                                        />
                                                                    )}
                                                                    {template.fields
                                                                        .filter(f => f.side === 'front')
                                                                        .map(field => {
                                                                            const baseWidth = canvasDimensions.width || 800;
                                                                            const baseHeight = canvasDimensions.height || (800 / 1.5536);
                                                                            const leftPercent = (field.position.x / baseWidth) * 100;
                                                                            const topPercent = (field.position.y / baseHeight) * 100;
                                                                            const widthPercent = (field.size.width / baseWidth) * 100;
                                                                            const heightPercent = (field.size.height / baseHeight) * 100;

                                                                            return (
                                                                                <div
                                                                                    key={field.id}
                                                                                    style={{
                                                                                        position: 'absolute',
                                                                                        left: `${leftPercent}%`,
                                                                                        top: `${topPercent}%`,
                                                                                        width: `${widthPercent}%`,
                                                                                        height: `${heightPercent}%`,
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        justifyContent: field.style?.textAlign === 'center' ? 'center' :
                                                                                            field.style?.textAlign === 'right' ? 'flex-end' : 'flex-start',
                                                                                    }}
                                                                                >
                                                                                    {renderFieldValue(field, student)}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                </div>
                                                                {/* Back Preview */}
                                                                <div className="relative w-full aspect-[1.5536] border rounded-md overflow-hidden shadow-sm bg-white">
                                                                    {backPreview && (
                                                                        <img
                                                                            src={backPreview}
                                                                            alt="Back"
                                                                            className="absolute inset-0 w-full h-full object-cover"
                                                                        />
                                                                    )}
                                                                    {template.fields
                                                                        .filter(f => f.side === 'back')
                                                                        .map(field => {
                                                                            const baseWidth = canvasDimensions.width || 800;
                                                                            const baseHeight = canvasDimensions.height || (800 / 1.5536);
                                                                            const leftPercent = (field.position.x / baseWidth) * 100;
                                                                            const topPercent = (field.position.y / baseHeight) * 100;
                                                                            const widthPercent = (field.size.width / baseWidth) * 100;
                                                                            const heightPercent = (field.size.height / baseHeight) * 100;

                                                                            return (
                                                                                <div
                                                                                    key={field.id}
                                                                                    style={{
                                                                                        position: 'absolute',
                                                                                        left: `${leftPercent}%`,
                                                                                        top: `${topPercent}%`,
                                                                                        width: `${widthPercent}%`,
                                                                                        height: `${heightPercent}%`,
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        justifyContent: field.style?.textAlign === 'center' ? 'center' :
                                                                                            field.style?.textAlign === 'right' ? 'flex-end' : 'flex-start',
                                                                                    }}
                                                                                >
                                                                                    {renderFieldValue(field, student)}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {previewTotalPages > 1 && (
                                                    <div className="flex items-center justify-end gap-4 mt-6">
                                                        <div className="flex items-center gap-1 bg-muted/50 rounded-md p-1 border">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                                                                disabled={previewPage === 1}
                                                                className="h-8 w-8"
                                                            >
                                                                <ChevronLeft className="h-4 w-4" />
                                                            </Button>
                                                            <span className="text-sm font-medium px-3 min-w-[4rem] text-center">
                                                                {previewPage} / {previewTotalPages}
                                                            </span>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setPreviewPage(p => Math.min(previewTotalPages, p + 1))}
                                                                disabled={previewPage === previewTotalPages}
                                                                className="h-8 w-8"
                                                            >
                                                                <ChevronRight className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </TabsContent>

                            {/* Tab 4: Printed ID Cards */}
                            <TabsContent value="printed" className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold">Printed ID Cards</h3>
                                        <p className="text-sm text-muted-foreground">
                                            View and manage students whose ID cards have been printed
                                        </p>
                                    </div>
                                </div>

                                <PrintedCardsTable universities={universities} />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div >
        </>
    );
}

// Sub-component for Printed Cards Table
function PrintedCardsTable({ universities }: { universities: any[] }) {
    const { firestore } = useFirebase();
    const [printedStudents, setPrintedStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUniversity, setSelectedUniversity] = useState('all');
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    // Fetch printed students
    useEffect(() => {
        if (!firestore) return;

        const fetchPrintedStudents = async () => {
            setIsLoading(true);
            try {
                const snapshot = await getDocs(collection(firestore, 'Printed_ID_Cards'));
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setPrintedStudents(data);
            } catch (error) {
                console.error('Error fetching printed cards:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPrintedStudents();
    }, [firestore]);

    const filteredStudents = printedStudents.filter(student => {
        const matchesSearch =
            (student.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (student.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (student.studentId?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchesUniversity = selectedUniversity === 'all' || student.university === selectedUniversity;

        return matchesSearch && matchesUniversity;
    });

    // Pagination
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const paginatedStudents = filteredStudents.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
    );

    if (isLoading) {
        return <div className="text-center py-8">Loading printed cards...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, email, or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-transparent"
                    />
                </div>
                <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter by University" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Universities</SelectItem>
                        {universities.map(uni => (
                            <SelectItem key={uni.id} value={uni.name}>{uni.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="border rounded-md">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="h-10 px-4 text-left font-medium">Full Name</th>
                            <th className="h-10 px-4 text-left font-medium">University</th>
                            <th className="h-10 px-4 text-left font-medium">Student ID</th>
                            <th className="h-10 px-4 text-left font-medium">Printed Date</th>
                            <th className="h-10 px-4 text-left font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedStudents.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No printed cards found
                                </td>
                            </tr>
                        ) : (
                            paginatedStudents.map(student => (
                                <tr key={student.id} className="border-b last:border-0 hover:bg-muted/50">
                                    <td className="p-4 font-medium">{student.fullName}</td>
                                    <td className="p-4">{student.university || 'N/A'}</td>
                                    <td className="p-4">{student.studentId || 'N/A'}</td>
                                    <td className="p-4">
                                        {student.cardPrintedAt?.seconds
                                            ? new Date(student.cardPrintedAt.seconds * 1000).toLocaleDateString()
                                            : 'Unknown'}
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                            Printed
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase/client';
import { collection, doc, setDoc, addDoc, Timestamp } from 'firebase/firestore';
import { customAlphabet } from 'nanoid';

const schema = z.object({
    studentName: z.string().min(1, 'Name is required'),
    studentId: z.string().min(1, 'Student ID is required'),
    email: z.string().email('Invalid email address'),
    description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function ReportForm({ onSuccess }: { onSuccess?: (ticketCode: string) => void }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ticketCode, setTicketCode] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const firestore = useFirestore();
    const { user } = useUser();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        setError(null);
        try {
            // Generate a 6-character alphanumeric code
            const nanoid = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 6);
            const code = nanoid();

            const docRef = doc(collection(firestore, 'missing_cards'));
            const docData: any = {
                ...data,
                ticketCode: code,
                status: 'pending',
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };

            // Only add uid if user is authenticated
            if (user?.uid) {
                docData.uid = user.uid;
            }

            await setDoc(docRef, docData);

            // Create notification for admin
            await addDoc(collection(firestore, 'notifications'), {
                title: 'New Missing Card Report',
                message: `Student ${data.studentName} (${data.studentId}) reported a missing card.`,
                type: 'warning',
                read: false,
                createdAt: Timestamp.now(),
                link: '/admin/missing-cards'
            });

            setTicketCode(code);
            reset();
            if (onSuccess) {
                onSuccess(code);
            }
        } catch (e: any) {
            console.error('Error submitting report:', e);
            setError(e.message || 'Failed to submit ticket');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (ticketCode) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center"
            >
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">
                    Report Submitted Successfully!
                </h3>
                <p className="text-green-700 dark:text-green-300 mb-4">
                    Your ticket has been created. Please save your ticket code to check the status later.
                </p>
                <div className="bg-white dark:bg-black border border-green-200 dark:border-green-800 rounded p-4 mb-4">
                    <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Ticket Code</span>
                    <span className="text-3xl font-mono font-bold tracking-wider text-green-600 dark:text-green-400">
                        {ticketCode}
                    </span>
                </div>
                <button
                    onClick={() => setTicketCode(null)}
                    className="text-sm text-green-600 dark:text-green-400 hover:underline"
                >
                    Submit another report
                </button>
            </motion.div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3 text-red-800 dark:text-red-200">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Student Name</label>
                    <input
                        {...register('studentName')}
                        className="w-full px-3 py-2 border rounded-md bg-background border-input focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="John Doe"
                    />
                    {errors.studentName && (
                        <p className="text-xs text-red-500">{errors.studentName.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Student ID</label>
                    <input
                        {...register('studentId')}
                        className="w-full px-3 py-2 border rounded-md bg-background border-input focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="12345678"
                    />
                    {errors.studentId && (
                        <p className="text-xs text-red-500">{errors.studentId.message}</p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <input
                    {...register('email')}
                    type="email"
                    className="w-full px-3 py-2 border rounded-md bg-background border-input focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="john.doe@university.edu"
                />
                {errors.email && (
                    <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Description (Optional)</label>
                <textarea
                    {...register('description')}
                    className="w-full px-3 py-2 border rounded-md bg-background border-input focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[100px]"
                    placeholder="Describe the lost card or where you might have lost it..."
                />
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                    </>
                ) : (
                    'Submit Report'
                )}
            </button>
        </form>
    );
}

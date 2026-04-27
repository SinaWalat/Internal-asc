'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase/client';
import { GradientBackground } from '@/components/ui/gradient-background';


const formSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email address.' }),
});

export default function ForgotPasswordPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isSuccess, setIsSuccess] = React.useState(false);
    const { auth } = useFirebase();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!auth) {
            toast({
                variant: 'destructive',
                title: 'System Error',
                description: 'Authentication service is not available.',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: values.email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send reset email');
            }

            setIsSuccess(true);
            toast({
                title: 'Email Sent',
                description: 'Check your inbox for password reset instructions.',
            });
        } catch (error: any) {
            console.error('Password reset error:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to send reset email.',
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center bg-white antialiased pt-28 pb-12 px-4 overflow-y-auto">
            {/* Premium subtle background accents */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-50/50 via-white to-white pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-gray-50 via-white to-white pointer-events-none" />

            <div className="relative z-10 w-full max-w-[420px] my-auto">


                <Card className="border-gray-100/50 bg-white/80 backdrop-blur-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] rounded-3xl overflow-hidden">
                    <CardHeader className="space-y-4 text-center pb-2 pt-8">
                        <div className="space-y-2">
                            <CardTitle className="text-2xl font-semibold tracking-tight text-gray-900">
                                {isSuccess ? 'Check your inbox' : 'Forgot Password?'}
                            </CardTitle>
                            <CardDescription className="text-base text-gray-500 px-4">
                                {isSuccess
                                    ? 'We have sent a password reset link to your email.'
                                    : 'Enter your email to receive instructions to reset your password.'}
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        {isSuccess ? (
                            <div className="flex flex-col items-center justify-center space-y-6 py-4">
                                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center ring-1 ring-green-200/50 shadow-sm shadow-green-100">
                                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                                </div>
                                <Button
                                    onClick={() => router.push('/login')}
                                    className="w-full h-12 text-base font-semibold shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white rounded-xl border-0"
                                >
                                    Return to Login
                                </Button>
                            </div>
                        ) : (
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-gray-700">Email</FormLabel>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-orange-500 group-focus-within:scale-110 transition-all duration-300" />
                                                        <Input
                                                            placeholder="student@example.com"
                                                            {...field}
                                                            className="pl-11 h-12 bg-gray-50/50 border-gray-200/60 hover:bg-gray-50 hover:border-gray-300 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 focus:shadow-[0_0_15px_-3px_rgba(249,115,22,0.15)] transition-all duration-300 text-gray-900 rounded-xl"
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-xs text-red-500" />
                                            </FormItem>
                                        )}
                                    />
                                    
                                    <div className="pt-2">
                                        <Button
                                            type="submit"
                                            className="w-full h-12 text-base font-semibold shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white rounded-xl border-0"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Sending Link...
                                                </>
                                            ) : (
                                                <>
                                                    Send Reset Link
                                                    <ArrowRight className="ml-2 h-5 w-5" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        )}
                    </CardContent>
                    {!isSuccess && (
                        <CardFooter className="flex flex-col space-y-4 pb-8">
                            <div className="text-center text-sm font-medium text-gray-500">
                                Remember your password?{' '}
                                <Link
                                    href="/login"
                                    className="font-semibold text-orange-500 hover:text-orange-600 hover:underline transition-colors"
                                >
                                    Sign in
                                </Link>
                            </div>
                        </CardFooter>
                    )}
                </Card>

                <div className="mt-10 text-center text-xs text-gray-400/80 font-medium tracking-wide uppercase">
                    <p>© 2024 Acme Inc. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}

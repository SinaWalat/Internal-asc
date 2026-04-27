'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Lock, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
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
    password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

function ResetPasswordContent() {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const oobCode = searchParams.get('oobCode');
    const { auth } = useFirebase();

    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isSuccess, setIsSuccess] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
    const [email, setEmail] = React.useState<string | null>(null);
    const [isVerifying, setIsVerifying] = React.useState(true);
    const [isInvalidCode, setIsInvalidCode] = React.useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    });

    React.useEffect(() => {
        const verifyCode = async () => {
            if (!oobCode || !auth) {
                setIsVerifying(false);
                if (!oobCode) setIsInvalidCode(true);
                return;
            }

            try {
                const email = await verifyPasswordResetCode(auth, oobCode);
                setEmail(email);
            } catch (error) {
                console.error('Invalid code:', error);
                setIsInvalidCode(true);
            } finally {
                setIsVerifying(false);
            }
        };

        verifyCode();
    }, [oobCode, auth]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!auth || !oobCode) return;

        setIsSubmitting(true);
        try {
            await confirmPasswordReset(auth, oobCode, values.password);
            setIsSuccess(true);
            toast({
                title: 'Password Reset Successful',
                description: 'You can now log in with your new password.',
            });
        } catch (error: any) {
            console.error('Reset password error:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to reset password.',
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isVerifying) {
        return (
            <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-white antialiased">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-50/50 via-white to-white" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-gray-50 via-white to-white" />
                <Loader2 className="relative z-10 h-10 w-10 animate-spin text-orange-500" />
            </div>
        );
    }

    if (isInvalidCode) {
        return (
            <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-white antialiased">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-50/50 via-white to-white" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-gray-50 via-white to-white" />
                
                <Card className="relative z-10 w-full max-w-[420px] mx-4 border-gray-100/50 bg-white/80 backdrop-blur-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] rounded-3xl overflow-hidden py-4">
                    <CardHeader>
                        <CardTitle className="text-center text-xl font-semibold tracking-tight text-red-500">Invalid or Expired Link</CardTitle>
                        <CardDescription className="text-center text-gray-500 mt-2 px-2">
                            This password reset link is invalid or has expired. Please request a new one.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-center pt-4 pb-2">
                        <Button 
                            onClick={() => router.push('/forgot-password')}
                            className="h-11 px-8 font-semibold shadow-md shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white rounded-xl border-0"
                        >
                            Request New Link
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-white antialiased">
            {/* Premium subtle background accents */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-50/50 via-white to-white" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-gray-50 via-white to-white" />

            <div className="relative z-10 w-full max-w-[420px] px-4 py-8">
                <div className="flex flex-col items-center mb-10">
                    <Link href="/" className="flex flex-col items-center gap-4 transition-transform hover:scale-105">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center ring-1 ring-orange-200/50 shadow-sm shadow-orange-100">
                            <CheckCircle2 className="h-7 w-7 text-orange-500" />
                        </div>
                        <span className="font-semibold text-2xl tracking-tight text-gray-900">Acme Inc.</span>
                    </Link>
                </div>

                <Card className="border-gray-100/50 bg-white/80 backdrop-blur-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] rounded-3xl overflow-hidden">
                    <CardHeader className="space-y-4 text-center pb-2 pt-8">
                        <div className="space-y-2">
                            <CardTitle className="text-2xl font-semibold tracking-tight text-gray-900">
                                {isSuccess ? 'Password Reset Complete' : 'New Password'}
                            </CardTitle>
                            <CardDescription className="text-base text-gray-500 px-4">
                                {isSuccess
                                    ? 'Your password has been successfully updated.'
                                    : email ? `Resetting password for ${email}` : 'Please choose a strong password.'}
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
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-gray-700">New Password</FormLabel>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                                                        <Input
                                                            type={showPassword ? 'text' : 'password'}
                                                            placeholder="••••••••"
                                                            {...field}
                                                            className="pl-11 pr-12 h-12 bg-gray-50/50 border-gray-200/60 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-gray-900 rounded-xl"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="absolute right-1 top-1 h-10 w-10 p-0 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                        >
                                                            {showPassword ? (
                                                                <EyeOff className="h-4.5 w-4.5" />
                                                            ) : (
                                                                <Eye className="h-4.5 w-4.5" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-xs text-red-500" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-gray-700">Confirm Password</FormLabel>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                                                        <Input
                                                            type={showConfirmPassword ? 'text' : 'password'}
                                                            placeholder="••••••••"
                                                            {...field}
                                                            className="pl-11 pr-12 h-12 bg-gray-50/50 border-gray-200/60 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-gray-900 rounded-xl"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="absolute right-1 top-1 h-10 w-10 p-0 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        >
                                                            {showConfirmPassword ? (
                                                                <EyeOff className="h-4.5 w-4.5" />
                                                            ) : (
                                                                <Eye className="h-4.5 w-4.5" />
                                                            )}
                                                        </Button>
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
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    Reset Password
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

export default function ResetPasswordPage() {
    return (
        <React.Suspense fallback={
            <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-white antialiased">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-50/50 via-white to-white" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-gray-50 via-white to-white" />
                <Loader2 className="relative z-10 h-10 w-10 animate-spin text-orange-500" />
            </div>
        }>
            <ResetPasswordContent />
        </React.Suspense>
    );
}

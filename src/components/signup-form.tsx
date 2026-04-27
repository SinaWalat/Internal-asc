'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, UserPlus, Eye, EyeOff, Mail, Lock, User, Wind } from 'lucide-react';
import * as React from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { useRouter } from 'next/navigation';
import { useRegistration } from '@/context/registration-context';
import { sendOtp } from '@/ai/flows/send-otp-flow';
import { useFirebase } from '@/firebase/client';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

import { fetchSignInMethodsForEmail } from 'firebase/auth';

const formSchema = z
  .object({
    firstName: z.string().min(1, { message: 'First name is required.' }),
    lastName: z.string().min(1, { message: 'Last name is required.' }),
    email: z.string().email({ message: 'Please enter a valid email.' }),
    password: z.string()
      .min(8, { message: 'Password must be at least 8 characters.' })
      .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  });

export function SignUpForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const { setRegistrationData } = useRegistration();
  const { firestore, auth } = useFirebase(); // Get firestore and auth instance

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Database service is not available. Please try again later.'
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // 0. Check if email already exists using client SDK
      // Note: This requires "Email Enumeration Protection" to be disabled in Firebase Console
      // or it will always return empty.
      if (auth) {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, values.email);
          if (methods.length > 0) {
            toast({
              variant: 'destructive',
              title: 'Email Already Registered',
              description: 'This email is already in use. Please sign in instead.',
            });
            setIsSubmitting(false);
            return;
          }
        } catch (e) {
          console.warn("fetchSignInMethodsForEmail failed", e);
          // If this fails, we proceed to OTP to avoid blocking the user 
          // (e.g. if protection is enabled, this might fail or return empty)
        }
      }

      // 1. Generate a 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000);
      const otpString = otpCode.toString();

      // 2. Save OTP to Firestore from the client with the new schema
      const otpId = uuidv4();
      const otpDocRef = doc(firestore, 'otp_verifications', otpId);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now

      const otpData = {
        id: otpId,
        email: values.email, // Using email since user_id doesn't exist yet
        code: otpCode,
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        verified: false,
      };

      await setDoc(otpDocRef, otpData).catch(serverError => {
        const permissionError = new FirestorePermissionError({
          path: otpDocRef.path,
          operation: 'create',
          requestResourceData: otpData,
        });
        errorEmitter.emit('permission-error', permissionError);
        // Re-throw a user-friendly error
        throw new Error('There was an issue saving the verification code.');
      });

      // 3. Store form data in context for the next step
      setRegistrationData({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        otp: otpString,
      });

      // 4. Send OTP via email using the Genkit flow
      await sendOtp({ email: values.email, otp: otpString });

      toast({
        title: 'OTP Sent!',
        description: 'A verification code has been sent to your email.',
      });

      // 5. Redirect to the verification page
      router.push('/signup/verify');

    } catch (error: any) {
      console.error('Sign-up error:', error);
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (error.message.includes('saving the verification code')) {
        errorMessage = 'Could not save verification details. Please check your connection and try again.';
      } else if (error.message.includes('sending the verification email')) {
        errorMessage = 'Could not send verification email. Please ensure your email is correct.';
      }

      toast({
        variant: 'destructive',
        title: 'Sign-up Failed',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full border-gray-100/50 bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] rounded-[2rem] overflow-hidden flex flex-col md:flex-row">
      {/* Left Side: Form */}
      <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center">
        <div className="flex flex-col mb-5">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">Create an Account</h1>
          <p className="text-gray-500 text-sm">Enter your details below to begin registration.</p>
        </div>

        <div className="w-full">
          <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">First Name</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <User className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-orange-500 group-focus-within:scale-110 transition-all duration-300" />
                        <Input placeholder="John" {...field} disabled={isSubmitting} className="pl-11 h-12 bg-gray-50/50 border-gray-200/60 hover:bg-gray-50 hover:border-gray-300 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 focus:shadow-[0_0_15px_-3px_rgba(249,115,22,0.15)] transition-all duration-300 text-gray-900 rounded-xl" />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Last Name</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <User className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-orange-500 group-focus-within:scale-110 transition-all duration-300" />
                        <Input placeholder="Doe" {...field} disabled={isSubmitting} className="pl-11 h-12 bg-gray-50/50 border-gray-200/60 hover:bg-gray-50 hover:border-gray-300 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 focus:shadow-[0_0_15px_-3px_rgba(249,115,22,0.15)] transition-all duration-300 text-gray-900 rounded-xl" />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Email Address</FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-orange-500 group-focus-within:scale-110 transition-all duration-300" />
                      <Input
                        type="email"
                        placeholder="john.doe@example.com"
                        {...field}
                        disabled={isSubmitting}
                        className="pl-11 h-12 bg-gray-50/50 border-gray-200/60 hover:bg-gray-50 hover:border-gray-300 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 focus:shadow-[0_0_15px_-3px_rgba(249,115,22,0.15)] transition-all duration-300 text-gray-900 rounded-xl"
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Password</FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-orange-500 group-focus-within:scale-110 transition-all duration-300" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...field}
                        disabled={isSubmitting}
                        className="pl-11 pr-11 h-12 bg-gray-50/50 border-gray-200/60 hover:bg-gray-50 hover:border-gray-300 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 focus:shadow-[0_0_15px_-3px_rgba(249,115,22,0.15)] transition-all duration-300 text-gray-900 rounded-xl"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-10 w-10 px-0 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">Toggle password visibility</span>
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
                      <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-orange-500 group-focus-within:scale-110 transition-all duration-300" />
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...field}
                        disabled={isSubmitting}
                        className="pl-11 pr-11 h-12 bg-gray-50/50 border-gray-200/60 hover:bg-gray-50 hover:border-gray-300 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 focus:shadow-[0_0_15px_-3px_rgba(249,115,22,0.15)] transition-all duration-300 text-gray-900 rounded-xl"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-10 w-10 px-0 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">Toggle password visibility</span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )}
            />
            <div className="pt-2">
              <Button type="submit" className="w-full h-12 text-base font-semibold shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white rounded-xl border-0" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-5 w-5" />
                    Sign Up & Verify
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
      
      <div className="mt-5 pt-4 border-t border-gray-100">
        <div className="text-sm text-gray-500">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="font-semibold text-orange-500 hover:text-orange-600 transition-colors"
          >
            Sign in instead
          </button>
        </div>
      </div>
    </div>

    {/* Right Side: Branding/Visual */}
    <div className="hidden md:flex w-full md:w-1/2 bg-gradient-to-br from-orange-500 via-orange-400 to-orange-500 p-8 flex-col justify-between text-white relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-80 h-80 bg-orange-600/30 rounded-full blur-3xl"></div>
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>

      <div className="relative z-10">
        <h2 className="text-3xl lg:text-4xl font-extrabold mb-3 leading-tight tracking-tight">Begin Your Journey</h2>
        <p className="text-orange-50 text-sm leading-relaxed font-light max-w-md">
          Create an account to gain instant access to your personalized student dashboard, academic resources, and campus services.
        </p>
      </div>
      
      <div className="relative z-10 mt-6">
        <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
          <p className="text-xs text-orange-50 font-medium italic leading-relaxed mb-3">
            "Acme Inc. simplified my university life. From scheduling classes to secure campus access, everything is right here."
          </p>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-orange-200/20 border border-white/30 flex items-center justify-center">
              <span className="font-bold text-xs">MC</span>
            </div>
            <div>
              <p className="text-sm font-bold leading-none">Michael Chen</p>
              <p className="text-[10px] text-orange-100 mt-1">Graduate Student</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Card>
  );
}

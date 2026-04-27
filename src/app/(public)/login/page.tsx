'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, LogIn, Wind, Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import { signInWithEmailAndPassword, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function StudentLoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const { auth, firestore } = useFirebase();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const checkStudentAndRedirect = async (user: User) => {
    if (!firestore) {
      throw new Error('Firestore is not available.');
    }
    const profileRef = doc(firestore, 'profiles', user.uid);

    const docSnap = await getDoc(profileRef);

    if (docSnap.exists()) {
      const profileData = docSnap.data();
      toast({
        title: 'Welcome back!',
        description: 'Redirecting to your dashboard...',
      });

      // Check for redirect parameter
      const searchParams = new URLSearchParams(window.location.search);
      const redirectTo = searchParams.get('redirect');

      // If profile is incomplete, redirect to profile completion
      if (!profileData.university) {
        router.push('/student/dashboard');
      } else if (redirectTo) {
        // Redirect to the specified page
        router.push(redirectTo);
      } else {
        router.push('/student/dashboard');
      }
    } else {
      // Not a student, sign out
      if (auth) {
        await auth.signOut();
      }
      throw new Error('No student account found for this email.');
    }
  };

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
      const userCredential = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      await checkStudentAndRedirect(userCredential.user);
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Invalid email or password.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.message === 'No student account found for this email.') {
        errorMessage = 'This account is not registered as a student.';
      }

      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center bg-white antialiased pt-28 pb-12 px-4 overflow-y-auto">
      {/* Premium subtle background accents */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-50/50 via-white to-white pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-gray-50 via-white to-white pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-5xl my-auto"
      >
        <Card className="border-gray-100/50 bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] rounded-[2rem] overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Side: Form */}
          <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center">
            <div className="flex flex-col mb-6">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">Welcome Back</h1>
              <p className="text-gray-500 text-sm">
                Please sign in to your student portal
              </p>
            </div>

            <div className="w-full">
              <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center justify-between text-sm font-medium text-gray-700">
                        Password
                        <Link
                          href="/forgot-password"
                          className="text-xs text-orange-500 hover:text-orange-600 hover:underline transition-colors font-medium"
                        >
                          Forgot password?
                        </Link>
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-orange-500 group-focus-within:scale-110 transition-all duration-300" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            {...field}
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
                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white rounded-xl border-0"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
              </Form>
            </div>
            
            <div className="mt-6 pt-5 border-t border-gray-100">
              <div className="text-sm text-gray-500">
                Don&apos;t have an account?{' '}
                <Link
                  href="/signup"
                  className="font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                >
                  Sign up for free
                </Link>
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
              <h2 className="text-3xl lg:text-4xl font-extrabold mb-3 leading-tight tracking-tight">Empower Your Education</h2>
              <p className="text-orange-50 text-sm leading-relaxed font-light max-w-md">
                Join the most advanced university management platform. Manage your ID, access campus resources, and connect with your institution seamlessly.
              </p>
            </div>
            
            <div className="relative z-10 mt-6">
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
                <p className="text-xs text-orange-50 font-medium italic leading-relaxed mb-3">
                  "This platform completely transformed how our university handles student identity and access. It's incredibly intuitive and secure."
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-orange-200/20 border border-white/30 flex items-center justify-center">
                    <span className="font-bold text-xs">SD</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-none">Sarah Davis</p>
                    <p className="text-[10px] text-orange-100 mt-1">University Administrator</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-6 text-center text-xs text-gray-400/80 font-medium tracking-wide uppercase">
          <p>© 2024 Acme Inc. All rights reserved.</p>
        </div>
      </motion.div>
    </div>
  );
}

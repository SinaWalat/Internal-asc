
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, LogIn, Eye, EyeOff, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { signInWithEmailAndPassword, User, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { collection, getDocs, query, where, FirestoreError } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
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
import { useFirebase, useUser } from '@/firebase/client';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function AdminLoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const { auth, firestore } = useFirebase();
  const { user: currentUser, isUserLoading } = useUser();

  // Redirect if already logged in
  React.useEffect(() => {
    if (!isUserLoading && currentUser) {
      router.replace('/admin/dashboard');
    }
  }, [isUserLoading, currentUser, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const checkAdminAndRedirect = async (user: User) => {
    if (!firestore) {
      throw new Error('Firestore is not available.');
    }
    const adminsRef = collection(firestore, 'admins');
    const q = query(adminsRef, where('email', '==', user.email));

    try {
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        if (auth) {
          await auth.signOut();
        }
        // Explicit error for non-admins
        throw new Error('You do not have permission to access this area.');
      }

      toast({
        title: 'Login Successful',
        description: 'Redirecting to your dashboard...',
      });
      router.push('/admin/dashboard');

    } catch (error) {
      if (error instanceof FirestoreError && error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
          path: 'admins',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        // Re-throw a more user-friendly error after emitting
        throw new Error('You do not have permission to verify admin status.');
      }
      // Re-throw other errors, including our custom "permission" error
      throw error;
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'Authentication service is not available.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await setPersistence(auth, browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      await checkAdminAndRedirect(userCredential.user);
    } catch (error: any) {
      let description = 'An unexpected error occurred. Please try again.';
      // Handle standard firebase auth errors
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = 'Invalid email or password. Please check your credentials and try again.';
        // Handle our custom error for non-admins
      } else if (error.message === 'You do not have permission to access this area.') {
        description = error.message;
      } else if (error.message) {
        // Handle other thrown errors
        description = error.message;
      }

      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: description,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
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
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">Admin Portal</h1>
              <p className="text-gray-500 text-sm">
                Secure access for administrative personnel
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
                            type="email"
                            placeholder="admin@example.com"
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
                            type={showPassword ? 'text' : 'password'}
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
                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white rounded-xl border-0"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Verifying Admin...
                      </>
                    ) : (
                      <>
                        Secure Sign In
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
              </Form>
            </div>
          </div>

          {/* Right Side: Branding/Visual */}
          <div className="hidden md:flex w-full md:w-1/2 bg-gradient-to-br from-orange-500 via-orange-400 to-orange-500 p-8 flex-col justify-between text-white relative overflow-hidden">
            {/* Background patterns */}
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-80 h-80 bg-orange-600/30 rounded-full blur-3xl"></div>
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>

            <div className="relative z-10 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-white" />
              <span className="font-bold tracking-widest uppercase text-xs text-orange-100">Security Checkpoint</span>
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl lg:text-4xl font-extrabold mb-3 leading-tight tracking-tight">System Administration</h2>
              <p className="text-orange-50 text-sm leading-relaxed font-light max-w-md">
                This is a restricted access area. Unauthorized attempts to bypass security will be logged and reported. Ensure you are connected over a secure network.
              </p>
            </div>
            
            <div className="relative z-10 mt-6">
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                  <p className="text-xs text-orange-50 font-medium">All systems operational and secure</p>
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

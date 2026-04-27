
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, ShieldCheck } from 'lucide-react';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';

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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useUser } from '@/firebase/client';
import { useRegistration } from '@/context/registration-context';
import Link from 'next/link';
import { Wind } from 'lucide-react';
import { createUser } from '@/ai/flows/create-user-flow';
import { SpotlightBackground } from '@/components/ui/spotlight-background';

const FormSchema = z.object({
  pin: z.string().min(6, {
    message: "Your one-time password must be 6 characters.",
  }),
})

export default function OtpVerificationPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { user } = useUser();
  const [shouldRedirect, setShouldRedirect] = React.useState(false);
  const { auth, firestore } = useFirebase();
  const { registrationData, setRegistrationData } = useRegistration();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      pin: "",
    },
  });

  // Redirect if registration data is missing
  React.useEffect(() => {
    if (!registrationData) {
      router.replace('/signup');
    }
  }, [registrationData, router]);

  // Redirect when user is authenticated and we are ready to redirect
  React.useEffect(() => {
    if (shouldRedirect && user) {
      router.push('/student/dashboard');
    }
  }, [shouldRedirect, user, router]);

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!registrationData || !auth || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Registration session expired or is invalid. Please start over.',
      });
      router.push('/signup');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Verify OTP from Firestore.
      const otpQuery = query(
        collection(firestore, 'otp_verifications'),
        where('email', '==', registrationData.email),
        where('code', '==', parseInt(data.pin, 10)),
        where('verified', '==', false)
      );

      const otpSnapshot = await getDocs(otpQuery);

      if (otpSnapshot.empty) {
        toast({ variant: 'destructive', title: 'Invalid or Expired OTP', description: 'The code you entered is incorrect or has expired.' });
        form.setError('pin', { message: 'Invalid OTP' });
        setIsSubmitting(false);
        return;
      }

      const otpDoc = otpSnapshot.docs[0];
      const otpData = otpDoc.data();

      if (new Date(otpData.expires_at) < new Date()) {
        toast({ variant: 'destructive', title: 'OTP Expired', description: 'Please request a new code.' });
        router.push('/signup');
        setIsSubmitting(false);
        return;
      }

      // OTP is valid, proceed with user creation

      // 2. Create user and profile using the client-side function
      await createUser(auth, firestore, {
        email: registrationData.email,
        password: registrationData.password,
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
      });

      // 3. Mark the OTP as verified
      await updateDoc(otpDoc.ref, { verified: true });

      toast({
        title: 'Account Verified!',
        description: "Please complete your profile.",
      });

      // 4. Clean up registration data and signal redirection
      setRegistrationData(null);
      setShouldRedirect(true);
      // Do NOT router.push here immediately. Let the useEffect handle it when 'user' is available.

    } catch (error: any) {
      console.error("Verification/Creation Error:", error);
      let description = 'An unexpected error occurred. Please try again.';

      if (error.code === 'auth/email-already-in-use' || (error.message && error.message.includes('auth/email-already-in-use'))) {
        description = 'This email is already in use. Please sign in instead.';
        toast({
          variant: 'destructive',
          title: 'Sign-up Failed',
          description: description,
        });
        setRegistrationData(null); // Clear registration data
        router.push('/student/dashboard'); // Redirect to dashboard
        return; // Stop further execution
      } else if (error.message && (error.message.includes('Invalid') || error.message.includes('incorrect'))) {
        description = 'The code you entered is incorrect.';
      }

      toast({
        variant: 'destructive',
        title: 'Sign-up Failed',
        description: description,
      });
      setIsSubmitting(false); // Only reset submitting if error. If success, we want to keep it true/loading while redirecting.

    }
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
              <Wind className="h-7 w-7 text-orange-500" />
            </div>
            <span className="font-semibold text-2xl tracking-tight text-gray-900">Acme Inc.</span>
          </Link>
        </div>

        <Card className="border-gray-100/50 bg-white/80 backdrop-blur-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] rounded-3xl overflow-hidden">
          <CardHeader className="space-y-4 text-center pb-2 pt-8">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center mb-2 ring-1 ring-orange-200/50 shadow-sm shadow-orange-100">
              <ShieldCheck className="h-8 w-8 text-orange-500" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-semibold tracking-tight text-gray-900">Check your email</CardTitle>
              <CardDescription className="text-base text-gray-500 px-4">
                We've sent a 6-digit verification code to <br />
                <span className="font-medium text-gray-900">{registrationData?.email || 'your email'}</span>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="pin"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex justify-center">
                          <InputOTP maxLength={6} {...field}>
                            <InputOTPGroup className="gap-2 sm:gap-3">
                              {[0, 1, 2, 3, 4, 5].map((index) => (
                                <InputOTPSlot
                                  key={index}
                                  index={index}
                                  className="h-12 w-10 sm:h-14 sm:w-12 text-lg sm:text-xl font-semibold border-2 border-gray-200/60 bg-gray-50/50 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all rounded-xl text-gray-900 shadow-sm"
                                />
                              ))}
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                      </FormControl>
                      <FormMessage className="text-center text-xs text-red-500" />
                    </FormItem>
                  )}
                />

                <div className="space-y-5 pt-2">
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white rounded-xl border-0"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify Account"
                    )}
                  </Button>

                  <p className="text-center text-sm text-gray-500">
                    Didn't receive the code?{' '}
                    <Button variant="link" className="p-0 h-auto font-semibold text-orange-500 hover:text-orange-600 transition-colors" disabled={isSubmitting}>
                      Click to resend
                    </Button>
                  </p>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="mt-10 text-center text-xs text-gray-400/80 font-medium tracking-wide uppercase">
          <p>Secure verification powered by Acme Inc.</p>
        </div>
      </div>
    </div>
  );
}

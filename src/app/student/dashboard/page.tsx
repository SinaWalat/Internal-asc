'use client';

import { useUser } from '@/firebase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, AlertCircle, User, ArrowRight } from 'lucide-react';
import { DigitalIDCard } from '@/components/id-card/digital-id-card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { KYCForm } from "@/components/kyc-form";
import { useStudentDashboardData } from '@/hooks/use-student-data';
import { ProfileForm } from '@/components/profile-form';

interface KYCData {
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: any;
    paymentId: string;
}

interface ProfileData {
    firstName?: string;
    lastName?: string;
    university: string;
    dateOfBirth: string;
    bloodGroup: string;
}

export default function StudentDashboard() {
    const { user, isUserLoading } = useUser();
    const { kycData, profileData, loading } = useStudentDashboardData();

    // Only show skeleton if we're loading AND don't have any cached data
    if (isUserLoading || (loading && !kycData && !profileData)) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                </div>
            </div>
        );
    }

    const isProfileComplete = !!(profileData?.university && profileData?.bloodGroup);

    const steps = [
        { title: 'Profile Completed', status: isProfileComplete ? 'completed' : 'pending' },
        { title: 'KYC Verification', status: kycData ? 'completed' : isProfileComplete ? 'pending' : 'locked' },
        { title: 'Payment', status: kycData ? 'completed' : 'locked' },
        { title: 'ID Card Print', status: kycData?.status === 'approved' ? 'completed' : kycData?.status === 'rejected' ? 'error' : kycData ? 'pending' : 'locked' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Welcome back, <span style={{ color: 'hsl(262, 83%, 58%)' }}>{profileData?.firstName || user?.displayName?.split(' ')[0] || 'Student'}</span>!
                </h1>
                <p className="text-muted-foreground">Here is an overview of your application status.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Application Status Stepper (Vertical) */}
                <Card className="h-full border-border shadow-sm">
                    <CardHeader>
                        <CardTitle>Application Progress</CardTitle>
                        <CardDescription>Track the status of your ID card application.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col pt-2 pl-2">
                            {steps.map((step, index) => (
                                <div key={index} className="relative pb-10 last:pb-0">
                                    {/* Connecting Line */}
                                    {index < steps.length - 1 && (
                                        <div className={`absolute left-[31px] top-[56px] bottom-[-24px] w-0.5 transition-colors duration-500 ${steps[index + 1].status !== 'locked' ? 'bg-muted' : 'bg-muted/30'} ${steps[index].status === 'completed' ? 'bg-primary' : ''}`} />
                                    )}

                                    <div className="flex items-center gap-6 p-2 rounded-lg transition-all">
                                        <div className={`
                                            relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 shadow-sm transition-all duration-300
                                            ${step.status === 'completed' ? 'border-primary bg-primary text-primary-foreground scale-110' :
                                                step.status === 'error' ? 'border-destructive bg-destructive text-destructive-foreground' :
                                                    step.status === 'locked' ? 'border-muted/30 bg-muted/10 text-muted-foreground/30' :
                                                        'border-muted bg-background text-muted-foreground'}
                                        `}>
                                            {step.status === 'completed' && <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />}
                                            {step.status === 'completed' ? <CheckCircle2 className="h-6 w-6" /> :
                                                step.status === 'error' ? <AlertCircle className="h-6 w-6" /> :
                                                    <Circle className="h-6 w-6" />}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className={`font-semibold text-base ${step.status === 'completed' ? 'text-primary' : step.status === 'locked' ? 'text-muted-foreground/50' : ''}`}>
                                                {step.title}
                                            </span>
                                            <Badge variant={
                                                step.status === 'completed' ? 'default' :
                                                    step.status === 'error' ? 'destructive' : 'outline'
                                            } className={`w-fit text-[10px] uppercase tracking-wider ${step.status === 'locked' ? 'opacity-50' : ''}`}>
                                                {step.status === 'error' ? 'Rejected' : step.status}
                                            </Badge>

                                            {/* Action Buttons */}
                                            {step.title === 'Profile Completed' && !isProfileComplete && (
                                                <Button size="sm" className="mt-2 w-fit" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                                                    Complete Profile <ArrowRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            )}

                                            {step.title === 'KYC Verification' && isProfileComplete && !kycData && (
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button size="sm" className="mt-2 w-fit">
                                                            Pay & Verify <ArrowRight className="ml-2 h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-md">
                                                        <DialogHeader>
                                                            <DialogTitle>Payment & Verification</DialogTitle>
                                                            <DialogDescription>
                                                                Complete the payment to proceed with KYC verification.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <KYCForm />
                                                    </DialogContent>
                                                </Dialog>
                                            )}

                                            {step.status === 'error' && kycData?.status === 'rejected' && (
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm" className="mt-2 h-7 text-xs border-destructive text-destructive hover:bg-destructive/10">
                                                            Re-submit KYC
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-md">
                                                        <DialogHeader>
                                                            <DialogTitle>Re-submit Verification</DialogTitle>
                                                            <DialogDescription>
                                                                Please update your documents. You do not need to pay again.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <KYCForm existingPaymentId={kycData.paymentId} />
                                                    </DialogContent>
                                                </Dialog>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column: Digital ID Card or Action Forms */}
                <div className="flex items-center justify-center">
                    {!isProfileComplete ? (
                        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <ProfileForm />
                        </div>
                    ) : kycData && user ? (
                        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <DigitalIDCard
                                key={kycData.status} // Force re-render when status changes
                                student={{
                                    firstName: profileData?.firstName,
                                    lastName: profileData?.lastName,
                                    fullName: user.displayName || undefined,
                                    email: user.email || '',
                                    photoURL: user.photoURL || undefined,
                                    university: profileData?.university,
                                    studentId: user.uid
                                }}
                                status={kycData.status === 'approved' ? 'active' : 'inactive'}
                            />
                        </div>
                    ) : (
                        <Card className="w-full h-full flex items-center justify-center min-h-[300px] border-dashed">
                            <div className="flex flex-col items-center text-center p-6 text-muted-foreground">
                                <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                    <User className="h-10 w-10 opacity-20" />
                                </div>
                                <h3 className="font-semibold mb-1">Digital ID Not Available</h3>
                                <p className="text-sm max-w-[250px]">
                                    Complete your profile and application to generate your digital ID.
                                </p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>



            {/* Missing Card Reports Table */}


        </div>
    );
}

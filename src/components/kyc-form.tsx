'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, getDoc, addDoc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Loader2, Camera, CheckCircle, RefreshCw, ArrowRight, ShieldCheck, QrCode } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useUser } from '@/firebase/client';

type Step = 'front' | 'back' | 'selfie' | 'payment' | 'complete';

interface CapturedImage {
    blob: Blob;
    url: string; // Local object URL
}

interface PaymentData {
    paymentId: string;
    qrCode: string;
    readableCode: string;
    personalAppLink: string;
}

interface KYCFormProps {
    existingPaymentId?: string;
}

export function KYCForm({ existingPaymentId }: KYCFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const { firestore, storage } = useFirebase();
    const { user, isUserLoading } = useUser();

    const [currentStep, setCurrentStep] = React.useState<Step>('front');
    const [capturedImages, setCapturedImages] = React.useState<Partial<Record<Step, CapturedImage>>>({});
    const [paymentData, setPaymentData] = React.useState<PaymentData | null>(null);
    const [paymentStatus, setPaymentStatus] = React.useState<'UNPAID' | 'PAID' | 'DECLINED'>('UNPAID');
    const [isUploading, setIsUploading] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const videoRef = React.useRef<HTMLVideoElement>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const streamRef = React.useRef<MediaStream | null>(null);

    // Redirect if user is not logged in
    React.useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/signup');
        }
    }, [user, isUserLoading, router]);

    // Start camera when step changes or when retaking
    React.useEffect(() => {
        if (currentStep === 'complete' || currentStep === 'payment') return;

        // If we already have an image for this step (e.g. previewing), don't start camera
        if (capturedImages[currentStep as 'front' | 'back' | 'selfie']) return;

        startCamera(currentStep as 'front' | 'back' | 'selfie');

        return () => {
            stopCamera();
        };
    }, [currentStep, capturedImages]);

    // Initialize payment when reaching payment step
    React.useEffect(() => {
        if (currentStep === 'payment' && !paymentData) {
            createPayment();
        }
    }, [currentStep, paymentData]);

    // Poll payment status
    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (currentStep === 'payment' && paymentData && paymentStatus !== 'PAID') {
            interval = setInterval(checkPaymentStatus, 3000);
        }
        return () => clearInterval(interval);
    }, [currentStep, paymentData, paymentStatus]);

    const createPayment = async () => {
        try {
            const res = await fetch('/api/fib/payment', { method: 'POST' });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setPaymentData(data);
        } catch (error) {
            console.error('Error creating payment:', error);
            toast({
                variant: 'destructive',
                title: 'Payment Error',
                description: 'Could not initialize payment. Please try again.',
            });
        }
    };

    const checkPaymentStatus = async () => {
        if (!paymentData) return;
        try {
            const res = await fetch(`/api/fib/status/${paymentData.paymentId}`);
            const data = await res.json();
            if (data.status === 'PAID') {
                setPaymentStatus('PAID');
                handlePaymentSuccess(paymentData.paymentId);
            } else if (data.status === 'DECLINED') {
                setPaymentStatus('DECLINED');
                toast({
                    variant: 'destructive',
                    title: 'Payment Declined',
                    description: 'The payment was declined.',
                });
            }
        } catch (error) {
            console.error('Error checking status:', error);
        }
    };

    const handlePaymentSuccess = async (paymentId: string) => {
        toast({
            title: 'Payment Successful',
            description: 'Processing your application...',
        });

        // Create notification for admin
        if (firestore && user) {
            await addDoc(collection(firestore, 'notifications'), {
                title: 'Payment Received',
                message: `Received 25,000 IQD from ${user.displayName || user.email} for ID Card.`,
                type: 'success',
                read: false,
                createdAt: new Date(),
                link: '/admin/payments'
            });
        }

        await uploadAndSubmit(paymentId);
    };

    const startCamera = async (step: 'front' | 'back' | 'selfie') => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: step === 'selfie' ? 'user' : 'environment' }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            toast({
                variant: 'destructive',
                title: 'Camera Error',
                description: 'Could not access camera. Please allow camera permissions.',
            });
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const captureImage = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (context) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Mirror if selfie
            // Always mirror the image to match the preview
            context.translate(canvas.width, 0);
            context.scale(-1, 1);

            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    setCapturedImages(prev => ({
                        ...prev,
                        [currentStep]: { blob, url }
                    }));
                    stopCamera();
                }
            }, 'image/jpeg', 0.8);
        }
    };

    const retakeImage = () => {
        setCapturedImages(prev => {
            const newImages = { ...prev };
            if (currentStep !== 'payment' && currentStep !== 'complete') {
                delete newImages[currentStep];
            }
            return newImages;
        });
        // Effect will restart camera
    };

    const confirmStep = () => {
        if (currentStep === 'front') setCurrentStep('back');
        else if (currentStep === 'back') setCurrentStep('selfie');
        else if (currentStep === 'selfie') {
            if (existingPaymentId) {
                // Skip payment step for re-submission
                uploadAndSubmit(existingPaymentId);
            } else {
                setCurrentStep('payment');
            }
        }
    };

    const uploadAndSubmit = async (paymentId: string) => {
        if (!user || !firestore || !storage) return;

        setIsSubmitting(true);

        try {
            // Fetch profile data to get firstName and lastName
            const profileRef = doc(firestore, 'profiles', user.uid);
            const profileSnap = await getDoc(profileRef);
            const profileData = profileSnap.data();
            const fullName = profileData ? `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() : user.displayName || '';

            // Upload all images
            const uploadPromises = (['front', 'back', 'selfie'] as const).map(async (type) => {
                const image = capturedImages[type];
                if (!image) throw new Error(`Missing ${type} image`);

                const storageRef = ref(storage, `kyc-verification/${user.uid}/${type}`);
                await uploadBytes(storageRef, image.blob);
                const downloadURL = await getDownloadURL(storageRef);
                return { type, url: downloadURL };
            });

            const uploadedUrls = await Promise.all(uploadPromises);
            const urls = uploadedUrls.reduce((acc, curr) => ({ ...acc, [curr.type]: curr.url }), {} as Record<string, string>);

            const kycRef = doc(firestore, 'KYC_Verifications', user.uid);
            await setDoc(kycRef, {
                studentId: user.uid,
                email: user.email,
                fullName: fullName,
                status: 'pending',
                documents: {
                    front: urls.front,
                    back: urls.back,
                    selfie: urls.selfie,
                },
                paymentId: paymentId,
                submittedAt: new Date().toISOString(),
            }, { merge: true }); // Use merge to update existing doc

            // Only create new payment record if it's a new payment
            if (!existingPaymentId) {
                const paymentRef = doc(firestore, 'payments', paymentId);
                await setDoc(paymentRef, {
                    paymentId: paymentId,
                    userId: user.uid,
                    userEmail: user.email,
                    userName: fullName,
                    amount: 25000, // Fixed fee for new ID Card
                    currency: 'IQD',
                    type: 'NEW_CARD',
                    status: 'PAID',
                    provider: 'FIB',
                    createdAt: new Date(),
                    metadata: {
                        kycId: user.uid
                    }
                });
            }

            // Create notification for admin
            await addDoc(collection(firestore, 'notifications'), {
                title: 'New KYC Submission',
                message: `${fullName} (${user.email}) submitted KYC documents.`,
                type: 'info',
                read: false,
                createdAt: new Date(),
                link: '/admin/kyc-verification'
            });

            toast({
                title: 'Application Submitted!',
                description: 'Your ID card application has been submitted successfully.',
            });

            router.push('/student/dashboard');
        } catch (error) {
            console.error('Error submitting KYC:', error);
            toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: 'Could not submit verification. Please try again.',
            });
            setIsSubmitting(false);
        }
    };

    const getStepTitle = () => {
        switch (currentStep) {
            case 'front': return 'Scan Front of ID';
            case 'back': return 'Scan Back of ID';
            case 'selfie': return 'Take a Selfie';
            case 'payment': return 'Payment Required';
            default: return 'Verification Complete';
        }
    };

    const getStepDescription = () => {
        switch (currentStep) {
            case 'front': return 'Place the front of your ID card within the frame.';
            case 'back': return 'Turn your ID card over and scan the back.';
            case 'selfie': return 'Position your face within the frame and look at the camera.';
            case 'payment': return 'Please pay 25,000 IQD to complete your application.';
            default: return 'Submitting your information...';
        }
    };

    if (currentStep === 'payment') {
        return (
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader>
                    <CardTitle>{getStepTitle()}</CardTitle>
                    <CardDescription>{getStepDescription()}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-6">
                    {!paymentData ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="mt-2 text-sm text-muted-foreground">Initializing payment...</p>
                        </div>
                    ) : (
                        <>
                            <div className="relative flex h-64 w-64 items-center justify-center overflow-hidden rounded-lg border bg-white p-4 shadow-sm">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={paymentData.qrCode} alt="Payment QR Code" className="h-full w-full object-contain" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-muted-foreground">Or enter code manually:</p>
                                <p className="text-2xl font-bold tracking-wider">{paymentData.readableCode}</p>
                            </div>
                            <div className="w-full rounded-md bg-muted p-4 text-center text-sm text-muted-foreground">
                                Waiting for payment...
                                <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
                <CardTitle>{getStepTitle()}</CardTitle>
                <CardDescription>{getStepDescription()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-black">
                    {!capturedImages[currentStep as 'front' | 'back' | 'selfie'] ? (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="h-full w-full object-cover scale-x-[-1]"
                        />
                    ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={capturedImages[currentStep as 'front' | 'back' | 'selfie']?.url}
                            alt="Captured"
                            className="h-full w-full object-cover"
                        />
                    )}

                    {/* Overlay Guide Frame */}
                    {!capturedImages[currentStep as 'front' | 'back' | 'selfie'] && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <div className={`
                                relative border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] 
                                transition-all duration-300 ease-in-out
                                ${currentStep === 'selfie'
                                    ? 'w-[55%] aspect-[3/4] rounded-[50%] border-dashed'
                                    : 'w-[85%] aspect-[1.586/1] rounded-xl'
                                }
                            `}>
                                {/* Corner markers for card mode to make it look more pro */}
                                {currentStep !== 'selfie' && (
                                    <>
                                        <div className="absolute top-0 left-0 h-4 w-4 border-t-4 border-l-4 border-white rounded-tl-sm" />
                                        <div className="absolute top-0 right-0 h-4 w-4 border-t-4 border-r-4 border-white rounded-tr-sm" />
                                        <div className="absolute bottom-0 left-0 h-4 w-4 border-b-4 border-l-4 border-white rounded-bl-sm" />
                                        <div className="absolute bottom-0 right-0 h-4 w-4 border-b-4 border-r-4 border-white rounded-br-sm" />
                                    </>
                                )}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <p className="text-white/70 text-xs font-medium bg-black/20 px-2 py-1 rounded backdrop-blur-sm">
                                        {currentStep === 'selfie' ? 'Face Here' : 'Card Here'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <canvas ref={canvasRef} className="hidden" />

                <div className="flex flex-col gap-3">
                    {!capturedImages[currentStep as 'front' | 'back' | 'selfie'] ? (
                        <Button onClick={captureImage} size="lg" className="w-full">
                            <Camera className="mr-2 h-5 w-5" />
                            Capture
                        </Button>
                    ) : (
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={retakeImage} className="flex-1" disabled={isUploading || isSubmitting}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Retake
                            </Button>
                            <Button onClick={confirmStep} className="flex-1" disabled={isUploading || isSubmitting}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Confirm
                            </Button>
                        </div>
                    )}
                </div>

                {/* Step Indicator */}
                <div className="flex justify-center gap-2 mt-4">
                    {['front', 'back', 'selfie', ...(existingPaymentId ? [] : ['payment'])].map((step) => {
                        const steps: Step[] = ['front', 'back', 'selfie', ...(existingPaymentId ? [] : ['payment']), 'complete'] as Step[];
                        const currentIndex = steps.indexOf(currentStep);
                        const stepIndex = steps.indexOf(step as Step);

                        let colorClass = 'bg-muted';
                        if (step === currentStep) {
                            colorClass = 'bg-primary';
                        } else if (stepIndex < currentIndex) {
                            colorClass = 'bg-primary/50';
                        }

                        return (
                            <div
                                key={step}
                                className={`h-2 w-2 rounded-full ${colorClass}`}
                            />
                        );
                    })}
                </div>

            </CardContent>
        </Card>
    );
}

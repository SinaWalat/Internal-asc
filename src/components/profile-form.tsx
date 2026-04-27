
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CalendarIcon, Loader2, UserCheck } from 'lucide-react';
import * as React from 'react';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
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
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useUser } from '@/firebase/client';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { generateStudentId } from '@/lib/student-id-generator';

const profileFormSchema = z.object({
  university: z.string({ required_error: 'Please select a university.' }),
  department: z.string({ required_error: 'Please select a department.' }),
  dateOfBirth: z.date({
    required_error: 'A date of birth is required.',
  }),
  bloodGroup: z.string({ required_error: 'Please select a blood group.' }),
  customFields: z.record(z.string()).optional(),
});

interface CustomField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date';
}

interface UniversityData {
  id: string;
  name: string;
  code?: string;
  departments?: { name: string; code: string }[];
  customFields?: CustomField[];
}

export function ProfileForm() {
  const { toast } = useToast();
  const router = useRouter();
  const { firestore, storage } = useFirebase();
  const { user, isUserLoading } = useUser();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [universities, setUniversities] = React.useState<UniversityData[]>([]);
  const [selectedUni, setSelectedUni] = React.useState<UniversityData | null>(null);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      customFields: {},
    }
  });

  // Fetch Universities
  React.useEffect(() => {
    if (!firestore) return;
    const fetchUniversities = async () => {
      try {
        const snapshot = await getDocs(collection(firestore, 'universities'));
        const unis = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UniversityData));
        setUniversities(unis);
      } catch (error) {
        console.error("Failed to fetch universities:", error);
      }
    };
    fetchUniversities();
  }, [firestore]);

  // Redirect if user is not logged in
  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/signup');
    }
  }, [user, isUserLoading, router]);

  async function onSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to update your profile.',
      });
      return;
    }

    if (!selectedUni?.code) {
      toast({
        variant: 'destructive',
        title: 'Configuration Error',
        description: 'Selected university does not have a code configured.',
      });
      return;
    }

    const selectedDept = selectedUni.departments?.find(d => d.name === values.department);
    if (!selectedDept?.code) {
      toast({
        variant: 'destructive',
        title: 'Configuration Error',
        description: 'Selected department does not have a code configured.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate Student ID
      const studentId = await generateStudentId(firestore, selectedUni.code, selectedDept.code);

      const profileRef = doc(firestore, 'profiles', user.uid);
      const universityRef = doc(firestore, values.university, user.uid);

      const profileData = {
        university: values.university,
        department: values.department,
        dateOfBirth: values.dateOfBirth.toISOString(),
        bloodGroup: values.bloodGroup,
        studentId: studentId,
        customFields: values.customFields || {},
      };

      // Update main profile
      const updateProfilePromise = updateDoc(profileRef, profileData);

      // Set university specific document (using setDoc to create if not exists)
      // We include basic user info here too for easier querying
      const universityData = {
        ...profileData,
        userId: user.uid,
        email: user.email,
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
        photoURL: user.photoURL || '',
      };

      // We need to import setDoc
      const { setDoc } = await import('firebase/firestore');
      const setUniversityPromise = setDoc(universityRef, universityData);

      await Promise.all([updateProfilePromise, setUniversityPromise]);

      toast({
        title: 'Profile Updated!',
        description: `Your profile has been completed. Your Student ID is ${studentId}.`,
      });
      router.push('/student/dashboard');

    } catch (error: any) {
      console.error("Error updating profile:", error);
      if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
          path: `profiles/${user.uid}`,
          operation: 'update',
          requestResourceData: {}, // simplified
        });
        errorEmitter.emit('permission-error', permissionError);
      }

      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Could not update your profile. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !storage || !firestore) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `profile-images/${user.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await updateProfile(user, { photoURL: downloadURL });

      // Also update Firestore profile if it exists
      const profileRef = doc(firestore, 'profiles', user.uid);
      await updateDoc(profileRef, { photoURL: downloadURL }).catch(() => {
        // Ignore if profile doc doesn't exist yet, it will be created/updated on form submit
        console.log('Profile doc not found or permission denied, skipping firestore update for image');
      });

      toast({
        title: 'Image Uploaded',
        description: 'Your profile picture has been updated.',
      });

      // Force a reload to show new image or rely on auth state change
      // router.refresh(); 
    } catch (error) {
      console.error("Error uploading image: ", error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Could not upload image. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full border-gray-100/50 bg-white/80 backdrop-blur-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] rounded-3xl overflow-hidden">
      <CardHeader className="space-y-1 pb-6 text-center pt-8">
        <CardTitle className="text-xl font-semibold text-gray-900">Complete Your Profile</CardTitle>
        <CardDescription className="text-gray-500">
          Please fill in the additional details below to finish setting up your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 pt-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center space-x-6 pb-2">
              <div className="relative group">
                <Avatar className="h-24 w-24 ring-4 ring-orange-50 shadow-md transition-all group-hover:ring-orange-100">
                  <AvatarImage src={user?.photoURL || undefined} alt="Profile Image" className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-orange-100 to-orange-50 text-orange-600 text-xl font-semibold">
                    {user?.displayName?.split(' ').map(n => n[0]).join('') || user?.email?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-black/10"></div>
              </div>
              <div className="space-y-3">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-gray-900">{user?.displayName}</h3>
                  <p className="text-sm font-medium text-gray-500">{user?.email}</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={triggerFileInput}
                  disabled={isUploading}
                  className="h-9 px-4 rounded-lg border-gray-200/60 bg-white/50 backdrop-blur-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 shadow-sm transition-all text-xs font-semibold"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin text-orange-500" />
                      Uploading...
                    </>
                  ) : (
                    'Change Photo'
                  )}
                </Button>
              </div>
            </div>

            <FormField
              control={form.control}
              name="university"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">University</FormLabel>
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val);
                      const uni = universities.find(u => u.name === val);
                      setSelectedUni(uni || null);
                      form.setValue('department', ''); // Reset department
                      form.setValue('customFields', {}); // Reset custom fields
                    }}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="h-12 bg-gray-50/50 border-gray-200/60 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-gray-900 rounded-xl">
                        <SelectValue placeholder="Select your university" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {universities.map(uni => (
                        <SelectItem key={uni.id} value={uni.name}>{uni.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedUni && selectedUni.departments && selectedUni.departments.length > 0 && (
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger className="h-12 bg-gray-50/50 border-gray-200/60 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-gray-900 rounded-xl">
                          <SelectValue placeholder="Select your department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedUni.departments?.map(dept => (
                          <SelectItem key={dept.name} value={dept.name}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-medium text-gray-700">Date of birth</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 h-12 bg-gray-50/50 border-gray-200/60 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-gray-900 rounded-xl text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                          disabled={isSubmitting}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bloodGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Blood Group</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger className="h-12 bg-gray-50/50 border-gray-200/60 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-gray-900 rounded-xl">
                        <SelectValue placeholder="Select your blood group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => (
                        <SelectItem key={group} value={group}>{group}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Custom Fields Section */}
            {selectedUni && selectedUni.customFields && selectedUni.customFields.length > 0 && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="text-sm font-medium text-muted-foreground">Additional Information</h4>
                {selectedUni.customFields.map((fieldConfig) => (
                  <FormField
                    key={fieldConfig.key}
                    control={form.control}
                    name={`customFields.${fieldConfig.key}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">{fieldConfig.label}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            {fieldConfig.type === 'date' ? (
                              <Input
                                type="date"
                                {...field}
                                value={field.value || ''}
                                disabled={isSubmitting}
                                className="h-12 bg-gray-50/50 border-gray-200/60 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-gray-900 rounded-xl"
                              />
                            ) : (
                              <Input
                                type={fieldConfig.type === 'number' ? 'number' : 'text'}
                                placeholder={`Enter ${fieldConfig.label}`}
                                {...field}
                                value={field.value || ''}
                                disabled={isSubmitting}
                                className="h-12 bg-gray-50/50 border-gray-200/60 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-gray-900 rounded-xl"
                              />
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" className="w-full h-12 text-base font-semibold shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all duration-300 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white rounded-xl border-0" disabled={isSubmitting || isUserLoading}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-5 w-5" />
                    Complete Profile
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

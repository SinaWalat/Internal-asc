'use client';

import { useUser } from '@/firebase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { useStudentProfile } from '@/hooks/use-student-data';

interface ProfileData {
    firstName?: string;
    lastName?: string;
    university: string;
    dateOfBirth: string;
    bloodGroup: string;
}

export default function StudentProfilePage() {
    const { user, isUserLoading } = useUser();
    const { data: profileData, loading } = useStudentProfile();

    // Only show skeleton if we're loading AND don't have cached data
    if (isUserLoading || (loading && !profileData)) {
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
                <p className="text-muted-foreground">Manage your personal information and settings.</p>
            </div>

            <Card className="overflow-hidden border-muted/40 shadow-sm">
                {/* Cover Image */}
                <div className="h-32 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20" />

                <CardContent className="relative pt-0">
                    {/* Profile Header */}
                    <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-12 mb-8 px-4">
                        <div className="relative rounded-full p-1 bg-background shadow-xl">
                            <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-background">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-12 w-12 text-muted-foreground" />
                                )}
                            </div>
                            <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-background bg-green-500" />
                        </div>

                        <div className="flex-1 space-y-1 pb-2">
                            <h2 className="text-2xl font-bold">{user?.displayName}</h2>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>

                        <div className="pb-2">
                            <Badge variant="outline" className="px-4 py-1 border-primary/20 bg-primary/5 text-primary">
                                Student
                            </Badge>
                        </div>
                    </div>

                    {/* Profile Details Grid */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-4 pb-4">
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-muted/40">
                            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <User className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">University</p>
                                <p className="font-medium">{profileData?.university || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-muted/40">
                            <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                <Activity className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Blood Group</p>
                                <p className="font-medium">{profileData?.bloodGroup || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-muted/40">
                            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Date of Birth</p>
                                <p className="font-medium">
                                    {profileData?.dateOfBirth ? format(new Date(profileData.dateOfBirth), 'PPP') : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

import React from 'react';
import QRCode from 'react-qr-code';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';

interface DigitalIDCardProps {
    student: {
        firstName?: string;
        lastName?: string;
        fullName?: string;
        email: string;
        photoURL?: string;
        university?: string;
        studentId: string; // This is the UID
    };
    status?: 'active' | 'inactive';
}

export function DigitalIDCard({ student, status = 'active' }: DigitalIDCardProps) {
    const displayName = student.fullName ||
        (student.firstName && student.lastName ? `${student.firstName} ${student.lastName}` : student.firstName) ||
        'Student';

    return (
        <Card className={`w-full mx-auto overflow-hidden border transition-[border-color,box-shadow] duration-300 ${status === 'active' ? 'border-border shadow-sm' : 'border-border shadow-sm'} bg-card`}>
            <div className="relative z-10">
                {/* Minimal Header */}
                <div className="bg-muted/30 p-4 text-center border-b border-border/50">
                    <h3 className="font-semibold text-base tracking-wider uppercase">Digital Student ID</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{student.university || 'University Student'}</p>
                </div>

                <CardContent className="flex flex-col items-center p-8 gap-6">
                    {/* Student Photo */}
                    <div className="relative">
                        <div className={`relative h-32 w-32 rounded-full border-4 ${status === 'active' ? 'border-background ring-2 ring-muted-foreground/20' : 'border-background ring-2 ring-muted'} shadow-sm overflow-hidden bg-muted`}>
                            {student.photoURL ? (
                                <img
                                    src={student.photoURL}
                                    alt={displayName}
                                    className={`h-full w-full object-cover ${status !== 'active' ? 'grayscale opacity-80' : ''}`}
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-muted">
                                    <User className="h-16 w-16 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                        <Badge className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-0.5 shadow-sm border text-xs font-medium tracking-wide ${status === 'active'
                            ? 'bg-primary text-primary-foreground hover:bg-primary'
                            : 'bg-muted text-muted-foreground hover:bg-muted'
                            }`}>
                            {status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                    </div>

                    {/* Student Details */}
                    <div className="text-center space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight">{displayName}</h2>
                        <p className="text-sm text-muted-foreground font-medium">{student.email}</p>
                    </div>

                    {/* QR Code Container */}
                    <div className="bg-white p-3 rounded-xl shadow-sm border relative overflow-hidden">
                        <QRCode
                            value={student.studentId}
                            size={140}
                            viewBox={`0 0 160 160`}
                            className="relative z-10"
                        />
                    </div>

                    <p className="text-[10px] text-center text-muted-foreground max-w-[200px] uppercase tracking-wider">
                        Official Digital Identification
                    </p>
                </CardContent>
            </div>
        </Card>
    );
}

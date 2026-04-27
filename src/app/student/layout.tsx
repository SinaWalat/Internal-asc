'use client';

import {
    Sidebar,
    SidebarProvider,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarInset,
    SidebarTrigger,
    SidebarContent,
    SidebarHeader,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Home, ChevronsUpDown, LogOut, User, AlertCircle } from "lucide-react";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth, useUser } from "@/firebase/client";
import { signOut } from "firebase/auth";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";
import { ChatWidget } from '@/components/chat/chat-widget';
import { useStudentProtection } from "@/hooks/use-student-protection";
import { Button } from "@/components/ui/button";
import { useStudentKYC } from "@/hooks/use-student-data";
import { SpotlightBackground } from "@/components/ui/spotlight-background";


export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isUserLoading, userError } = useUser();
    const auth = useAuth();

    const { isStudent, isCheckingStudent } = useStudentProtection();
    const { data: kycData } = useStudentKYC();
    const isPaid = !!kycData;

    const handleLogout = async () => {
        if (auth) {
            await signOut(auth);
            router.push('/login');
        }
    };

    if (userError) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-background gap-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <h2 className="text-xl font-semibold">Connection Error</h2>
                <p className="text-muted-foreground text-center max-w-md">
                    We couldn't connect to the authentication server. Please check your internet connection and try again.
                </p>
                <Button onClick={() => window.location.reload()}>
                    Retry Connection
                </Button>
            </div>
        );
    }

    return (
        <>
            {(isCheckingStudent || isUserLoading) ? (
                <div className="flex h-screen w-full items-center justify-center bg-background">
                    <div className="flex flex-col items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                        </div>
                    </div>
                </div>
            ) : (!user || !isStudent) ? (
                null
            ) : (
                <SidebarProvider>
                    <Sidebar collapsible="icon">
                        <SidebarHeader>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <SidebarMenuButton
                                                size="lg"
                                                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                            >
                                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                                    <User className="size-4" />
                                                </div>
                                                <div className="grid flex-1 text-left text-sm leading-tight">
                                                    <span className="truncate font-semibold">Student Portal</span>
                                                    <span className="truncate text-xs">Acme Inc</span>
                                                </div>
                                                <ChevronsUpDown className="ml-auto" />
                                            </SidebarMenuButton>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                            align="start"
                                            side="bottom"
                                            sideOffset={4}
                                        >
                                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                                                Workspaces
                                            </DropdownMenuLabel>
                                            <DropdownMenuItem>
                                                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                                    <div className="flex size-6 items-center justify-center rounded-sm border">
                                                        <User className="size-4 shrink-0" />
                                                    </div>
                                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                                        <span className="truncate font-semibold">Student Portal</span>
                                                        <span className="truncate text-xs">Acme Inc</span>
                                                    </div>
                                                </div>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarHeader>
                        <SidebarContent>
                            <SidebarGroup>
                                <SidebarGroupLabel>Menu</SidebarGroupLabel>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild isActive={pathname === '/student/dashboard'}>
                                            <Link href="/student/dashboard">
                                                <Home />
                                                <span>Dashboard</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild isActive={pathname === '/student/missing-card'} disabled={!isPaid} className={!isPaid ? "opacity-50 pointer-events-none" : ""}>
                                            <Link href={isPaid ? "/student/missing-card" : "#"}>
                                                <AlertCircle />
                                                <span>Missing Card</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild isActive={pathname === '/student/profile'} disabled={!isPaid} className={!isPaid ? "opacity-50 pointer-events-none" : ""}>
                                            <Link href={isPaid ? "/student/profile" : "#"}>
                                                <User />
                                                <span>Profile</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroup>
                        </SidebarContent>
                        <SidebarFooter>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <SidebarMenuButton
                                                size="lg"
                                                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                            >
                                                <Avatar className="h-8 w-8 rounded-lg">
                                                    <AvatarImage src={user.photoURL || "https://github.com/shadcn.png"} alt={user.displayName || "User"} />
                                                    <AvatarFallback className="rounded-lg">{user.email?.[0].toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div className="grid flex-1 text-left text-sm leading-tight">
                                                    <span className="truncate font-semibold">{user.displayName || 'User'}</span>
                                                    <span className="truncate text-xs">{user.email}</span>
                                                </div>
                                                <ChevronsUpDown className="ml-auto size-4" />
                                            </SidebarMenuButton>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                            side="bottom"
                                            align="end"
                                            sideOffset={4}
                                        >
                                            <DropdownMenuLabel className="p-0 font-normal">
                                                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                                    <Avatar className="h-8 w-8 rounded-lg">
                                                        <AvatarImage src={user.photoURL || "https://github.com/shadcn.png"} alt={user.displayName || "User"} />
                                                        <AvatarFallback className="rounded-lg">{user.email?.[0].toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                                        <span className="truncate font-semibold">{user.displayName || 'User'}</span>
                                                        <span className="truncate text-xs">{user.email}</span>
                                                    </div>
                                                </div>
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                                                <LogOut className="mr-2 h-4 w-4" />
                                                Log out
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarFooter>
                    </Sidebar>
                    <SidebarInset>
                        <SpotlightBackground />
                        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
                            <SidebarTrigger className="-ml-1" />
                        </header>
                        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
                            {children}
                        </main>
                        <ChatWidget />
                    </SidebarInset>
                </SidebarProvider>
            )}
        </>
    );
}

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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton
} from "@/components/ui/sidebar";
import {
  Home, MessageSquare, Shield, LayoutDashboard, ChevronsUpDown, ChevronDown, LogOut, FileCheck, Activity, CreditCard, IdCard, Search,
  GraduationCap, TrendingUp, AlertCircle,
} from "lucide-react";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LanguageToggle } from "@/components/language-toggle";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth, useUser, useFirebase } from "@/firebase/client";
import { useLanguage } from "@/contexts/language-context";
import { useAuthProtection } from "@/hooks/use-auth-protection";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React from "react";
import { NotificationBell } from "@/components/admin/notification-bell";
import { GlobalSearch } from "@/components/admin/global-search";

import { Button } from "@/components/ui/button";
import { GradientBackground } from "@/components/ui/gradient-background";



export default function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userError } = useUser();
  const { isAdmin } = useAuthProtection();
  const auth = useAuth();
  const { firestore } = useFirebase();
  const { t, dir } = useLanguage();

  const [adminData, setAdminData] = React.useState<{ name: string; role: string; permissions?: string[] } | null>(null);

  // Fetch admin data from Firestore
  React.useEffect(() => {
    if (!user || !firestore || !isAdmin) return;

    const fetchAdminData = async () => {
      try {
        const adminDoc = await getDoc(doc(firestore, 'admins', user.uid));
        if (adminDoc.exists()) {
          const data = adminDoc.data();
          setAdminData({
            name: data.name || user.displayName || 'Admin',
            role: data.role || 'Global Admin',
            permissions: data.permissions || []
          });
        } else {
          setAdminData({
            name: user.displayName || 'Admin',
            role: 'Global Admin',
            permissions: []
          });
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
        setAdminData({
          name: user.displayName || 'Admin',
          role: 'Global Admin',
          permissions: []
        });
      }
    };

    fetchAdminData();
  }, [user, firestore, isAdmin]);

  const hasPermission = (permission: string) => {
    if (!adminData) return false;
    if (adminData.role === 'global_admin') return true;
    return adminData.permissions?.includes(permission) || false;
  };

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
      {!user ? null : (
        <div className="relative min-h-screen w-full bg-background overflow-hidden">
          <GradientBackground />
          <SidebarProvider className="relative z-10">
            <Sidebar collapsible="icon" side={dir === 'rtl' ? 'right' : 'left'} className="bg-transparent border-r-white/10">
              <SidebarHeader>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                          size="lg"
                          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-white/5"
                        >
                          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                            <LayoutDashboard className="size-4" />
                          </div>
                          <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">{adminData?.name || user.displayName || 'Admin'}</span>
                            <span className="truncate text-xs">{adminData?.role || 'Global Admin'}</span>
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
                              <LayoutDashboard className="size-4 shrink-0" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                              <span className="truncate font-semibold">{adminData?.name || user.displayName || 'Admin'}</span>
                              <span className="truncate text-xs">{adminData?.role || 'Global Admin'}</span>
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
                  <SidebarGroupLabel>Platform</SidebarGroupLabel>
                  <SidebarMenu>
                    {hasPermission('view_dashboard') && (
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === '/admin/dashboard'} className="hover:bg-white/5 data-[active=true]:bg-white/10">
                          <Link href="/admin/dashboard">
                            <LayoutDashboard />
                            <span>{t('dashboard')}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}

                    {hasPermission('manage_messages') && (
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === '/admin/messages'} className="hover:bg-white/5 data-[active=true]:bg-white/10">
                          <Link href="/admin/messages">
                            <MessageSquare />
                            <span>{t('messages')}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}

                    {hasPermission('manage_universities') && (
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === '/admin/universities'} className="hover:bg-white/5 data-[active=true]:bg-white/10">
                          <Link href="/admin/universities">
                            <GraduationCap />
                            <span>Universities</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}

                    {hasPermission('manage_missing_cards') && (
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === '/admin/missing-cards'} className="hover:bg-white/5 data-[active=true]:bg-white/10">
                          <Link href="/admin/missing-cards">
                            <Search />
                            <span>Missing Cards</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}

                    {hasPermission('manage_live_support') && (
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === '/admin/chat'} className="hover:bg-white/5 data-[active=true]:bg-white/10">
                          <Link href="/admin/chat">
                            <MessageSquare />
                            <span>Live Support</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}

                    {hasPermission('manage_admins') && (
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === '/admin/admins'} className="hover:bg-white/5 data-[active=true]:bg-white/10">
                          <Link href="/admin/admins">
                            <Shield />
                            <span>{t('admins')}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}

                    {hasPermission('manage_kyc') && (
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === '/admin/kyc-verification'} className="hover:bg-white/5 data-[active=true]:bg-white/10">
                          <Link href="/admin/kyc-verification">
                            <FileCheck />
                            <span>{t('kyc_verification')}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}

                    {hasPermission('view_audit_log') && (
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === '/admin/audit-log'} className="hover:bg-white/5 data-[active=true]:bg-white/10">
                          <Link href="/admin/audit-log">
                            <Activity />
                            <span>{t('audit_log')}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}

                    {hasPermission('view_payments') && (
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === '/admin/payments'} className="hover:bg-white/5 data-[active=true]:bg-white/10">
                          <Link href="/admin/payments">
                            <CreditCard />
                            <span>{t('payments')}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}

                    {hasPermission('manage_card_designer') && (
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === '/admin/card-designer'} className="hover:bg-white/5 data-[active=true]:bg-white/10">
                          <Link href="/admin/card-designer">
                            <IdCard />
                            <span>{t('cardDesigner')}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}

                    {hasPermission('view_analytics') && (
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === '/admin/analytics'} className="hover:bg-white/5 data-[active=true]:bg-white/10">
                          <Link href="/admin/analytics">
                            <TrendingUp />
                            <span>Analytics</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
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
                          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-white/5"
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
            <SidebarInset className="bg-transparent">
              <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4 relative z-10 bg-background/40 backdrop-blur-md">
                <SidebarTrigger className={dir === 'rtl' ? '-mr-1' : '-ml-1'} />
                <GlobalSearch />
                <div className="flex-1" />
                <NotificationBell />
                <LanguageToggle />
              </header>
              <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8 relative z-10">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
        </div>
      )
      }
    </>
  );
}

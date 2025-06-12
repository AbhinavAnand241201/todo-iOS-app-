
"use client";

import React, { useEffect } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter, // Added SidebarFooter import
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname, redirect } from 'next/navigation';
import { Compass, LayoutDashboard, ArrowLeftRight, PiggyBank, Target, Brain, CreditCard, Menu, LogOut, Loader2 } from 'lucide-react'; // Added LogOut & Loader2
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/auth-context'; // Added useAuth import
import { useToast } from '@/hooks/use-toast';


const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/spending', label: 'Spending', icon: ArrowLeftRight },
  { href: '/budgets', label: 'Budgets', icon: PiggyBank },
  { href: '/financial-goals', label: 'Financial Goals', icon: Target },
  { href: '/ai-advisor', label: 'AI Advisor', icon: Brain },
  { href: '/payments', label: 'Payments', icon: CreditCard },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { currentUser, loading, logout } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading) {
      if (!currentUser && pathname !== '/auth') {
        redirect('/auth');
      } else if (currentUser && pathname === '/auth') {
        redirect('/dashboard');
      }
    }
  }, [currentUser, loading, pathname]);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If user is not authenticated and not on auth page, children won't be rendered due to redirect.
  // AuthPage itself handles the scenario where a user is already logged in or auth is loading.
  // So, if we reach here and are on /auth page without a user, it means AuthPage should render.
  if (!currentUser && pathname !== '/auth') {
     // This case should be handled by redirect, but as a fallback, show loader or minimal content.
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If user is logged in and on auth page, redirect will handle it.
  // Otherwise, render the main app layout.

  const handleLogout = async () => {
    await logout();
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    // Redirect handled by useEffect
  };

  const sidebarContent = (
    <>
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-sidebar-foreground hover:text-sidebar-primary transition-colors">
          <Compass className="h-7 w-7 text-primary" />
          <span className="font-headline">Fiscal Compass</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                  tooltip={{ children: item.label, className: "font-body" }}
                  className="font-body"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      {currentUser && (
        <SidebarFooter className="p-2 mt-auto">
          <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  className="font-body w-full"
                  tooltip={{ children: "Logout", className: "font-body" }}
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </>
  );

  // If on /auth page and user is not logged in, render children (AuthPage) without AppLayout structure.
  if (!currentUser && pathname === '/auth') {
    return <>{children}</>;
  }


  if (isMobile) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-30">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-[280px] bg-sidebar text-sidebar-foreground">
              {sidebarContent}
            </SheetContent>
          </Sheet>
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
            <Compass className="h-6 w-6 text-primary" />
            <span className="font-headline text-foreground">Fiscal Compass</span>
          </Link>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-background">
          {children}
        </main>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen">
        <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border">
          {sidebarContent}
        </Sidebar>
        <SidebarInset className="flex-1 overflow-y-auto">
          <div className="p-6">
             {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

"use client";

import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, LayoutDashboard, ArrowLeftRight, PiggyBank, Target, Brain, CreditCard, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from '@/hooks/use-mobile';


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
              <Link href={item.href} legacyBehavior passHref>
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
    </>
  );

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

'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const isAuthPage = pathname === '/login';

  useEffect(() => {
    if (!loading) {
      if (!isAuthPage && (!user || !token)) {
        router.replace('/login');
      } else if (isAuthPage && user && token) {
        router.replace('/');
      }
    }
  }, [loading, user, token, isAuthPage, router]);

  // Auth pages (like /login)
  if (isAuthPage) {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-xs text-muted-foreground font-mono">Loading authentication...</p>
          </div>
        </div>
      );
    }
    // Prevent flash of login page if already authenticated and redirecting to /
    if (user && token) {
      return null;
    }
    return <main className="min-h-screen">{children}</main>;
  }

  // Protected pages: Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-xs font-semibold text-muted-foreground font-mono">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  // Protected pages: Not logged in -> do not render dashboard content while redirecting to /login
  if (!user || !token) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}

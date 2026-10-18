'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { BroadcastOperationsStrip } from '@/components/BroadcastOperationsStrip';
import { BrandLoading } from '@/components/BrandLoading';

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
        <BrandLoading
          size="fullscreen"
          text="Verifying ITV Secure Session..."
          subtext="Independent Television • Portal Access"
        />
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
      <BrandLoading
        size="fullscreen"
        text="Authorizing Operations Access..."
        subtext="Independent Television • IT Platform"
      />
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
        <BroadcastOperationsStrip />
        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[1720px] mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}

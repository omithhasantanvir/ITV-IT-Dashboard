import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import { DashboardShell } from '@/components/DashboardShell';

export const metadata: Metadata = {
  title: 'IT Operations Dashboard v2',
  description: 'IT Management & Asset Control System built with Next.js, Express, TypeScript, and Prisma (PostgreSQL)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased min-h-screen">
        <ThemeProvider>
          <AuthProvider>
            <DashboardShell>{children}</DashboardShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

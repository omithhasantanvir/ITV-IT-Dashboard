import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import { DashboardShell } from '@/components/DashboardShell';

export const metadata: Metadata = {
  title: 'Independent Television - IT Operations Platform',
  description: 'Independent Television (ITV) Central IT Management, Broadcast Infrastructure & Operations Platform',
  icons: {
    icon: '/itv-logo.png',
    apple: '/itv-logo.png',
  },
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

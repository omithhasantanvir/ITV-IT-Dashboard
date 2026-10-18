import type { Metadata } from 'next';
import { Inter, Noto_Sans_Bengali } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import { DashboardShell } from '@/components/DashboardShell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  variable: '--font-bengali',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Independent Television • IT Operations Platform',
  description: 'Enterprise IT Infrastructure, Broadcast Management & Asset Control System — Independent Television, Bangladesh',
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
      <body className={`${inter.variable} ${notoSansBengali.variable} font-sans antialiased min-h-screen selection:bg-primary/20 selection:text-primary`}>
        <ThemeProvider>
          <AuthProvider>
            <DashboardShell>{children}</DashboardShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

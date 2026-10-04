import type { Metadata } from 'next';
import './globals.css';
import { RoleProvider } from '@/context/RoleContext';
import { AuthProvider } from '@/context/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'ASHWA | Enterprise Movie Property Rentals & Warehouse Logistics',
  description:
    'South Asia’s premier cinematic prop rental platform managing 200,000+ movie props across 2 warehouse floors. Real-time multi-executive picking, QR code tracking, and live estimation billing.',
  keywords: [
    'movie props rental',
    'film production equipment',
    'cinema property house',
    'warehouse picking',
    'Ashwa props',
    'period furniture rental',
    'film set weapons'
  ],
  icons: {
    icon: '/assets/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col antialiased selection:bg-amber-500 selection:text-black">
        <AuthProvider>
          <RoleProvider>
            <Navbar />
            <main className="flex-1 w-full">{children}</main>
            <Footer />
            <AuthModal />
          </RoleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}


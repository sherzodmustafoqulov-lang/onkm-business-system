import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'ONKM BUSINESS SYSTEM — B2B ERP & CRM Platformasi',
  description: 'Online Nazorat Kassa Mashinalari (ONKM), POS tizimlari, fiskal modullar, ombor, mijozlar va o\'rnatish boshqaruv tizimi',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body className="antialiased bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

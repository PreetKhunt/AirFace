import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SIH26056 — Real-Time Airfare Price Index',
  description: 'Automated Airfare Web Scraping for CPI Augmentation — Ministry of Statistics and Programme Implementation (MoSPI)',
};

import { Sidebar } from '@/components/Sidebar';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-gray-100 antialiased selection:bg-accent selection:text-white flex min-h-screen">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </body>
    </html>
  );
}

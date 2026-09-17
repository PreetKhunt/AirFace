import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'SIH26056 — Real-Time Airfare Price Index',
  description: 'Automated Airfare Web Scraping for CPI Augmentation — Ministry of Statistics and Programme Implementation (MoSPI)',
};

import { TopNavigation } from '@/components/TopNavigation';
import { CommandPalette } from '@/components/CommandPalette';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-background text-gray-100 antialiased selection:bg-accent/30 selection:text-white flex flex-col min-h-screen`}>
        <TopNavigation />
        <CommandPalette />
        <main className="flex-1 w-full relative">
          {children}
        </main>
      </body>
    </html>
  );
}

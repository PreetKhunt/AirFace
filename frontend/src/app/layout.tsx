import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Real-Time Airfare Price Index',
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
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans min-h-screen flex flex-col`}>
        <div className="fixed inset-0 bg-gradient-to-br from-background via-obsidian to-surface -z-10" />
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent -z-10" />
        <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-5 -z-10" />

        <TopNavigation />
        <CommandPalette />
        <main className="flex-1 w-full relative">
          {children}
        </main>
      </body>
    </html>
  );
}

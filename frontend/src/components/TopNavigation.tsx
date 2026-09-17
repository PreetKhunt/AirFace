'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const topNavGroups = [
  { name: 'MARKET', href: '/' },
  { name: 'ROUTE INTELLIGENCE', href: '/route-explorer' },
  { name: 'COLLECTION', href: '/collection-monitor' },
  { name: 'QUALITY', href: '/data-quality' },
  { name: 'VALIDATION', href: '/backtest' },
  { name: 'PROVENANCE', href: '/provenance' },
];

export function TopNavigation() {
  const pathname = usePathname();
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    // Only set on client to avoid hydration mismatch
    setDateStr(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase());
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo / Title */}
        <div className="flex flex-col">
          <Link href="/" className="text-xl font-bold tracking-tight text-white hover:text-accent transition-colors flex items-center gap-2">
            AIRFACE
            <span className="text-xs px-1.5 py-0.5 rounded bg-card border border-border text-gray-400 font-mono tracking-widest">
              SIH26056
            </span>
          </Link>
          <span className="text-xs text-muted uppercase tracking-widest mt-1">
            India Airfare Intelligence
          </span>
        </div>

        {/* Center Nav */}
        <nav className="hidden lg:flex items-center space-x-1">
          {topNavGroups.map(group => {
            const isActive = pathname === group.href || (group.href !== '/' && pathname.startsWith(group.href));
            return (
              <Link
                key={group.name}
                href={group.href}
                className={twMerge(clsx(
                  'px-4 py-2 text-xs font-semibold tracking-[0.15em] transition-all relative',
                  isActive ? 'text-accent' : 'text-muted hover:text-white'
                ))}
              >
                {group.name}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-accent rounded-t-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Status */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end text-right">
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-white">
              LIVE
              <span className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            </div>
            <span className="text-xs text-muted font-mono">{dateStr || '...'}</span>
          </div>
          
          <button 
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-card border border-border hover:border-accent/50 transition-colors text-sm text-muted group"
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          >
            <Search className="w-4 h-4 group-hover:text-white transition-colors" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] bg-background px-1.5 py-0.5 rounded border border-border text-gray-500">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </div>
      </div>
    </header>
  );
}

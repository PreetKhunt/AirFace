'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { api } from '@/lib/api';

const topNavGroups = [
  { name: 'MARKET', href: '/' },
  { name: 'ROUTES', href: '/route-explorer' },
  { name: 'HORIZONS', href: '/booking-horizon' },
  { name: 'ANALYTICS', href: '/index-analytics' },
  { name: 'QUALITY', href: '/data-quality' },
  { name: 'CLEANING', href: '/data-cleaning' },
  { name: 'COLLECTION', href: '/collection-monitor' },
  { name: 'VALIDATION', href: '/backtest' },
  { name: 'PROVENANCE', href: '/provenance' },
  { name: 'STATUS', href: '/system-status' },
  { name: 'METHODOLOGY', href: '/methodology' },
];

export function TopNavigation() {
  const pathname = usePathname();
  const [dateStr, setDateStr] = useState('');
  const [dataMode, setDataMode] = useState<string>('LOADING');

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase());
    api.getSystemStatus().then(res => {
      const mode = res.data_mode || 'HISTORICAL';
      if (mode === 'LIVE') setDataMode('LIVE');
      else if (mode.includes('HISTORICAL')) setDataMode('HISTORICAL DEMO');
      else if (mode.includes('SYNTHETIC')) setDataMode('SYNTHETIC DEMO');
      else setDataMode(mode);
    }).catch(() => setDataMode('HISTORICAL DEMO'));
  }, []);

  const isLive = dataMode === 'LIVE';
  const isHistorical = dataMode === 'HISTORICAL DEMO';
  const isSynthetic = dataMode === 'SYNTHETIC DEMO';

  return (
    <header className="sticky top-0 z-50 glass-heavy border-b border-white/10">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo / Title */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 group transition-all duration-300"
          >
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-electric-cyan/20 to-atmospheric-blue/20 blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative text-xl font-bold tracking-tighter text-soft-white">
                AIRFACE
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-atmospheric-blue/20 to-electric-cyan/20 border border-electric-cyan/30 text-electric-cyan font-mono tracking-widest">
              SIH26056
            </span>
          </Link>
          <div className="hidden md:block h-4 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent mx-2" />
          <span className="hidden md:block text-xs text-muted-silver uppercase tracking-widest">
            Aviation Intelligence
          </span>
        </div>

        {/* Center Nav */}
        <nav className="hidden xl:flex items-center gap-1">
          {topNavGroups.map(group => {
            const isActive = pathname === group.href || (group.href !== '/' && pathname.startsWith(group.href));
            return (
              <Link
                key={group.name}
                href={group.href}
                className={twMerge(clsx(
                  'px-3 py-1.5 text-[11px] font-semibold tracking-[0.15em] transition-all relative group/nav',
                  isActive
                    ? 'text-electric-cyan'
                    : 'text-muted-silver hover:text-soft-white'
                ))}
              >
                {group.name}
                {isActive ? (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-electric-cyan to-atmospheric-blue rounded-full shadow-[0_0_12px_rgba(6,182,212,0.6)]" />
                ) : (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-electric-cyan to-atmospheric-blue rounded-full transition-all duration-300 group-hover/nav:w-6" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Status */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3">
            <div className={clsx(
              'px-3 py-1 rounded-full border text-xs font-mono font-semibold',
              isLive
                ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border-emerald-500/30 text-emerald-400'
                : isHistorical
                ? 'bg-gradient-to-r from-amber-500/10 to-amber-600/10 border-amber-500/30 text-amber-400'
                : isSynthetic
                ? 'bg-gradient-to-r from-purple-500/10 to-purple-600/10 border-purple-500/30 text-purple-400'
                : 'bg-gradient-to-r from-danger/10 to-danger/20 border-danger/30 text-danger'
            )}>
              <div className="flex items-center gap-2">
                <span className={clsx(
                  'w-1.5 h-1.5 rounded-full',
                  isLive ? 'bg-emerald-400 animate-pulse' :
                  isHistorical ? 'bg-amber-400' :
                  isSynthetic ? 'bg-purple-400' : 'bg-danger'
                )} />
                {dataMode}
              </div>
            </div>
            <div className="text-xs text-muted-silver font-mono border-l border-white/10 pl-3">
              {dateStr || '...'}
            </div>
          </div>

          <button
            className="flex items-center gap-2 px-3 py-2 rounded-lg glass-surface hover:bg-white/10 transition-all duration-300 group"
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          >
            <Search className="w-4 h-4 text-muted-silver group-hover:text-electric-cyan transition-colors" />
            <span className="hidden sm:inline text-sm text-muted-silver group-hover:text-soft-white">
              Search
            </span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 font-mono text-[10px] px-1.5 py-0.5 rounded border border-white/10 text-muted-silver">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          </button>
        </div>
      </div>

      {/* Mobile / Overflow Navigation */}
      <nav className="xl:hidden border-t border-white/10 bg-obsidian/95 backdrop-blur-glass">
        <div className="max-w-[1920px] mx-auto px-4 py-2 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1 min-w-max">
            {topNavGroups.map(group => {
              const isActive = pathname === group.href || (group.href !== '/' && pathname.startsWith(group.href));
              return (
                <Link
                  key={group.name}
                  href={group.href}
                  className={twMerge(clsx(
                    'px-3 py-1.5 text-xs font-semibold tracking-[0.15em] whitespace-nowrap rounded-lg transition-all',
                    isActive
                      ? 'bg-gradient-to-r from-electric-cyan/10 to-atmospheric-blue/10 text-electric-cyan border border-electric-cyan/20'
                      : 'text-muted-silver hover:text-soft-white hover:bg-white/5'
                  ))}
                >
                  {group.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
}

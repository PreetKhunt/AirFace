'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { api } from '@/lib/api';
import { DataMode } from '@/types';
import { formatDataMode } from '@/lib/dataMode';

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
  const [dataMode, setDataMode] = useState<DataMode | null>(null);

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase());
    api.getSystemStatus().then(res => {
      setDataMode(res.data_mode);
    }).catch(() => setDataMode(null));
  }, []);

  const isLive = dataMode === 'LIVE';
  const isHistorical = dataMode === 'HISTORICAL';
  const isSynthetic = dataMode === 'SYNTHETIC';

  return (
    <header className="sticky top-0 z-50 glass-heavy border-b border-white/10">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex min-h-16 items-center justify-between gap-4">
          {/* Logo / Title */}
          <div className="flex shrink-0 items-center gap-3">
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
            </Link>
            <div className="hidden md:block h-4 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent mx-2" />
            <span className="hidden md:block text-xs text-muted-silver uppercase tracking-widest">
              Aviation Intelligence
            </span>
          </div>

          {/* Right Status */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className={clsx(
              'px-2 sm:px-3 py-1 rounded-full border text-[9px] sm:text-xs font-mono font-semibold whitespace-nowrap',
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
                {formatDataMode(dataMode)}
              </div>
            </div>
            <div className="text-[10px] sm:text-xs text-muted-silver font-mono border-l border-white/10 pl-2 sm:pl-3 whitespace-nowrap">
              {dateStr || '...'}
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden xl:flex items-center justify-center gap-1 border-t border-white/10 pt-2">
          {topNavGroups.map(group => {
            const isActive = pathname === group.href || (group.href !== '/' && pathname.startsWith(group.href));
            return (
              <Link
                key={group.name}
                href={group.href}
                className={twMerge(clsx(
                  'px-3 py-1.5 text-[11px] font-semibold tracking-[0.15em] transition-all relative group/nav whitespace-nowrap',
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

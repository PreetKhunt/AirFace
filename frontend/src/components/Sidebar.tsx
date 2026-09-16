'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  Map, 
  Clock, 
  Activity, 
  ShieldCheck, 
  Search, 
  LineChart, 
  Network, 
  BookOpen
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const navItems = [
  { name: 'Overview', href: '/', icon: BarChart3 },
  { name: 'Route Explorer', href: '/route-explorer', icon: Map },
  { name: 'Booking Horizon', href: '/booking-horizon', icon: Clock },
  { name: 'Collection Monitor', href: '/collection-monitor', icon: Activity },
  { name: 'Data Quality', href: '/data-quality', icon: ShieldCheck },
  { name: 'Data Cleaning', href: '/data-cleaning', icon: Search },
  { name: '30-Day Backtest', href: '/backtest', icon: LineChart },
  { name: 'Provenance Explorer', href: '/provenance', icon: Network },
  { name: 'Methodology', href: '/methodology', icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen p-4 flex flex-col hidden md:flex">
      <div className="mb-8 px-2">
        <h2 className="text-xl font-bold tracking-tight text-white mb-1">SIH26056</h2>
        <p className="text-xs text-gray-400">MoSPI Airfare Index</p>
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={twMerge(
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive 
                    ? 'bg-accent/10 text-accent' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                )
              )}
            >
              <Icon className={clsx('w-5 h-5', isActive ? 'text-accent' : 'text-gray-500')} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

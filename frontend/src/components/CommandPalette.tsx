'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Map, Clock, Activity, ShieldCheck, LineChart, Network, BookOpen, Layers } from 'lucide-react';
import { clsx } from 'clsx';

const commands = [
  { id: 'dashboard', title: 'National Index (Control Room)', icon: Layers, href: '/' },
  { id: 'route-explorer', title: 'Route Intelligence', icon: Map, href: '/route-explorer' },
  { id: 'booking-horizon', title: 'Booking Horizon', icon: Clock, href: '/booking-horizon' },
  { id: 'collection', title: 'Collection Engine', icon: Activity, href: '/collection-monitor' },
  { id: 'data-quality', title: 'Data Quality', icon: ShieldCheck, href: '/data-quality' },
  { id: 'data-cleaning', title: 'Cleaning Workspace', icon: Search, href: '/data-cleaning' },
  { id: 'validation', title: 'Validation (Backtest)', icon: LineChart, href: '/backtest' },
  { id: 'provenance', title: 'Provenance Explorer', icon: Network, href: '/provenance' },
  { id: 'methodology', title: 'Methodology', icon: BookOpen, href: '/methodology' },
];

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((open) => !open);
        setQuery('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredCommands = commands.filter(cmd => 
    cmd.title.toLowerCase().includes(query.toLowerCase()) || 
    cmd.id.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => (i + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => (i - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        handleSelect(filteredCommands[selectedIndex].href);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
      
      {/* Palette */}
      <div 
        className="relative w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden transform transition-all"
        role="dialog"
      >
        <div className="flex items-center px-4 py-4 border-b border-border">
          <Search className="w-5 h-5 text-muted mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-muted font-medium"
            placeholder="Navigate to a module or workspace..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] bg-background px-1.5 py-0.5 rounded border border-border text-gray-500">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-muted">
              <p>No results found for &quot;{query}&quot;</p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs font-semibold text-muted uppercase tracking-widest">
                Workspaces
              </div>
              {filteredCommands.map((cmd, index) => {
                const isSelected = index === selectedIndex;
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => handleSelect(cmd.href)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={clsx(
                      'w-full flex items-center px-4 py-3 rounded-lg text-sm transition-colors',
                      isSelected ? 'bg-accent/10 text-white' : 'text-muted hover:text-white hover:bg-white/5'
                    )}
                  >
                    <Icon className={clsx('w-4 h-4 mr-3', isSelected ? 'text-accent' : 'text-gray-500')} />
                    <span className="font-medium">{cmd.title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Map, Clock, Activity, ShieldCheck, LineChart, Network, BookOpen, Layers, ArrowRight } from 'lucide-react';
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
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-midnight-navy/80 backdrop-blur-glass transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Palette */}
      <div
        className="relative w-full max-w-2xl glass-heavy border border-white/20 shadow-2xl overflow-hidden transform transition-all rounded-2xl"
        role="dialog"
        style={{
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        <div className="flex items-center px-6 py-5 border-b border-white/10">
          <Search className="w-5 h-5 text-muted-silver mr-4" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-soft-white placeholder-muted-silver font-medium text-lg"
            placeholder="Navigate to a module or workspace..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 font-mono text-xs px-2 py-1 rounded-lg border border-white/10 text-muted-silver bg-white/5">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-12 text-center">
              <Search className="w-12 h-12 text-muted-silver mx-auto mb-4 opacity-50" />
              <p className="text-muted-silver">No results found for &quot;{query}&quot;</p>
              <p className="text-sm text-muted-silver/70 mt-2">Try a different term</p>
            </div>
          ) : (
            <div className="p-4">
              <div className="px-3 py-3 text-xs font-semibold text-muted-silver uppercase tracking-widest">
                Aviation Intelligence Workspaces
              </div>
              <div className="space-y-2">
                {filteredCommands.map((cmd, index) => {
                  const isSelected = index === selectedIndex;
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => handleSelect(cmd.href)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={clsx(
                        'w-full flex items-center px-5 py-4 rounded-xl transition-all duration-200',
                        isSelected
                          ? 'bg-gradient-to-r from-electric-cyan/10 to-atmospheric-blue/10 border border-electric-cyan/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                          : 'border border-transparent hover:border-white/10 hover:bg-white/5'
                      )}
                    >
                      <div className={clsx(
                        'w-10 h-10 rounded-lg flex items-center justify-center mr-4 transition-colors',
                        isSelected
                          ? 'bg-gradient-to-r from-electric-cyan to-atmospheric-blue text-soft-white'
                          : 'bg-white/5 text-muted-silver'
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-left flex-1">
                        <div className={clsx(
                          'font-medium transition-colors',
                          isSelected ? 'text-soft-white' : 'text-muted-silver'
                        )}>
                          {cmd.title}
                        </div>
                        <div className={clsx(
                          'text-xs transition-colors',
                          isSelected ? 'text-electric-cyan' : 'text-muted-silver/70'
                        )}>
                          {cmd.id.replace('-', ' ').toUpperCase()}
                        </div>
                      </div>
                      <ArrowRight className={clsx(
                        'w-4 h-4 transition-opacity',
                        isSelected ? 'opacity-100 text-electric-cyan' : 'opacity-0'
                      )} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-obsidian/50">
          <div className="flex items-center justify-between text-xs text-muted-silver">
            <div className="flex items-center gap-4">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
            </div>
            <div className="font-mono">
              {filteredCommands.length} workspace{filteredCommands.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

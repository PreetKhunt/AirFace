import { Activity } from 'lucide-react';
import { DataMode } from '@/types';

export function DataModeBadge({ mode }: { mode: DataMode }) {
  const modeBadgeColor =
    mode === 'LIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
    mode === 'HISTORICAL' ? 'bg-accent/10 text-accent border-accent/20' :
    'bg-amber-500/10 text-amber-400 border-amber-500/20';

  return (
    <div className={`px-4 py-2 text-sm font-semibold rounded-lg border flex items-center gap-2 shadow-sm ${modeBadgeColor}`}>
      <Activity className="w-4 h-4 animate-pulse" />
      <span>MODE: [{mode}]</span>
      {mode === 'SYNTHETIC' && <span className="ml-2 text-xs opacity-75">(DEMO MODE — SYNTHETIC DATA)</span>}
    </div>
  );
}

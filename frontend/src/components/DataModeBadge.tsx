import { Radio } from 'lucide-react';
import { DataMode } from '@/types';
import { formatDataMode } from '@/lib/dataMode';

export function DataModeBadge({ mode }: { mode: DataMode | null }) {
  const label = formatDataMode(mode);
  const modeBadgeColor =
    mode === 'LIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
    mode === 'HISTORICAL' ? 'bg-accent/10 text-accent border-accent/20' :
    mode === 'SYNTHETIC' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
    'bg-white/5 text-muted-silver border-white/10';

  return (
    <div className={`px-3 py-1.5 text-xs font-semibold rounded-full border flex items-center gap-2 shadow-sm ${modeBadgeColor}`}>
      <Radio className={`w-3.5 h-3.5 ${mode === 'LIVE' ? 'animate-pulse' : ''}`} />
      <span>{label}</span>
    </div>
  );
}

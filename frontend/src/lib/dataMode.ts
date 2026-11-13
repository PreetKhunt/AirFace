import { DataMode } from '@/types';

export function formatDataMode(mode: DataMode | null | undefined): string {
  if (mode === 'SYNTHETIC') return 'LIVE DEMO · SYNTHETIC DATA';
  if (mode === 'HISTORICAL') return 'HISTORICAL DEMO';
  return mode ?? 'DATA MODE UNAVAILABLE';
}

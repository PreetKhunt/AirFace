import { DataMode } from '@/types';

export function formatDataMode(mode: DataMode | null | undefined): string {
  if (mode === 'SYNTHETIC') return 'SYNTHETIC DEMO';
  if (mode === 'HISTORICAL') return 'HISTORICAL DEMO';
  return mode ?? 'DATA MODE UNAVAILABLE';
}

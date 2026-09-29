import { SourceHealth } from '@/types';

/** Operational adapter status — distinct from ingestion health (HEALTHY/DEGRADED). */
export type AdapterOperationalStatus =
  | 'IMPLEMENTED ADAPTER'
  | 'LIVE VERIFIED'
  | 'HISTORICAL/FIXTURE FALLBACK'
  | 'BLOCKED'
  | 'NOT CONFIGURED';

export function getAdapterOperationalStatus(source: SourceHealth): AdapterOperationalStatus {
  const name = source.source_name.toLowerCase();

  if (source.status === 'BLOCKED') {
    return 'BLOCKED';
  }

  if (source.adapter_type === 'FIXTURE' || name.includes('fixture')) {
    return 'HISTORICAL/FIXTURE FALLBACK';
  }

  if (name.includes('indigo') || name.includes('live')) {
    if ((source.total_records_scraped ?? 0) > 0 && source.status === 'HEALTHY') {
      return 'LIVE VERIFIED';
    }
    if (source.status === 'DISABLED' || source.status === 'UNAVAILABLE') {
      return 'NOT CONFIGURED';
    }
    return 'IMPLEMENTED ADAPTER';
  }

  if ((source.total_records_scraped ?? 0) > 0 && source.adapter_type === 'LIVE') {
    return 'LIVE VERIFIED';
  }

  return 'NOT CONFIGURED';
}

export function operationalStatusTone(status: AdapterOperationalStatus): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (status) {
    case 'LIVE VERIFIED':
    case 'HISTORICAL/FIXTURE FALLBACK':
      return 'success';
    case 'IMPLEMENTED ADAPTER':
      return 'warning';
    case 'BLOCKED':
      return 'danger';
    default:
      return 'neutral';
  }
}

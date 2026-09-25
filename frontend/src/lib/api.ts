import {
  HealthResponse,
  SystemStatusResponse,
  NationalAggregateIndex,
  ElementaryRouteIndex,
  BacktestRun,
  SourceHealth,
  DataQualityLog,
  NormalizedIndexObservation,
  ParsedAirfareObservation,
  ProvenanceAuditTrail,
  DataMode
} from '@/types';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace(/\/+$/, '');

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const res = await fetch(url, { cache: 'no-store', ...options });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} on ${endpoint}`);
  }
  return res.json();
}

// Data Mappers to bridge Backend Python Schemas to Frontend TypeScript Types
function mapDataQualityLog(data: any): DataQualityLog {
  if (!data) return null as any;
  return {
    log_id: data.log_id || data.id,
    calculation_date: data.calculation_date,
    composite_score: (data.dq_score ?? data.composite_score)?.toString() || "0.00",
    completeness_score: (data.completeness_pct ?? data.completeness_score)?.toString() || "0.00",
    validity_score: (data.validity_pct ?? data.validity_score)?.toString() || "0.00",
    consistency_score: (data.consistency_pct ?? data.consistency_score)?.toString() || "0.00",
    timeliness_score: (data.freshness_score ?? data.timeliness_score)?.toString() || "0.00",
    source_reliability_score: (data.reliability_pct ?? data.source_reliability_score)?.toString() || "0.00",
    dedup_integrity_score: (data.dedup_pct ?? data.dedup_integrity_score)?.toString() || "0.00",
    outlier_cleanliness_score: (data.outlier_cleanliness_pct ?? data.outlier_cleanliness_score)?.toString() || "0.00",
    availability_coverage_score: (data.availability_pct ?? data.availability_coverage_score)?.toString() || "0.00",
    data_mode: (['LIVE', 'HISTORICAL', 'SYNTHETIC'].includes(data.data_mode) ? data.data_mode : 'HISTORICAL') as DataMode,
  };
}

function mapSourceHealth(data: any): SourceHealth {
  return {
    source_id: data.source_name,
    source_name: data.source_name,
    adapter_type: data.adapter_type === 'LIVE' ? 'LIVE' : 'FIXTURE',
    last_collection_time: data.last_success_at || data.last_checked_at || null,
    status: data.status,
    success_rate: typeof data.success_rate_pct === 'number' ? data.success_rate_pct.toFixed(2) : (data.success_rate_pct || "0.00"),
    total_records_scraped: data.total_successes || 0,
    error_count: data.consecutive_failures || 0,
    average_latency_ms: data.avg_latency_ms ? Math.round(data.avg_latency_ms).toString() : "0",
  };
}

function extractList(data: any): any[] {
  return Array.isArray(data) ? data : (data?.results || data?.items || []);
}

export const api = {
  getHealth: () => fetchJson<HealthResponse>('/health'),
  getSystemStatus: () => fetchJson<SystemStatusResponse>('/health/system'),
  
  getNationalIndices: async (horizon?: string, mode?: DataMode, methodology: string = 'JEVONS') => {
    let url = horizon ? `/index/national/${encodeURIComponent(horizon)}` : '/index/national';
    const params = new URLSearchParams();
    if (mode) params.append('data_mode', mode);
    if (methodology) params.append('methodology', methodology);
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    const data = await fetchJson<any>(url);
    return extractList(data) as NationalAggregateIndex[];
  },
  
  getRouteIndices: async (routeId?: string, mode?: DataMode, horizon?: string) => {
    let url = routeId ? `/index/route/${encodeURIComponent(routeId)}` : '/index/route';
    const params = new URLSearchParams();
    if (mode) params.append('data_mode', mode);
    if (horizon) params.append('booking_horizon', horizon);
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    const data = await fetchJson<any>(url);
    return extractList(data) as ElementaryRouteIndex[];
  },
  
  getSources: async () => {
    const data = await fetchJson<any>('/sources');
    return extractList(data).map(mapSourceHealth);
  },
  
  getQualityScore: async () => {
    const data = await fetchJson<any>('/quality/score');
    return mapDataQualityLog(data);
  },
  
  getQualityHistory: async () => {
    const data = await fetchJson<any>('/quality/history');
    return extractList(data).map(mapDataQualityLog);
  },
  
  getBacktestResults: async (mode?: DataMode) => {
    let url = '/backtest/results';
    if (mode) url += `?data_mode=${mode}`;
    const data = await fetchJson<any>(url);
    return extractList(data) as BacktestRun[];
  },

  /** Fetches normalized observations. Pass includeParsed=true to get embedded fare breakdown. */
  getNormalizedObservations: async (routeId?: string, horizon?: string, includeParsed = false, pageSize = 100) => {
    const params = new URLSearchParams();
    if (routeId) params.append('route_id', routeId);
    if (horizon) params.append('booking_horizon', horizon);
    if (includeParsed) params.append('include_parsed', 'true');
    params.append('page_size', pageSize.toString());
    const data = await fetchJson<any>(`/normalized-observations?${params.toString()}`);
    return { items: extractList(data) as NormalizedIndexObservation[], total: data?.total ?? 0 };
  },

  /** Returns all unique route IDs from the current normalized observations */
  getAvailableRoutes: async (): Promise<string[]> => {
    const data = await fetchJson<any>('/normalized-observations?page_size=500');
    const rows = extractList(data);
    return Array.from(new Set(rows.map((r: any) => r.route_id as string))).sort();
  },
  
  getParsedObservation: (id: string) => fetchJson<ParsedAirfareObservation>(`/observations/${id}`),
  
  getProvenance: (id: string) => fetchJson<ProvenanceAuditTrail>(`/provenance/${id}`),

  runPipeline: async () => {
    return fetchJson<any>('/pipeline/run', { method: 'POST' });
  }
};

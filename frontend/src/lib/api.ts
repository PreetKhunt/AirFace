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
  RawAirfareObservation,
  DataMode
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_BASE_URL) {
  console.warn("NEXT_PUBLIC_API_URL is not set. API calls will fail if not deployed with this environment variable.");
}

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, { cache: 'no-store', ...options });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} on ${endpoint}`);
  }
  return res.json();
}

// Data Mappers to bridge Backend Python Schemas to Frontend TypeScript Types
function mapDataQualityLog(data: any): DataQualityLog {
  return {
    log_id: data.log_id || data.id,
    calculation_date: data.calculation_date,
    composite_score: (data.dq_score ?? data.composite_score)?.toString(),
    completeness_score: (data.completeness_pct ?? data.completeness_score)?.toString(),
    validity_score: (data.validity_pct ?? data.validity_score)?.toString(),
    consistency_score: (data.consistency_pct ?? data.consistency_score)?.toString(),
    timeliness_score: (data.freshness_score ?? data.timeliness_score)?.toString(),
    source_reliability_score: (data.reliability_pct ?? data.source_reliability_score)?.toString(),
    dedup_integrity_score: (data.dedup_pct ?? data.dedup_integrity_score)?.toString(),
    outlier_cleanliness_score: (data.outlier_cleanliness_pct ?? data.outlier_cleanliness_score)?.toString(),
    availability_coverage_score: (data.availability_pct ?? data.availability_coverage_score)?.toString(),
    data_mode: data.data_mode || 'PRODUCTION'
  };
}

function mapSourceHealth(data: any): SourceHealth {
  return {
    source_id: data.source_name,
    source_name: data.source_name,
    last_collection_time: data.last_success_at || data.last_checked_at || new Date().toISOString(),
    status: data.status,
    success_rate: data.success_rate_pct?.toFixed(2) || "0.00",
    total_records_scraped: data.total_successes || 0,
    error_count: data.consecutive_failures || 0,
    average_latency_ms: data.avg_latency_ms?.toString() || "0",
  };
}

function extractList(data: any): any[] {
  return Array.isArray(data) ? data : (data?.results || data?.items || []);
}

export const api = {
  getHealth: () => fetchJson<HealthResponse>('/health'),
  getSystemStatus: () => fetchJson<SystemStatusResponse>('/health/system'),
  
  getNationalIndices: async (horizon?: string, mode?: DataMode) => {
    let url = horizon ? `/index/national/${horizon}` : '/index/national';
    if (mode) url += `?data_mode=${mode}`;
    const data = await fetchJson<any>(url);
    return extractList(data) as NationalAggregateIndex[];
  },
  
  getRouteIndices: async (routeId?: string, mode?: DataMode) => {
    let url = routeId ? `/index/route/${routeId}` : '/index/route';
    if (mode) url += `?data_mode=${mode}`;
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

  getNormalizedObservations: async (routeId?: string, horizon?: string) => {
    let params = new URLSearchParams();
    if (routeId) params.append('route_id', routeId);
    if (horizon) params.append('booking_horizon', horizon);
    const data = await fetchJson<any>(`/normalized-observations?${params.toString()}`);
    return { items: extractList(data) };
  },
  
  getParsedObservation: (id: string) => fetchJson<ParsedAirfareObservation>(`/observations/${id}`)
};

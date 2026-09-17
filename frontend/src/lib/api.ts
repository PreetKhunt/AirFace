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

export const api = {
  getHealth: () => fetchJson<HealthResponse>('/health'),
  getSystemStatus: () => fetchJson<SystemStatusResponse>('/health/system'),
  
  getNationalIndices: (horizon?: string, mode?: DataMode) => {
    let url = horizon ? `/index/national/${horizon}` : '/index/national';
    if (mode) url += `?data_mode=${mode}`;
    return fetchJson<NationalAggregateIndex[]>(url);
  },
  
  getRouteIndices: (routeId?: string, mode?: DataMode) => {
    let url = routeId ? `/index/route/${routeId}` : '/index/route';
    if (mode) url += `?data_mode=${mode}`;
    return fetchJson<ElementaryRouteIndex[]>(url);
  },
  
  getSources: () => fetchJson<SourceHealth[]>('/sources'),
  
  getQualityScore: () => fetchJson<DataQualityLog>('/quality/score'),
  getQualityHistory: () => fetchJson<DataQualityLog[]>('/quality/history'),
  
  getBacktestResults: (mode?: DataMode) => {
    let url = '/backtest/results';
    if (mode) url += `?data_mode=${mode}`;
    return fetchJson<BacktestRun[]>(url);
  },

  getNormalizedObservations: (routeId?: string, horizon?: string) => {
    let params = new URLSearchParams();
    if (routeId) params.append('route_id', routeId);
    if (horizon) params.append('booking_horizon', horizon);
    return fetchJson<any>(`/normalized-observations?${params.toString()}`);
  },
  
  getParsedObservation: (id: string) => fetchJson<ParsedAirfareObservation>(`/observations/${id}`)
};

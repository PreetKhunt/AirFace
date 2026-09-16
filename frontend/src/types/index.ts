export type DataMode = 'LIVE' | 'HISTORICAL' | 'SYNTHETIC';

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
}

export interface SystemStatusResponse {
  status: string;
  service: string;
  version: string;
  database_connected: boolean;
  redis_connected: boolean;
  data_mode: DataMode;
}

export interface NationalAggregateIndex {
  aggregate_id: string;
  calculation_date: string;
  booking_horizon: string;
  methodology: string;
  data_mode: DataMode;
  index_value: string;
  route_count: number;
  coverage_pct: string;
  daily_change_pct?: string | null;
  monthly_change_pct?: string | null;
  dq_score: string;
  base_date: string;
  created_at: string;
}

export interface ElementaryRouteIndex {
  route_index_id: string;
  calculation_date: string;
  route_id: string;
  booking_horizon: string;
  methodology: string;
  data_mode: DataMode;
  index_value: string;
  observation_count: number;
  coverage_pct: string;
  base_date: string;
  created_at: string;
}

export interface BacktestRun {
  backtest_id: string;
  start_date: string;
  end_date: string;
  methodology: string;
  reference_source: string;
  booking_horizon: string;
  route_id: string | null;
  data_mode: DataMode;
  sample_count: number;
  match_count: number;
  coverage_pct: string;
  mape: string | null;
  rmse: string | null;
  pearson_r: string | null;
  mean_bias_pct: string | null;
  directional_accuracy: string | null;
  status: string;
  created_at: string;
}

export interface SourceHealth {
  source_id: string;
  source_name: string;
  last_collection_time: string;
  status: string;
  success_rate: string;
  total_records_scraped: number;
  error_count: number;
  average_latency_ms: string;
}

export interface DataQualityLog {
  log_id: string;
  calculation_date: string;
  composite_score: string;
  completeness_score: string;
  validity_score: string;
  consistency_score: string;
  timeliness_score: string;
  source_reliability_score: string;
  dedup_integrity_score: string;
  outlier_cleanliness_score: string;
  availability_coverage_score: string;
  data_mode: DataMode;
}

export interface NormalizedIndexObservation {
  index_obs_id: string;
  observation_id: string;
  route_id: string;
  booking_horizon: string;
  comparable_index_fare: string;
  valid_for_index: boolean;
  exclusion_reason: string | null;
  outlier_flag: boolean;
  commercial_dedup_flag: boolean;
  availability_status: string;
  dq_score: string;
}

export interface ParsedAirfareObservation {
  observation_id: string;
  raw_id: string;
  origin: string;
  destination: string;
  airline_code: string;
  flight_number: string;
  travel_date: string;
  departure_time: string | null;
  booking_window_days: number;
  raw_total_fare: string;
  base_fare: string | null;
  taxes: string | null;
  yq_surcharge: string | null;
  cabin_class: string;
  fare_basis_code: string | null;
}

export interface RawAirfareObservation {
  raw_id: string;
  collection_timestamp: string;
  source_name: string;
  source_url: string;
  raw_displayed_price_text: string;
  collection_mode: DataMode;
  payload_hash: string | null;
}

export interface ProvenanceAuditTrail {
  audit_id: string;
  record_type: string;
  record_id: string;
  pipeline_stage: string;
  action: string;
  timestamp: string;
  actor_service: string;
  payload_hash: string;
  previous_hash: string | null;
}

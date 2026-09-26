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
  data_mode: DataMode | null;
}

export interface HorizonSummary {
  horizon: string;
  data_mode: DataMode | null;
  observation_count: number;
  route_count: number;
  index_observation_count: number;
  coverage_pct: string | null;
  date_range: { start: string | null; end: string | null };
  availability_state: 'AVAILABLE' | 'DATA_NOT_AVAILABLE';
  reason: string | null;
}

export interface HorizonSummaryResponse {
  data_mode: DataMode | null;
  horizons: HorizonSummary[];
}

export interface PipelineStatus {
  data_mode: DataMode | null;
  counts: {
    raw: number;
    parsed: number;
    normalized: number;
    dq: number;
    index_ready: number;
    airlines: number;
    routes: number;
  };
}

export interface RouteWeight {
  route_id: string;
  corridor_region: string;
  passenger_volume: number;
  reference_weight: string;
  normalized_weight_pct: string | null;
}

export interface RouteWeightsResponse {
  total_weight: number;
  routes: RouteWeight[];
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

export type AdapterType = 'FIXTURE' | 'LIVE';

export interface SourceHealth {
  source_id: string;
  source_name: string;
  adapter_type: AdapterType;
  last_collection_time: string | null;
  status: string;
  success_rate: string | null;
  total_records_scraped: number;
  error_count: number;
  average_latency_ms: string | null;
}

export interface DataQualityLog {
  log_id: string;
  calculation_date: string;
  composite_score: string | null;
  completeness_score: string | null;
  validity_score: string | null;
  consistency_score: string | null;
  timeliness_score: string | null;
  source_reliability_score: string | null;
  dedup_integrity_score: string | null;
  outlier_cleanliness_score: string | null;
  availability_coverage_score: string | null;
  synthetic_share: string | null;
  data_mode: DataMode | null;
}

/** Parsed fare observation fields embedded inside a normalized observation (returned when include_parsed=true) */
export interface ParsedAirfareObservationEmbedded {
  observation_id: string;
  raw_id: string;
  source_name: string | null;
  origin: string;
  destination: string;
  airline_code: string;
  airline_name: string | null;
  flight_number: string;
  travel_date: string;
  departure_time: string | null;
  arrival_time: string | null;
  booking_window_days: number;
  raw_total_fare: string;
  base_fare: string | null;
  udf_fee: string | null;
  asf_fee: string | null;
  gst_tax: string | null;
  yq_surcharge: string | null;
  convenience_fee: string | null;
  comparable_fare: string | null;
  cabin_class: string | null;
  fare_family: string | null;
}

/** Normalized observation. Field names match the backend NormalizedObservationOut schema exactly. */
export interface NormalizedIndexObservation {
  index_obs_id: string;
  observation_id: string;
  route_id: string;
  booking_horizon: string;
  comparable_index_fare: string;
  raw_displayed_total: string | null;
  component_sum: string | null;
  normalization_status: string;
  normalization_reason: string | null;
  availability_status: string;
  outlier_status: string;
  commercial_dedup_status: string;
  is_imputed: boolean;
  imputation_method: string | null;
  is_outlier: boolean;
  valid_for_index: boolean;
  dq_score: number | null;
  created_at: string | null;
  /** Present only when API is called with include_parsed=true */
  parsed: ParsedAirfareObservationEmbedded | null;
}

/** Legacy standalone parsed observation (from GET /observations/{id}) */
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
  udf_fee: string | null;
  asf_fee: string | null;
  gst_tax: string | null;
  yq_surcharge: string | null;
  convenience_fee: string | null;
  cabin_class: string | null;
  fare_family: string | null;
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
  observation_id: string;
  source_portal: string;
  source_url: string;
  collection_timestamp: string;
  parser_version: string;
  normalization_version: string;
  payload_sha256_hash: string;
  created_at: string;
}

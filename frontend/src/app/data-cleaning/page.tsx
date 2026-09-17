'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { NormalizedIndexObservation } from '@/types';
import { StateBoundary } from '@/components/StateBoundary';
import { ArrowDown, CheckCircle2, AlertTriangle, Info, ChevronDown } from 'lucide-react';

const KNOWN_HORIZONS = ['T+1', 'T+7', 'T+15', 'T+30', 'T+45'];

export default function DataCleaningPage() {
  const [observations, setObservations] = useState<NormalizedIndexObservation[]>([]);
  const [routes, setRoutes] = useState<string[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [selectedHorizon, setSelectedHorizon] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedObs, setSelectedObs] = useState<NormalizedIndexObservation | null>(null);

  // Load available routes on mount
  const loadRoutes = async () => {
    try {
      const availableRoutes = await api.getAvailableRoutes();
      setRoutes(availableRoutes);
      if (availableRoutes.length > 0 && !selectedRoute) {
        setSelectedRoute(availableRoutes[0]);
      }
    } catch {
      // Non-fatal: use empty route list, user can type manually
    }
  };

  const loadObservations = async (route: string, horizon: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getNormalizedObservations(route || undefined, horizon || undefined, true);
      setObservations(data.items);
      setSelectedObs(data.items.length > 0 ? data.items[0] : null);
    } catch (err: any) {
      setError(err.message || 'Failed to load observation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  useEffect(() => {
    // Only auto-load once we have a selected route (or explicitly with no filters)
    if (routes.length > 0) {
      loadObservations(selectedRoute, selectedHorizon);
    } else if (!loading) {
      loadObservations('', '');
    }
  }, [selectedRoute, selectedHorizon, routes]);

  // Safely compute taxes from individual components
  const computeTaxes = (obs: NormalizedIndexObservation | null): string => {
    if (!obs?.parsed) return 'N/A';
    const udf = parseFloat(obs.parsed.udf_fee || '0') || 0;
    const asf = parseFloat(obs.parsed.asf_fee || '0') || 0;
    const gst = parseFloat(obs.parsed.gst_tax || '0') || 0;
    const total = udf + asf + gst;
    return total > 0 ? total.toFixed(2) : 'N/A';
  };

  const isDuplicate = (obs: NormalizedIndexObservation) =>
    obs.commercial_dedup_status !== 'UNIQUE' && obs.commercial_dedup_status !== null;

  return (
    <div className="min-h-screen p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <header className="p-6 bg-card border border-border rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
              Data Cleaning Explainability
            </h1>
            <p className="text-sm text-gray-400">
              Step-by-step transparency: Raw → Parsed → Normalized → Index Eligible.
            </p>
          </div>
          {/* Route & Horizon Selectors */}
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <select
                value={selectedRoute}
                onChange={e => setSelectedRoute(e.target.value)}
                className="appearance-none bg-card border border-border text-white text-sm rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">All Routes</option>
                {routes.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={selectedHorizon}
                onChange={e => setSelectedHorizon(e.target.value)}
                className="appearance-none bg-card border border-border text-white text-sm rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">All Horizons</option>
                {KNOWN_HORIZONS.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <button
              onClick={() => loadObservations(selectedRoute, selectedHorizon)}
              className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-accent/80 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      <StateBoundary
        loading={loading}
        error={error}
        onRetry={() => loadObservations(selectedRoute, selectedHorizon)}
        isEmpty={!loading && observations.length === 0}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Observation List Panel */}
          <div className="lg:col-span-1 bg-card border border-border rounded-xl overflow-hidden h-[600px] flex flex-col">
            <div className="p-4 border-b border-border bg-card/50 flex items-center justify-between">
              <h3 className="font-semibold text-white">
                Observations {selectedRoute ? `(${selectedRoute})` : '(All Routes)'}
              </h3>
              <span className="text-xs text-gray-500">{observations.length} records</span>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-2">
              {observations.map((obs, idx) => (
                <button
                  key={obs.index_obs_id || idx}
                  onClick={() => setSelectedObs(obs)}
                  className={`w-full text-left p-3 rounded-lg text-sm transition-colors border ${
                    selectedObs?.index_obs_id === obs.index_obs_id
                    ? 'bg-accent/10 border-accent/30 text-accent'
                    : 'bg-card border-border hover:bg-white/5 text-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold font-mono">
                      {obs.parsed?.airline_code ?? obs.route_id} {obs.parsed?.flight_number ?? obs.booking_horizon}
                    </span>
                    <span className="text-xs text-gray-500">
                      {obs.parsed?.travel_date ?? '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono">₹{obs.comparable_index_fare}</span>
                    {obs.valid_for_index ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3"/> Valid
                      </span>
                    ) : (
                      <span className="text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3"/> Excluded
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-2 space-y-4">
            {selectedObs ? (
              <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                
                {/* Stage 1: Parsed Extraction */}
                <div className="relative border border-border rounded-xl p-5 bg-card/50">
                  <div className="absolute -top-3 left-4 bg-card px-2 text-xs font-bold text-gray-400">
                    STAGE 1: PARSED EXTRACTION
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                    <div>
                      <p className="text-xs text-gray-500">Raw Total Fare</p>
                      <p className="font-mono text-white text-lg">
                        ₹{selectedObs.parsed?.raw_total_fare ?? selectedObs.raw_displayed_total ?? '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Base Fare</p>
                      <p className="font-mono text-gray-300">
                        {selectedObs.parsed?.base_fare ? `₹${selectedObs.parsed.base_fare}` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Taxes & Fees (UDF+ASF+GST)</p>
                      <p className="font-mono text-gray-300">
                        {computeTaxes(selectedObs) !== 'N/A' ? `₹${computeTaxes(selectedObs)}` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">YQ Surcharge</p>
                      <p className="font-mono text-gray-300">
                        {selectedObs.parsed?.yq_surcharge ? `₹${selectedObs.parsed.yq_surcharge}` : '—'}
                      </p>
                    </div>
                  </div>
                  {selectedObs.parsed && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                      <div>
                        <p className="text-xs text-gray-500">Airline</p>
                        <p className="font-mono text-gray-300">
                          {selectedObs.parsed.airline_code} — {selectedObs.parsed.airline_name ?? ''}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Cabin / Fare Family</p>
                        <p className="font-mono text-gray-300">
                          {selectedObs.parsed.cabin_class ?? '—'} / {selectedObs.parsed.fare_family ?? '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Booking Window</p>
                        <p className="font-mono text-gray-300">
                          {selectedObs.parsed.booking_window_days}d ({selectedObs.booking_horizon})
                        </p>
                      </div>
                    </div>
                  )}
                  {!selectedObs.parsed && (
                    <p className="text-xs text-gray-500 mt-3 italic">
                      Parsed breakdown not available for this record.
                    </p>
                  )}
                </div>

                <div className="flex justify-center">
                  <ArrowDown className="text-border w-6 h-6" />
                </div>

                {/* Stage 2: Normalization */}
                <div className="relative border border-border rounded-xl p-5 bg-card/50">
                  <div className="absolute -top-3 left-4 bg-card px-2 text-xs font-bold text-gray-400">
                    STAGE 2: NORMALIZATION
                  </div>
                  <div className="flex items-center gap-3 mt-2 mb-4 bg-blue-500/10 text-blue-400 p-3 rounded-lg text-sm border border-blue-500/20">
                    <Info className="w-5 h-5 flex-shrink-0" />
                    <p>
                      Comparable index fare = Base + UDF + ASF + GST + YQ (excluding convenience fees).
                      Status: <span className="font-mono font-bold">{selectedObs.normalization_status}</span>
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-gray-400">Calculated Comparable Index Fare:</p>
                    <p className="font-mono text-xl font-bold text-emerald-400">
                      ₹{selectedObs.comparable_index_fare}
                    </p>
                  </div>
                  {selectedObs.normalization_reason && (
                    <p className="text-xs text-gray-500 mt-2 font-mono">
                      {selectedObs.normalization_reason}
                    </p>
                  )}
                </div>

                <div className="flex justify-center">
                  <ArrowDown className="text-border w-6 h-6" />
                </div>

                {/* Stage 3: Quality Check */}
                <div className="relative border border-border rounded-xl p-5 bg-card/50">
                  <div className="absolute -top-3 left-4 bg-card px-2 text-xs font-bold text-gray-400">
                    STAGE 3: QUALITY CHECKS
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {/* Outlier */}
                    <div className={`p-3 rounded-lg border ${
                      selectedObs.is_outlier
                        ? 'bg-red-500/10 border-red-500/20 text-red-400'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}>
                      <p className="text-xs mb-1">Outlier Classification</p>
                      <p className="font-bold text-sm font-mono">{selectedObs.outlier_status}</p>
                      <p className="text-xs mt-1 opacity-75">
                        {selectedObs.is_outlier ? 'Excluded from index' : 'Within normal bounds'}
                      </p>
                    </div>
                    {/* Dedup */}
                    <div className={`p-3 rounded-lg border ${
                      isDuplicate(selectedObs)
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}>
                      <p className="text-xs mb-1">Commercial Deduplication</p>
                      <p className="font-bold text-sm font-mono">{selectedObs.commercial_dedup_status}</p>
                      <p className="text-xs mt-1 opacity-75">
                        {isDuplicate(selectedObs) ? 'Duplicate suppressed' : 'Unique observation'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">Final Index Eligibility</p>
                      <p className="text-xs text-gray-500 mt-1">
                        May this observation enter the Tier 1 computation?
                      </p>
                    </div>
                    {selectedObs.valid_for_index ? (
                      <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" /> VALID
                      </div>
                    ) : (
                      <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg font-bold flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" /> EXCLUDED
                      </div>
                    )}
                  </div>

                  {!selectedObs.valid_for_index && selectedObs.normalization_reason && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                      <span className="font-bold">Reason:</span> {selectedObs.normalization_reason}
                    </div>
                  )}

                  {selectedObs.dq_score !== null && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                      <span>DQ Score at time of normalization:</span>
                      <span className="font-mono text-white font-bold">{selectedObs.dq_score}</span>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="h-full flex items-center justify-center border border-dashed border-border rounded-xl min-h-[300px]">
                <p className="text-gray-500">Select an observation to view the cleaning pipeline</p>
              </div>
            )}
          </div>
        </div>
      </StateBoundary>
    </div>
  );
}

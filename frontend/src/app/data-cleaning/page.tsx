'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { NormalizedIndexObservation, ParsedAirfareObservation } from '@/types';
import { StateBoundary } from '@/components/StateBoundary';
import { ArrowDown, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface CombinedObservation {
  norm: NormalizedIndexObservation;
  parsed: ParsedAirfareObservation;
}

export default function DataCleaningPage() {
  const [observations, setObservations] = useState<CombinedObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedObs, setSelectedObs] = useState<CombinedObservation | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch some recent normalized observations
      const data = await api.getNormalizedObservations('DEL-BOM', 'T+1');
      if (data && data.items) {
        setObservations(data.items);
        if (data.items.length > 0) {
          setSelectedObs(data.items[0]);
        }
      } else {
        setObservations([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load observation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <header className="p-6 bg-card border border-border rounded-xl shadow-sm">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
          Data Cleaning Explainability
        </h1>
        <p className="text-sm text-gray-400">Step-by-step transparency from Raw -&gt; Parsed -&gt; Normalized -&gt; Index Eligible.</p>
      </header>

      <StateBoundary loading={loading} error={error} onRetry={loadData} isEmpty={!loading && observations.length === 0}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-1 bg-card border border-border rounded-xl overflow-hidden h-[600px] flex flex-col">
            <div className="p-4 border-b border-border bg-card/50">
              <h3 className="font-semibold text-white">Sample Observations (DEL-BOM)</h3>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-2">
              {observations.map((obs, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedObs(obs)}
                  className={`w-full text-left p-3 rounded-lg text-sm transition-colors border ${
                    selectedObs?.norm.index_obs_id === obs.norm.index_obs_id 
                    ? 'bg-accent/10 border-accent/30 text-accent' 
                    : 'bg-card border-border hover:bg-white/5 text-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold">{obs.parsed.airline_code} {obs.parsed.flight_number}</span>
                    <span className="text-xs">{obs.parsed.travel_date}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>₹{obs.parsed.raw_total_fare}</span>
                    {obs.norm.valid_for_index ? (
                      <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Valid</span>
                    ) : (
                      <span className="text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Excluded</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {selectedObs ? (
              <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                
                {/* 1. Parsed Data */}
                <div className="relative border border-border rounded-xl p-5 bg-card/50">
                  <div className="absolute -top-3 left-4 bg-card px-2 text-xs font-bold text-gray-400">STAGE 1: PARSED EXTRACTION</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                    <div><p className="text-xs text-gray-500">Raw Total Fare</p><p className="font-mono text-white text-lg">₹{selectedObs.parsed.raw_total_fare}</p></div>
                    <div><p className="text-xs text-gray-500">Base Fare</p><p className="font-mono text-gray-300">₹{selectedObs.parsed.base_fare || 'N/A'}</p></div>
                    <div><p className="text-xs text-gray-500">Taxes & Fees</p><p className="font-mono text-gray-300">₹{selectedObs.parsed.taxes || 'N/A'}</p></div>
                    <div><p className="text-xs text-gray-500">YQ Surcharge</p><p className="font-mono text-gray-300">₹{selectedObs.parsed.yq_surcharge || 'N/A'}</p></div>
                  </div>
                </div>

                <div className="flex justify-center"><ArrowDown className="text-border w-6 h-6" /></div>

                {/* 2. Normalization */}
                <div className="relative border border-border rounded-xl p-5 bg-card/50">
                  <div className="absolute -top-3 left-4 bg-card px-2 text-xs font-bold text-gray-400">STAGE 2: NORMALIZATION</div>
                  <div className="flex items-center gap-3 mt-2 mb-4 bg-blue-500/10 text-blue-400 p-3 rounded-lg text-sm border border-blue-500/20">
                    <Info className="w-5 h-5 flex-shrink-0" />
                    <p>Mathematical extraction of base components ($BF + UDF + ASF + GST + YQ$) removing optional convenience fees.</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-gray-400">Calculated Comparable Index Fare:</p>
                    <p className="font-mono text-xl font-bold text-emerald-400">₹{selectedObs.norm.comparable_index_fare}</p>
                  </div>
                </div>

                <div className="flex justify-center"><ArrowDown className="text-border w-6 h-6" /></div>

                {/* 3. Quality Gates */}
                <div className="relative border border-border rounded-xl p-5 bg-card/50">
                  <div className="absolute -top-3 left-4 bg-card px-2 text-xs font-bold text-gray-400">STAGE 3: QUALITY CHECK</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className={`p-3 rounded-lg border ${selectedObs.norm.outlier_flag ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                      <p className="text-xs mb-1">Outlier Classification</p>
                      <p className="font-bold text-sm">{selectedObs.norm.outlier_flag ? 'TRUE (Anomalous)' : 'FALSE (Clean)'}</p>
                    </div>
                    <div className={`p-3 rounded-lg border ${selectedObs.norm.commercial_dedup_flag ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                      <p className="text-xs mb-1">Commercial Deduplication</p>
                      <p className="font-bold text-sm">{selectedObs.norm.commercial_dedup_flag ? 'TRUE (Duplicate dropped)' : 'FALSE (Unique)'}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">Final Index Eligibility</p>
                      <p className="text-xs text-gray-500 mt-1">May this observation enter the Tier 1 computation?</p>
                    </div>
                    {selectedObs.norm.valid_for_index ? (
                      <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" /> VALID
                      </div>
                    ) : (
                      <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg font-bold flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" /> EXCLUDED
                      </div>
                    )}
                  </div>
                  
                  {!selectedObs.norm.valid_for_index && selectedObs.norm.exclusion_reason && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                      <span className="font-bold">Reason:</span> {selectedObs.norm.exclusion_reason}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="h-full flex items-center justify-center border border-dashed border-border rounded-xl">
                <p className="text-gray-500">Select an observation to view explainability</p>
              </div>
            )}
          </div>
        </div>
      </StateBoundary>
    </div>
  );
}

'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { NormalizedIndexObservation } from '@/types';
import { StateBoundary } from '@/components/StateBoundary';
import { ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, XCircle, Search } from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';

export default function DataCleaningPage() {
  const [observations, setObservations] = useState<NormalizedIndexObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedObs, setSelectedObs] = useState<NormalizedIndexObservation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadObservations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getNormalizedObservations(undefined, undefined, true);
      setObservations(data.items);
      if (data.items.length > 0) {
        setSelectedObs(data.items[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load observation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadObservations();
  }, []);

  const filteredObs = useMemo(() => {
    if (!searchQuery) return observations;
    return observations.filter(obs => {
      const q = searchQuery.toLowerCase();
      return obs.route_id.toLowerCase().includes(q) || 
             obs.parsed?.airline_code.toLowerCase().includes(q) ||
             obs.index_obs_id.toLowerCase().includes(q);
    });
  }, [observations, searchQuery]);

  // Aggregate Pipeline Counts
  const rawCount = observations.length;
  const parsedCount = observations.filter(o => o.parsed !== null).length;
  const normalizedCount = observations.filter(o => o.normalization_status === 'SUCCESS').length;
  const dqCount = observations.length; // DQ runs on all
  const indexReadyCount = observations.filter(o => o.valid_for_index).length;

  const getEventTag = (obs: NormalizedIndexObservation) => {
    if (obs.is_outlier) return { label: 'TECHNICAL OUTLIER', color: 'text-danger border-danger/30 bg-danger/10' };
    if (obs.commercial_dedup_status !== 'UNIQUE' && obs.commercial_dedup_status !== null) return { label: 'DUPLICATE', color: 'text-warning border-warning/30 bg-warning/10' };
    if (!obs.valid_for_index) return { label: 'INVALID FARE', color: 'text-danger border-danger/30 bg-danger/10' };
    return { label: 'VALID', color: 'text-success border-success/30 bg-success/10' };
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] p-6 flex flex-col gap-6 max-w-[1600px] mx-auto w-full fade-in">
      <header className="flex flex-col gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-xs font-semibold text-muted tracking-[0.2em] uppercase mb-1">Observation Integrity Engine</h2>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-danger" /> DATA QUALITY
          </h1>
        </div>

        {/* Pipeline Stage Counts */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
          <PipelineStage name="RAW" count={rawCount} active={true} />
          <ArrowRight className="w-4 h-4 text-muted flex-shrink-0" />
          <PipelineStage name="PARSED" count={parsedCount} active={parsedCount > 0} />
          <ArrowRight className="w-4 h-4 text-muted flex-shrink-0" />
          <PipelineStage name="NORMALIZED" count={normalizedCount} active={normalizedCount > 0} />
          <ArrowRight className="w-4 h-4 text-muted flex-shrink-0" />
          <PipelineStage name="DQ" count={dqCount} active={dqCount > 0} />
          <ArrowRight className="w-4 h-4 text-muted flex-shrink-0" />
          <PipelineStage name="INDEX READY" count={indexReadyCount} active={indexReadyCount > 0} isFinal />
        </div>
      </header>

      <StateBoundary loading={loading} error={error} onRetry={loadObservations} isEmpty={!loading && observations.length === 0}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
          
          {/* Data Grid / Quality Events */}
          <div className="lg:col-span-5 flex flex-col bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border bg-surface flex flex-col gap-3">
              <h3 className="text-xs font-semibold text-muted tracking-[0.2em] uppercase">Quality Events</h3>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
                <input
                  type="text"
                  placeholder="Search by ID, route, or airline..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-muted focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredObs.map(obs => {
                const tag = getEventTag(obs);
                const isSelected = selectedObs?.index_obs_id === obs.index_obs_id;
                return (
                  <button
                    key={obs.index_obs_id}
                    onClick={() => setSelectedObs(obs)}
                    className={clsx(
                      'w-full text-left p-3 rounded-lg text-sm transition-all border',
                      isSelected 
                        ? 'bg-accent/10 border-accent/40 shadow-[inset_4px_0_0_rgba(16,185,129,1)]' 
                        : 'bg-transparent border-transparent hover:bg-white/5'
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-white font-semibold">
                        {obs.route_id} <span className="text-muted mx-1">/</span> {obs.parsed?.airline_code ?? '---'}
                      </span>
                      <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded border', tag.color)}>
                        {tag.label}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono text-muted">
                      <span>{obs.booking_horizon}</span>
                      <span>₹{obs.comparable_index_fare}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inspector Panel */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {selectedObs ? (
              <>
                <div className="bg-card border border-border p-6 rounded-xl space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <h3 className="text-xs font-semibold text-muted tracking-[0.2em] uppercase">Inspector</h3>
                    <span className="text-[10px] font-mono text-muted">ID: {selectedObs.index_obs_id}</span>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <InspectorItem label="Route" value={selectedObs.route_id} />
                    <InspectorItem label="Airline" value={selectedObs.parsed?.airline_name ?? selectedObs.parsed?.airline_code ?? '---'} />
                    <InspectorItem label="Horizon" value={selectedObs.booking_horizon} />
                    <InspectorItem label="Travel Date" value={selectedObs.parsed?.travel_date ?? '---'} />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="p-4 border border-border rounded-lg bg-surface">
                      <h4 className="text-[10px] uppercase tracking-widest text-muted mb-3">Fare Components</h4>
                      <div className="space-y-2 font-mono text-sm">
                        <div className="flex justify-between text-muted"><span>Base Fare</span> <span>₹{selectedObs.parsed?.base_fare ?? '---'}</span></div>
                        <div className="flex justify-between text-muted"><span>UDF</span> <span>₹{selectedObs.parsed?.udf_fee ?? '---'}</span></div>
                        <div className="flex justify-between text-muted"><span>ASF</span> <span>₹{selectedObs.parsed?.asf_fee ?? '---'}</span></div>
                        <div className="flex justify-between text-muted"><span>GST</span> <span>₹{selectedObs.parsed?.gst_tax ?? '---'}</span></div>
                        <div className="flex justify-between border-t border-border pt-2 text-white font-bold">
                          <span>Comparable Fare</span> 
                          <span>₹{selectedObs.comparable_index_fare}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border border-border rounded-lg bg-surface">
                      <h4 className="text-[10px] uppercase tracking-widest text-muted mb-3">DQ Decision</h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          {selectedObs.valid_for_index ? <CheckCircle2 className="w-5 h-5 text-success" /> : <XCircle className="w-5 h-5 text-danger" />}
                          <span className={clsx('font-bold text-sm', selectedObs.valid_for_index ? 'text-success' : 'text-danger')}>
                            {selectedObs.valid_for_index ? 'INDEX ELIGIBLE' : 'EXCLUDED'}
                          </span>
                        </div>
                        {selectedObs.normalization_reason && (
                          <p className="text-xs font-mono text-muted p-2 bg-background border border-border rounded">
                            {selectedObs.normalization_reason}
                          </p>
                        )}
                        <p className="text-xs text-muted">
                          Deduplication: <span className="font-mono text-white">{selectedObs.commercial_dedup_status}</span>
                        </p>
                        <p className="text-xs text-muted">
                          Outlier: <span className="font-mono text-white">{selectedObs.is_outlier ? 'TRUE' : 'FALSE'}</span> ({selectedObs.outlier_status})
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Provenance Flow */}
                <div className="bg-card border border-border p-6 rounded-xl flex-1">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-semibold text-muted tracking-[0.2em] uppercase">Lineage</h3>
                    <Link href={`/provenance?id=${selectedObs.index_obs_id}`} className="text-xs text-accent hover:underline font-mono">View Cryptographic Evidence &rarr;</Link>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs font-mono text-muted relative">
                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-border -z-10" />
                    <ProvenanceNode label="RAW" active={true} />
                    <ProvenanceNode label="PARSED" active={selectedObs.parsed !== null} />
                    <ProvenanceNode label="NORMALIZED" active={selectedObs.normalization_status === 'SUCCESS'} />
                    <ProvenanceNode label="DQ DECISION" active={true} />
                    <ProvenanceNode label="INDEX" active={selectedObs.valid_for_index} />
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center border border-dashed border-border rounded-xl text-muted font-mono text-sm">
                SELECT AN OBSERVATION TO INSPECT
              </div>
            )}
          </div>

        </div>
      </StateBoundary>
    </div>
  );
}

function PipelineStage({ name, count, active, isFinal = false }: { name: string, count: number, active: boolean, isFinal?: boolean }) {
  return (
    <div className={clsx(
      'flex flex-col gap-1 px-4 py-2 rounded-lg border min-w-[120px] flex-shrink-0 transition-colors',
      active 
        ? (isFinal ? 'bg-success/10 border-success/40' : 'bg-blue/10 border-blue/40')
        : 'bg-card border-border opacity-50'
    )}>
      <span className={clsx('text-[10px] font-bold tracking-widest uppercase', active ? (isFinal ? 'text-success' : 'text-blue') : 'text-muted')}>{name}</span>
      <span className="text-xl font-mono text-white font-bold">{count.toLocaleString()}</span>
    </div>
  );
}

function InspectorItem({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted mb-1">{label}</p>
      <p className="font-mono text-white font-semibold truncate">{value}</p>
    </div>
  );
}

function ProvenanceNode({ label, active }: { label: string, active: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 bg-card px-2">
      <div className={clsx(
        'w-3 h-3 rounded-full',
        active ? 'bg-accent shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-border'
      )} />
      <span className={active ? 'text-white font-bold' : 'text-muted'}>{label}</span>
    </div>
  );
}

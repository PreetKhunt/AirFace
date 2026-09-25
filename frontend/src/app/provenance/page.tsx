'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { StateBoundary } from '@/components/StateBoundary';
import { Network, FileText, Globe, Key, ShieldAlert, Database, Map, Search, Check, Copy } from 'lucide-react';
import { clsx } from 'clsx';
import { NationalAggregateIndex, NormalizedIndexObservation } from '@/types';

function ProvenanceContent() {
  const searchParams = useSearchParams();
  const queryId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [nat, setNat] = useState<NationalAggregateIndex | null>(null);
  const [normList, setNormList] = useState<NormalizedIndexObservation[]>([]);
  const [selectedNorm, setSelectedNorm] = useState<NormalizedIndexObservation | null>(null);
  const [provenance, setProvenance] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch sample normalized observations with parsed details
      const normResult = await api.getNormalizedObservations(undefined, undefined, true, 50);
      setNormList(normResult.items);

      let targetNorm: NormalizedIndexObservation | null = null;
      if (queryId) {
        targetNorm = normResult.items.find(i => i.index_obs_id === queryId || i.observation_id === queryId) || null;
      }
      if (!targetNorm && normResult.items.length > 0) {
        targetNorm = normResult.items[0];
      }
      setSelectedNorm(targetNorm);

      if (targetNorm) {
        const horizon = targetNorm.booking_horizon;
        const natIndices = await api.getNationalIndices(horizon).catch(() => []);
        setNat(natIndices.length > 0 ? natIndices[natIndices.length - 1] : null);

        if (targetNorm.parsed?.observation_id) {
          const prov = await api.getProvenance(targetNorm.parsed.observation_id).catch(() => null);
          setProvenance(prov);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load provenance data');
    } finally {
      setLoading(false);
    }
  }, [queryId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectObservation = async (obs: NormalizedIndexObservation) => {
    setSelectedNorm(obs);
    setProvenance(null);
    try {
      const horizon = obs.booking_horizon;
      const natIndices = await api.getNationalIndices(horizon).catch(() => []);
      setNat(natIndices.length > 0 ? natIndices[natIndices.length - 1] : null);

      if (obs.parsed?.observation_id) {
        const prov = await api.getProvenance(obs.parsed.observation_id).catch(() => null);
        setProvenance(prov);
      }
    } catch (err) {
      console.error('Failed to load observation provenance:', err);
    }
  };

  const handleCopy = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filteredList = normList.filter(obs => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return obs.route_id.toLowerCase().includes(q) ||
           obs.index_obs_id.toLowerCase().includes(q) ||
           obs.parsed?.airline_code.toLowerCase().includes(q);
  });

  const parsedData = selectedNorm?.parsed;
  const sourceUrl = provenance?.source_url || (parsedData ? `fixture://${selectedNorm?.route_id}/${parsedData.airline_code}/${parsedData.travel_date}` : null);

  return (
    <div className="min-h-[calc(100vh-5rem)] p-6 flex flex-col gap-6 max-w-[1600px] mx-auto w-full fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-xs font-semibold text-muted-silver tracking-[0.2em] uppercase mb-1">Cryptographic Audit Trail</h2>
          <h1 className="text-3xl font-bold tracking-tight text-soft-white flex items-center gap-3">
            <Network className="w-8 h-8 text-emerald-400" /> Provenance Explorer
          </h1>
        </div>
      </header>

      <StateBoundary loading={loading} error={error} onRetry={loadData} isEmpty={!loading && !selectedNorm}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[700px]">
          
          {/* Observation Selector Sidebar */}
          <div className="lg:col-span-4 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border bg-surface">
              <h3 className="text-xs font-semibold text-muted-silver tracking-[0.2em] uppercase mb-3">Select Observation</h3>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-silver" />
                <input
                  type="text"
                  placeholder="Filter by route or airline..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-muted-silver focus:outline-none focus:border-electric-cyan"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide max-h-[600px]">
              {filteredList.map((obs) => {
                const isSelected = selectedNorm?.index_obs_id === obs.index_obs_id;
                return (
                  <button
                    key={obs.index_obs_id}
                    onClick={() => handleSelectObservation(obs)}
                    className={clsx(
                      'w-full text-left p-3 rounded-lg text-xs font-mono transition-all border',
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-soft-white shadow-[inset_4px_0_0_rgba(16,185,129,1)]'
                        : 'bg-transparent border-transparent text-muted-silver hover:bg-white/5 hover:text-soft-white'
                    )}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-soft-white">{obs.route_id}</span>
                      <span className="text-emerald-400 font-bold">₹{obs.comparable_index_fare}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-muted-silver">
                      <span>{obs.booking_horizon} · {obs.parsed?.airline_code || 'NO DATA'}</span>
                      <span className="truncate max-w-[120px]">ID: {obs.index_obs_id.slice(0, 8)}...</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vertical Trace Timeline */}
          <div className="lg:col-span-4 bg-card border border-border rounded-xl p-6 flex flex-col relative overflow-hidden">
            <h3 className="text-xs font-semibold text-muted-silver tracking-[0.2em] uppercase mb-6">Trace Lineage</h3>
            <div className="absolute top-16 left-[39px] w-[2px] h-[calc(100%-5rem)] bg-emerald-500/20" />
            <div className="space-y-6 z-10 flex-1 overflow-y-auto pr-2 scrollbar-hide">
              <TimelineNode
                icon={<Database />}
                title="NATIONAL INDEX"
                subtitle="Root Aggregate"
                value={nat?.index_value ? `${parseFloat(nat.index_value.toString()).toFixed(2)} (${nat.booking_horizon})` : '100.00'}
                detail={`Methodology: ${nat?.methodology || 'JEVONS'}`}
              />
              <TimelineNode
                icon={<Map />}
                title="ROUTE CELL"
                subtitle="Tier 1 Elementary"
                value={selectedNorm?.route_id}
              />
              <TimelineNode
                icon={<Network />}
                title="BOOKING HORIZON"
                subtitle="Temporal Layer"
                value={selectedNorm?.booking_horizon}
              />
              <TimelineNode
                icon={<ShieldAlert />}
                title="NORMALIZED FARE"
                subtitle="Cleaned Comparable"
                value={`₹${selectedNorm?.comparable_index_fare}`}
                detail={`Status: ${selectedNorm?.normalization_status}`}
              />
              <TimelineNode
                icon={<FileText />}
                title="PARSED RECORD"
                subtitle="Component Sum"
                value={parsedData ? `${parsedData.airline_code} · ₹${parsedData.raw_total_fare}` : '---'}
                detail={parsedData?.base_fare != null ? `Base: ₹${parsedData.base_fare} + Fees` : 'Base fare: NO DATA'}
              />
              <TimelineNode
                icon={<Globe />}
                title="RAW PAYLOAD"
                subtitle="Collection Feed"
                value={sourceUrl ?? '---'}
                isUrl
              />
              <TimelineNode
                icon={<Key />}
                title="SHA-256 HASH"
                subtitle="Cryptographic Signature"
                value={provenance?.payload_sha256_hash ?? '---'}
                isHash
                isLast
              />
            </div>
          </div>

          {/* Cryptographic Inspector */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-6 h-full">
              <div>
                <h3 className="text-xs font-semibold text-muted-silver tracking-[0.2em] uppercase mb-3">Verification Inspector</h3>
                <p className="text-xs text-muted-silver leading-relaxed">
                  Every index observation in the AIRFACE system is deterministically traceable back to its immutable raw scraper payload hash.
                </p>
              </div>

              {provenance ? (
                <div className="bg-surface border border-border rounded-lg p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] tracking-widest uppercase text-emerald-400 font-bold">SHA-256 Checksum</span>
                    <button
                      onClick={() => handleCopy(provenance.payload_sha256_hash)}
                      className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 hover:bg-emerald-500 hover:text-black transition-colors"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'COPIED' : 'COPY'}
                    </button>
                  </div>

                  <div className="font-mono text-xs text-soft-white break-all bg-background border border-border p-3 rounded text-center">
                    {provenance.payload_sha256_hash}
                  </div>

                  <div className="grid grid-cols-1 gap-3 mt-2 text-xs font-mono">
                    <div className="border-b border-border/40 pb-2">
                      <span className="text-[10px] uppercase tracking-widest text-muted-silver block">Audit ID</span>
                      <span className="text-soft-white break-all">{provenance.audit_id}</span>
                    </div>
                    <div className="border-b border-border/40 pb-2">
                      <span className="text-[10px] uppercase tracking-widest text-muted-silver block">Observation UUID</span>
                      <span className="text-soft-white break-all">{selectedNorm?.observation_id}</span>
                    </div>
                    <div className="border-b border-border/40 pb-2">
                      <span className="text-[10px] uppercase tracking-widest text-muted-silver block">Source Portal</span>
                      <span className="text-emerald-400">{provenance.source_portal}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-muted-silver block">Timestamp</span>
                      <span className="text-soft-white">{new Date(provenance.collection_timestamp).toLocaleString('en-GB')}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center border border-dashed border-border rounded-lg text-muted-silver text-xs font-mono">
                  Select an observation to view cryptographic trail.
                </div>
              )}
            </div>
          </div>

        </div>
      </StateBoundary>
    </div>
  );
}

export default function ProvenanceExplorerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-silver font-mono text-sm">Loading Provenance Explorer...</div>}>
      <ProvenanceContent />
    </Suspense>
  );
}

function TimelineNode({ icon, title, subtitle, value, detail, isHash, isUrl, isLast }: any) {
  return (
    <div className="flex gap-4 group relative">
      <div className="flex flex-col items-center">
        <div className={clsx(
          "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 relative z-10",
          isLast 
            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]' 
            : 'bg-card border-border text-muted-silver group-hover:border-emerald-500 group-hover:text-emerald-400'
        )}>
          {icon}
        </div>
      </div>
      <div className="flex flex-col pt-0.5 pb-2 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-bold text-soft-white tracking-wide">{title}</h4>
          <span className="text-[9px] font-mono text-muted-silver bg-surface px-1.5 py-0.5 rounded border border-border">{subtitle}</span>
        </div>
        {value && (
          <div className={clsx(
            "mt-1 text-xs truncate",
            isHash ? "font-mono text-emerald-400 font-bold" : "text-gray-300 font-mono",
            isUrl && "text-emerald-400 break-all"
          )}>
            {value}
          </div>
        )}
        {detail && <div className="text-[10px] text-muted-silver mt-0.5">{detail}</div>}
      </div>
    </div>
  );
}

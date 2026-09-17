'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { StateBoundary } from '@/components/StateBoundary';
import { Network, FileText, Globe, Key, ShieldAlert, Database, Map } from 'lucide-react';
import { clsx } from 'clsx';
import { NationalAggregateIndex, NormalizedIndexObservation } from '@/types';

export default function ProvenanceExplorerPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [nat, setNat] = useState<NationalAggregateIndex | null>(null);
  const [norm, setNorm] = useState<NormalizedIndexObservation | null>(null);
  const [provenance, setProvenance] = useState<any | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const natIndices = await api.getNationalIndices('T+1');
      const latestNat = natIndices.length > 0 ? natIndices[natIndices.length - 1] : null;

      const normResult = await api.getNormalizedObservations('DEL-BOM', 'T+1', true);
      const latestNorm = normResult.items.length > 0 ? normResult.items[0] : null;
      
      let provData = null;
      if (latestNorm && latestNorm.parsed) {
        provData = await api.getProvenance(latestNorm.parsed.observation_id).catch(() => null);
      }

      setNat(latestNat);
      setNorm(latestNorm);
      setProvenance(provData);
    } catch (err: any) {
      setError(err.message || 'Failed to load provenance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const parsedData = norm?.parsed;
  const sourceUrl = provenance?.source_url || (parsedData ? `fixture://${norm?.route_id}/${parsedData.airline_code}/${parsedData.travel_date}` : null);

  const handleCopy = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] p-6 flex flex-col gap-6 max-w-[1600px] mx-auto w-full fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-xs font-semibold text-muted tracking-[0.2em] uppercase mb-1">Cryptographic Audit Trail</h2>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Network className="w-8 h-8 text-accent" /> Provenance Explorer
          </h1>
        </div>
      </header>

      <StateBoundary loading={loading} error={error} onRetry={loadData} isEmpty={!loading && !nat}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-[700px]">
          
          {/* Vertical Glowing Timeline */}
          <div className="lg:col-span-1 bg-card border border-border rounded-xl p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-[39px] w-[2px] h-full bg-accent/20" />
            <div className="space-y-8 z-10 flex-1 overflow-y-auto pr-4 scrollbar-hide">
              <TimelineNode
                icon={<Database />}
                title="NATIONAL INDEX"
                subtitle="Root Aggregate"
                value={nat?.index_value}
                detail={`Methodology: ${nat?.methodology}`}
              />
              <TimelineNode
                icon={<Map />}
                title="ROUTE"
                subtitle="Tier 1 Cell"
                value={norm?.route_id}
              />
              <TimelineNode
                icon={<Network />}
                title="HORIZON"
                subtitle="Temporal Boundary"
                value={norm?.booking_horizon}
              />
              <TimelineNode
                icon={<ShieldAlert />}
                title="NORMALIZATION & DQ"
                subtitle="Processed Entity"
                value={`₹${norm?.comparable_index_fare}`}
                detail={`Status: ${norm?.normalization_status}`}
              />
              <TimelineNode
                icon={<FileText />}
                title="PARSED OBSERVATION"
                subtitle="Structural Data"
                value={parsedData?.airline_code}
                detail={`Raw total: ₹${parsedData?.raw_total_fare}`}
              />
              <TimelineNode
                icon={<Globe />}
                title="RAW EVIDENCE"
                subtitle="Collection Payload"
                value={sourceUrl ?? '---'}
                isUrl
              />
              <TimelineNode
                icon={<Key />}
                title="SHA-256 CHECKSUM"
                subtitle="Cryptographic Identity"
                value={provenance?.payload_sha256_hash ?? '---'}
                isHash
                isLast
              />
            </div>
          </div>

          {/* Inspector Details */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-card border border-border rounded-xl p-8 flex flex-col gap-8 h-full">
              <div>
                <h3 className="text-xs font-semibold text-muted tracking-[0.2em] uppercase mb-4">Node Details</h3>
                <p className="text-sm text-gray-400">
                  Every final index value is deterministically built from cryptographic artifacts. 
                  The provenance graph maps the exact lineage from the final national Jevons aggregation back to the immutable raw HTML/JSON payloads returned by the scraper engine.
                </p>
              </div>

              {provenance && (
                <div className="bg-surface border border-border rounded-lg p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] tracking-widest uppercase text-accent">Artifact Hash</span>
                    <button onClick={() => handleCopy(provenance.payload_sha256_hash)} className="text-[10px] font-bold px-3 py-1 bg-accent/10 text-accent rounded border border-accent/20 hover:bg-accent hover:text-black transition-colors">
                      COPY TO CLIPBOARD
                    </button>
                  </div>
                  <div className="font-mono text-sm text-white break-all bg-background border border-border p-4 rounded text-center">
                    {provenance.payload_sha256_hash}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-muted block mb-1">Index Observation UUID</span>
                      <span className="font-mono text-xs text-white break-all">{norm?.index_obs_id}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-muted block mb-1">Parsed DB UUID</span>
                      <span className="font-mono text-xs text-white break-all">{parsedData?.observation_id}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </StateBoundary>
    </div>
  );
}

function TimelineNode({ icon, title, subtitle, value, detail, isHash, isUrl, isLast }: any) {
  return (
    <div className="flex gap-6 group relative cursor-pointer">
      <div className="flex flex-col items-center">
        <div className={clsx(
          "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 relative z-10",
          isLast 
            ? 'bg-accent/20 border-accent text-accent shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
            : 'bg-card border-border text-muted group-hover:border-accent group-hover:text-accent'
        )}>
          {icon}
        </div>
      </div>
      <div className="flex flex-col pt-1 pb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>
          <span className="text-[10px] font-mono text-muted bg-surface px-2 py-0.5 rounded border border-border">{subtitle}</span>
        </div>
        {value && (
          <div className={clsx(
            "mt-2 text-sm",
            isHash ? "font-mono text-accent font-bold" : "text-gray-300 font-mono",
            isUrl && "text-blue break-all"
          )}>
            {value}
          </div>
        )}
        {detail && <div className="text-xs text-muted mt-1">{detail}</div>}
      </div>
    </div>
  );
}

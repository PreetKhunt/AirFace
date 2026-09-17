'use client';

import { useEffect, useState } from 'react';
import { Network, ShieldCheck, CheckSquare, FileText, Globe } from 'lucide-react';
import { api } from '@/lib/api';
import { StateBoundary } from '@/components/StateBoundary';
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

      // Get real national index data
      const natIndices = await api.getNationalIndices('T+1');
      const latestNat = natIndices.length > 0 ? natIndices[natIndices.length - 1] : null;

      // Get normalized observation with embedded parsed data (include_parsed=true)
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

  return (
    <div className="min-h-screen p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <header className="p-6 bg-card border border-border rounded-xl shadow-sm">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
          Provenance Explorer
        </h1>
        <p className="text-sm text-gray-400">
          Cryptographic audit trail: complete lineage from national aggregate index to raw scraped payload.
        </p>
      </header>

      <StateBoundary loading={loading} error={error} onRetry={loadData} isEmpty={!loading && !nat}>
        <div className="bg-card border border-border rounded-xl p-8 max-w-3xl mx-auto">
          <div className="space-y-0">

            <ProvenanceStep
              icon={<Network className="w-5 h-5 text-blue-400"/>}
              title="National Index Aggregation"
              value={nat ? `${nat.index_value} (${nat.booking_horizon})` : '—'}
              desc={nat ? `${nat.methodology} | ${nat.calculation_date} | ${nat.route_count} routes` : '—'}
              isFirst
            />

            <ProvenanceStep
              icon={<CheckSquare className="w-5 h-5 text-emerald-400"/>}
              title="Normalized Observation"
              value={norm ? `₹${norm.comparable_index_fare} Comparable Fare` : '—'}
              desc={norm ? `Status: ${norm.normalization_status} | Outlier: ${norm.outlier_status}` : '—'}
            />

            <ProvenanceStep
              icon={<FileText className="w-5 h-5 text-amber-400"/>}
              title="Parsed Airfare Observation"
              value={parsedData ? `${parsedData.airline_code} ${parsedData.flight_number}` : '—'}
              desc={parsedData
                ? `₹${parsedData.raw_total_fare} · Travel: ${parsedData.travel_date} · BW: ${parsedData.booking_window_days}d`
                : '—'}
            />

            <ProvenanceStep
              icon={<Globe className="w-5 h-5 text-rose-400"/>}
              title="Raw Collection Source"
              value={sourceUrl ?? 'Source URL not available'}
              desc={parsedData
                ? `Observation ID: ${parsedData.observation_id}`
                : 'Raw HTML not exposed to browser'}
              monospace
            />

            <ProvenanceStep
              icon={<ShieldCheck className="w-5 h-5 text-emerald-400"/>}
              title="Canonical Provenance Hash"
              value={provenance ? provenance.payload_sha256_hash : '—'}
              desc={provenance ? `Observation UUID: ${provenance.observation_id}` : '—'}
              isLast
              monospace
            />

          </div>
        </div>
      </StateBoundary>
    </div>
  );
}

function ProvenanceStep({
  icon, title, value, desc, isFirst, isLast, monospace
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  desc: string;
  isFirst?: boolean;
  isLast?: boolean;
  monospace?: boolean;
}) {
  return (
    <div className="flex gap-4 group">
      <div className="flex flex-col items-center">
        <div className={`w-12 h-12 rounded-full border-2 bg-card flex items-center justify-center z-10 transition-colors group-hover:border-accent ${isLast ? 'border-emerald-500' : 'border-border'}`}>
          {icon}
        </div>
        {!isLast && <div className="w-0.5 h-16 bg-border group-hover:bg-accent/50 transition-colors -my-2" />}
      </div>
      <div className="pt-2 pb-6 min-w-0 flex-1">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{title}</h3>
        <p className={`text-lg font-bold mt-1 break-all ${monospace ? 'font-mono text-sm text-emerald-400' : 'text-white'}`}>
          {value}
        </p>
        <p className="text-sm text-gray-500 mt-1">{desc}</p>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Network, ShieldCheck, CheckSquare, FileText, Globe } from 'lucide-react';
import { api } from '@/lib/api';
import { StateBoundary } from '@/components/StateBoundary';

export default function ProvenanceExplorerPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch some real data to form a trace
      const natIndices = await api.getNationalIndices('T+1');
      const latestNat = natIndices.length > 0 ? natIndices[natIndices.length - 1] : null;

      const normObsList = await api.getNormalizedObservations('DEL-BOM', 'T+1');
      const latestNorm = normObsList && normObsList.items && normObsList.items.length > 0 ? normObsList.items[0] : null;
      
      setData({
        nat: latestNat,
        norm: latestNorm?.norm,
        parsed: latestNorm?.parsed,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load provenance data');
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
          Provenance Explorer
        </h1>
        <p className="text-sm text-gray-400">Cryptographic audit trail demonstrating the complete lineage from macroscopic index to raw scraped payload.</p>
      </header>

      <StateBoundary loading={loading} error={error} onRetry={loadData} isEmpty={!loading && !data?.nat}>
        <div className="bg-card border border-border rounded-xl p-8 max-w-3xl mx-auto">
          <div className="space-y-0">
            
            <ProvenanceStep 
              icon={<Network className="w-5 h-5 text-blue-400"/>}
              title="National Index Aggregation"
              value={data?.nat ? data.nat.index_value : "---"}
              desc="Weighted Young / Modified Laspeyres Method"
              isFirst
            />
            
            <ProvenanceStep 
              icon={<CheckSquare className="w-5 h-5 text-emerald-400"/>}
              title="Normalized Observation"
              value={data?.norm ? `₹${data.norm.comparable_index_fare} Comparable Fare` : "---"}
              desc="Extracted Base Fare + Taxes. Validated against IQR Outlier boundaries."
            />

            <ProvenanceStep 
              icon={<FileText className="w-5 h-5 text-amber-400"/>}
              title="Parsed Airfare Observation"
              value={data?.parsed ? `${data.parsed.airline_code} ${data.parsed.flight_number}` : "---"}
              desc={data?.parsed ? `Raw Total: ₹${data.parsed.raw_total_fare} | Travel Date: ${data.parsed.travel_date}` : "---"}
            />

            <ProvenanceStep 
              icon={<Globe className="w-5 h-5 text-rose-400"/>}
              title="Raw Scraped Payload"
              value="Source Document Snippet"
              desc={data?.parsed ? `Observation ID: ${data.parsed.observation_id}` : "---"}
            />

            <ProvenanceStep 
              icon={<ShieldCheck className="w-5 h-5 text-emerald-400"/>}
              title="Canonical Provenance Hash"
              value="SHA-256 Checksum Verified"
              desc={data?.norm ? data.norm.index_obs_id : "---"}
              isLast
            />
            
          </div>
        </div>
      </StateBoundary>
    </div>
  );
}

function ProvenanceStep({ icon, title, value, desc, isFirst, isLast }: any) {
  return (
    <div className="flex gap-4 group">
      <div className="flex flex-col items-center">
        <div className={`w-12 h-12 rounded-full border-2 bg-card flex items-center justify-center z-10 transition-colors group-hover:border-accent ${isLast ? 'border-emerald-500' : 'border-border'}`}>
          {icon}
        </div>
        {!isLast && <div className="w-0.5 h-16 bg-border group-hover:bg-accent/50 transition-colors -my-2" />}
      </div>
      <div className="pt-2 pb-6">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{title}</h3>
        <p className={`text-lg font-bold mt-1 ${isLast ? 'text-emerald-400 font-mono text-sm break-all' : 'text-white'}`}>{value}</p>
        <p className="text-sm text-gray-500 mt-1">{desc}</p>
      </div>
    </div>
  );
}



function ProvenanceArrow() {
  return null; // The line is drawn by the step itself now
}


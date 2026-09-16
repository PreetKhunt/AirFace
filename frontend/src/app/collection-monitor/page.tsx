'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { SourceHealth } from '@/types';
import { StateBoundary } from '@/components/StateBoundary';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export default function CollectionMonitorPage() {
  const [sources, setSources] = useState<SourceHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getSources();
      setSources(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load source health data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatusIcon = (status: string) => {
    if (status === 'HEALTHY') return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    if (status === 'DEGRADED') return <AlertCircle className="w-5 h-5 text-amber-400" />;
    return <XCircle className="w-5 h-5 text-red-400" />;
  };

  return (
    <div className="min-h-screen p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <header className="p-6 bg-card border border-border rounded-xl shadow-sm">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
          Data Collection Monitor
        </h1>
        <p className="text-sm text-gray-400">Real-time status of the distributed scraper fleet and adapter health.</p>
      </header>

      <StateBoundary loading={loading} error={error} onRetry={loadData} isEmpty={!loading && sources.length === 0}>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 uppercase bg-card/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Source Adapter</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Success Rate</th>
                  <th className="px-6 py-4 font-semibold">Total Scraped</th>
                  <th className="px-6 py-4 font-semibold">Error Count</th>
                  <th className="px-6 py-4 font-semibold">Avg Latency (ms)</th>
                  <th className="px-6 py-4 font-semibold">Last Collection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sources.map(source => (
                  <tr key={source.source_id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{source.source_name}</td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      {getStatusIcon(source.status)}
                      <span className={source.status === 'HEALTHY' ? 'text-emerald-400' : 'text-amber-400'}>{source.status}</span>
                    </td>
                    <td className="px-6 py-4">{source.success_rate}%</td>
                    <td className="px-6 py-4">{source.total_records_scraped.toLocaleString()}</td>
                    <td className="px-6 py-4 text-red-400">{source.error_count.toLocaleString()}</td>
                    <td className="px-6 py-4">{source.average_latency_ms}</td>
                    <td className="px-6 py-4 text-gray-400">{new Date(source.last_collection_time).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </StateBoundary>
    </div>
  );
}

'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { SystemStatusResponse, NationalAggregateIndex, DataQualityLog, SourceHealth } from '@/types';
import { Activity, ArrowUpRight, ArrowDownRight, ShieldCheck, Database, Calendar } from 'lucide-react';
import { DataModeBadge } from '@/components/DataModeBadge';
import { StateBoundary } from '@/components/StateBoundary';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function OverviewPage() {
  const [sysStatus, setSysStatus] = useState<SystemStatusResponse | null>(null);
  const [indices, setIndices] = useState<NationalAggregateIndex[]>([]);
  const [dq, setDq] = useState<DataQualityLog | null>(null);
  const [sources, setSources] = useState<SourceHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sys, nat, quality, srcs] = await Promise.all([
        api.getSystemStatus(),
        api.getNationalIndices().catch(() => []),
        api.getQualityScore().catch(() => null),
        api.getSources().catch(() => [])
      ]);
      setSysStatus(sys);
      setIndices(nat);
      setDq(quality);
      setSources(srcs);
    } catch (err: any) {
      setError(err.message || 'Failed to load overview data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute latest metrics from indices
  const latestIndex = indices.length > 0 ? indices[indices.length - 1] : null;
  const lastIndexValue = latestIndex ? parseFloat(latestIndex.index_value) : null;

  // We can calculate daily change from `indices` array.
  let dailyChange = 0;
  if (indices.length >= 2) {
    const curr = parseFloat(indices[indices.length - 1].index_value);
    const prev = parseFloat(indices[indices.length - 2].index_value);
    dailyChange = ((curr - prev) / prev) * 100;
  }

  // Chart data
  const chartData = useMemo(() => {
    return indices.map(idx => ({
      date: idx.calculation_date,
      value: parseFloat(idx.index_value)
    }));
  }, [indices]);

  const validDates = sources
    .map(s => s.last_collection_time ? new Date(s.last_collection_time).getTime() : 0)
    .filter(t => t > 0);
  const lastCollection = validDates.length > 0 
    ? new Date(Math.max(...validDates)).toLocaleString()
    : 'Unknown';

  return (
    <div className="min-h-screen p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 bg-card border border-border rounded-xl shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
            Real-Time Airfare Price Index
          </h1>
          <p className="text-sm text-gray-400">National Overview & Aggregated Metrics</p>
        </div>
        {sysStatus && <DataModeBadge mode={sysStatus.data_mode} />}
      </header>

      <StateBoundary loading={loading} error={error} onRetry={loadData} isEmpty={!loading && indices.length === 0} emptyMessage="No index data available yet.">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-card border border-border rounded-xl">
            <p className="text-sm font-medium text-gray-400">Current National Index</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{lastIndexValue?.toFixed(2) || '---'}</span>
            </div>
            {indices.length >= 2 && (
              <p className={`text-sm mt-1 flex items-center gap-1 ${dailyChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {dailyChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(dailyChange).toFixed(2)}% daily change
              </p>
            )}
          </div>

          <div className="p-5 bg-card border border-border rounded-xl">
            <p className="text-sm font-medium text-gray-400">Current Coverage</p>
            <div className="mt-2">
              <span className="text-3xl font-bold text-white">{latestIndex?.coverage_pct || '0.00'}%</span>
            </div>
            <p className="text-sm mt-1 text-gray-400">Route availability</p>
          </div>

          <div className="p-5 bg-card border border-border rounded-xl">
            <p className="text-sm font-medium text-gray-400">Data Quality Score</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-3xl font-bold text-white">{dq?.composite_score || '---'}</span>
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-sm mt-1 text-gray-400">Composite integrity</p>
          </div>

          <div className="p-5 bg-card border border-border rounded-xl">
            <p className="text-sm font-medium text-gray-400">Last Successful Collection</p>
            <div className="mt-2">
              <span className="text-lg font-bold text-white leading-tight block">{lastCollection}</span>
            </div>
            <p className="text-sm mt-1 text-gray-400 flex items-center gap-1">
              <Database className="w-4 h-4" /> System heartbeat
            </p>
          </div>
        </div>

        {/* Pipeline System Component */}
        <div className="p-6 bg-card border border-border rounded-xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Pipeline Status</h2>
          <div className="flex flex-col md:flex-row justify-between items-center relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10 hidden md:block"></div>
            
            {/* Steps */}
            {[
              { name: 'Sources', val: `${sources.filter(s => s.status === 'HEALTHY').length}/${sources.length} OK` },
              { name: 'Collection', val: `${sources.reduce((a,b) => a + b.total_records_scraped, 0)} obs` },
              { name: 'Normalization', val: dq ? 'Cleaned' : 'Pending' },
              { name: 'Quality', val: dq ? `${dq.composite_score}/100` : '---' },
              { name: 'Index', val: latestIndex ? `${latestIndex.route_count} routes` : '---' },
              { name: 'Validation', val: dq ? (parseFloat(dq.composite_score) >= 60 ? 'Pass' : 'Review') : '---' },
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center bg-card p-2 rounded-lg mb-4 md:mb-0 border md:border-none border-border">
                <div className="w-10 h-10 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center text-accent font-bold mb-2">
                  {idx + 1}
                </div>
                <span className="text-sm font-semibold text-white">{step.name}</span>
                <span className="text-xs text-gray-400">{step.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chart */}
        <div className="p-6 bg-card border border-border rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">NATIONAL AIRFARE INDEX</h2>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  stroke="#888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val: number) => val.toFixed(1)}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#888', marginBottom: '4px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#1a1a1a', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#3b82f6' }}
                  name="Index Value"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </StateBoundary>
    </div>
  );
}

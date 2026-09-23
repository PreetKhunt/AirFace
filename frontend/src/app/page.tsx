'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { SystemStatusResponse, NationalAggregateIndex, DataQualityLog, SourceHealth, BacktestRun } from '@/types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StateBoundary } from '@/components/StateBoundary';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function OverviewPage() {
  const [sysStatus, setSysStatus] = useState<SystemStatusResponse | null>(null);
  const [indices, setIndices] = useState<NationalAggregateIndex[]>([]);
  const [dq, setDq] = useState<DataQualityLog | null>(null);
  const [sources, setSources] = useState<SourceHealth[]>([]);
  const [backtests, setBacktests] = useState<BacktestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sys, nat, quality, srcs, tests] = await Promise.all([
        api.getSystemStatus(),
        api.getNationalIndices().catch(() => []),
        api.getQualityScore().catch(() => null),
        api.getSources().catch(() => []),
        api.getBacktestResults().catch(() => [])
      ]);
      setSysStatus(sys);
      setIndices(nat);
      setDq(quality);
      setSources(srcs);
      setBacktests(tests);
    } catch (err: any) {
      setError(err.message || 'Failed to load overview data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const latestIndex = indices.length > 0 ? indices[indices.length - 1] : null;
  const lastIndexValue = latestIndex ? parseFloat(latestIndex.index_value) : null;
  const latestBacktest = backtests.length > 0 ? backtests[0] : null;

  let dailyChange = 0;
  if (indices.length >= 2) {
    const curr = parseFloat(indices[indices.length - 1].index_value);
    const prev = parseFloat(indices[indices.length - 2].index_value);
    dailyChange = ((curr - prev) / prev) * 100;
  }

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
    ? new Date(Math.max(...validDates)).toLocaleTimeString('en-GB')
    : '---';

  const totalScraped = sources.reduce((sum, s) => sum + s.total_records_scraped, 0);
  const healthySources = sources.filter(s => s.status === 'HEALTHY').length;

  return (
    <div className="min-h-[calc(100vh-5rem)] p-6 md:p-8 flex flex-col gap-8 max-w-[1600px] mx-auto w-full fade-in">
      <StateBoundary loading={loading} error={error} onRetry={loadData} isEmpty={!loading && indices.length === 0} emptyMessage="No index data available in the current environment.">
        
        {/* HERO SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 flex flex-col justify-center space-y-6">
            <div>
              <h2 className="text-xs font-semibold text-muted tracking-[0.2em] uppercase mb-2">National Airfare Price Index</h2>
              <div className="flex items-baseline gap-3">
                <span className="text-6xl font-bold tracking-tighter text-white font-mono">
                  {lastIndexValue?.toFixed(2) || '---'}
                </span>
              </div>
              {indices.length >= 2 && (
                <div className={`flex items-center gap-2 mt-2 text-sm font-medium ${dailyChange >= 0 ? 'text-accent' : 'text-danger'}`}>
                  {dailyChange >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  <span>{Math.abs(dailyChange).toFixed(2)}% vs previous</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted mb-1">Coverage</p>
                <p className="text-xl font-mono text-white">{latestIndex?.coverage_pct || '0.00'}%</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted mb-1">Last Updated</p>
                <p className="text-xl font-mono text-white">{lastCollection}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 h-[300px] lg:h-[400px] bg-card/30 border border-border rounded-2xl relative overflow-hidden flex items-end">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#f8fafc' }}
                  itemStyle={{ color: '#10b981', fontWeight: 600, fontFamily: 'monospace' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
            
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-2 py-1 text-[10px] font-mono tracking-widest bg-accent/10 text-accent rounded border border-accent/20">
                {sysStatus?.data_mode ?? 'LOADING'} DATA
              </span>
            </div>
          </div>
        </section>

        {/* METRICS ROW */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard title="Collection Health" value={`${healthySources}/${sources.length}`} sub="Adapters Online" status={healthySources === sources.length && sources.length > 0 ? 'good' : 'warn'} />
          <MetricCard title="Data Quality" value={dq?.composite_score || '---'} sub="Composite Score" status={parseFloat(dq?.composite_score || '0') >= 80 ? 'good' : 'warn'} />
          <MetricCard title="Active Routes" value={latestIndex?.route_count?.toString() || '---'} sub="Indexed Corridors" />
          <MetricCard title="Observations" value={totalScraped.toLocaleString()} sub="Raw Fare Points" />
          <MetricCard title="Airlines" value="4" sub="Domestic Carriers" />
          <MetricCard 
            title="Validation" 
            value={latestBacktest ? latestBacktest.status.replace('_', ' ') : '---'} 
            sub="30-Day Backtest" 
            status={latestBacktest?.status === 'VALIDATED' ? 'good' : (latestBacktest?.status === 'INSUFFICIENT_DATA' ? 'warn' : 'bad')} 
          />
        </section>

      </StateBoundary>
    </div>
  );
}

function MetricCard({ title, value, sub, status }: { title: string, value: string, sub: string, status?: 'good'|'warn'|'bad' }) {
  let color = 'text-white';
  if (status === 'good') color = 'text-accent';
  if (status === 'warn') color = 'text-warning';
  if (status === 'bad') color = 'text-danger';

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between group hover:border-border/80 transition-colors">
      <h3 className="text-[10px] uppercase tracking-widest text-muted mb-4">{title}</h3>
      <div>
        <div className={`text-3xl font-mono font-bold ${color}`}>{value}</div>
        <div className="text-xs text-muted mt-1">{sub}</div>
      </div>
    </div>
  );
}

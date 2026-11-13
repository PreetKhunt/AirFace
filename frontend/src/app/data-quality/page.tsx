'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { DataQualityLog, NormalizedIndexObservation } from '@/types';
import { StateBoundary } from '@/components/StateBoundary';
import { AreaChart, Area, Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

const BOOKING_HORIZONS = ['T+1', 'T+7', 'T+15', 'T+30', 'T+45'];

export default function DataQualityPage() {
  const [history, setHistory] = useState<DataQualityLog[]>([]);
  const [observations, setObservations] = useState<NormalizedIndexObservation[]>([]);
  const [selectedHorizon, setSelectedHorizon] = useState('T+1');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, normalized] = await Promise.all([
        api.getQualityHistory(),
        api.getNormalizedObservations(undefined, undefined, false, 500, 'HISTORICAL'),
      ]);
      setHistory(data
        .filter(log => Number(log.synthetic_share ?? 0) === 0)
        .sort((a, b) => new Date(a.calculation_date).getTime() - new Date(b.calculation_date).getTime()));
      setObservations(normalized.items);
    } catch (err: any) {
      setError(err.message || 'Failed to load data quality history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const latest = history.length > 0 ? history[history.length - 1] : null;

  const chartData = useMemo(() => {
    return history.map(h => ({
      date: h.calculation_date,
      score: h.composite_score == null ? null : parseFloat(h.composite_score)
    }));
  }, [history]);

  const horizonQuality = useMemo(() => BOOKING_HORIZONS.map(horizon => {
    const rows = observations.filter(row => row.booking_horizon === horizon);
    return {
      horizon,
      observations: rows.length,
      marketSurges: rows.filter(row => row.outlier_status === 'POSSIBLE_MARKET_SURGE').length,
      technicalOutliers: rows.filter(row => row.outlier_status === 'TECHNICAL_OUTLIER').length,
      duplicates: rows.filter(row => row.commercial_dedup_status === 'COMMERCIAL_DUPLICATE').length,
      invalid: rows.filter(row => !row.valid_for_index).length,
      averageFare: rows.length
        ? rows.reduce((sum, row) => sum + Number(row.comparable_index_fare), 0) / rows.length
        : null,
    };
  }), [observations]);
  const selectedQuality = horizonQuality.find(item => item.horizon === selectedHorizon);

  return (
    <div className="min-h-[calc(100vh-5rem)] p-6 flex flex-col gap-6 max-w-[1600px] mx-auto w-full fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-xs font-semibold text-muted-silver tracking-[0.2em] uppercase mb-1">System Health</h2>
          <h1 className="text-3xl font-bold tracking-tight text-soft-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-400" /> Data Quality Scores
          </h1>
        </div>
        <Link href="/data-cleaning" className="px-4 py-2 bg-card border border-border text-white text-xs font-bold tracking-widest uppercase rounded hover:bg-white/5 transition-colors">
          Open Integrity Engine &rarr;
        </Link>
      </header>

      <p className="text-xs text-muted-silver font-mono">
        Synthetic share in scored batch: {latest?.synthetic_share == null ? 'NO DATA' : `${(parseFloat(latest.synthetic_share) * 100).toFixed(2)}%`}
      </p>

      <StateBoundary loading={loading} error={error} onRetry={loadData} isEmpty={!loading && history.length === 0 && observations.length === 0}>
        
        {latest && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-card border border-border rounded-xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-accent/5 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity" />
              <ShieldCheck className="w-16 h-16 text-accent mb-6" />
              <h2 className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-2">Composite Score</h2>
              <div className="text-6xl font-bold text-white font-mono mb-4">{latest.composite_score ?? 'NO DATA'}</div>
              {(() => {
                const score = latest.composite_score == null ? null : parseFloat(latest.composite_score);
                const label = score == null ? 'NO DATA' : score >= 80 ? 'EXCELLENT' : score >= 60 ? 'ACCEPTABLE' : 'DEGRADED';
                const color = score == null ? 'text-muted border-border bg-surface' : score >= 80 ? 'text-accent border-accent/30 bg-accent/10' : score >= 60 ? 'text-warning border-warning/30 bg-warning/10' : 'text-danger border-danger/30 bg-danger/10';
                return <p className={`text-[10px] font-bold tracking-widest px-3 py-1 rounded border ${color}`}>{label}</p>;
              })()}
            </div>
            
            <div className="md:col-span-2 bg-card border border-border rounded-xl p-8 flex flex-col">
              <h3 className="text-xs font-semibold text-muted tracking-[0.2em] uppercase mb-6">8-Factor Vector Breakdown</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                {[
                  { label: 'Completeness', val: latest.completeness_score },
                  { label: 'Validity', val: latest.validity_score },
                  { label: 'Consistency', val: latest.consistency_score },
                  { label: 'Timeliness', val: latest.timeliness_score },
                  { label: 'Reliability', val: latest.source_reliability_score },
                  { label: 'Dedup', val: latest.dedup_integrity_score },
                  { label: 'Outlier', val: latest.outlier_cleanliness_score },
                  { label: 'Coverage', val: latest.availability_coverage_score },
                ].map((item, idx) => (
                  <div key={idx} className="bg-surface border border-border rounded-lg p-4 flex flex-col justify-between">
                    <p className="text-[10px] text-muted tracking-widest uppercase mb-2">{item.label}</p>
                    <p className="text-2xl font-mono font-bold text-white">{item.val == null ? 'NO DATA' : `${item.val}%`}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <section className="p-6 bg-card border border-border rounded-xl mt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xs font-semibold text-muted tracking-[0.2em] uppercase">Quality Events by Horizon</h3>
              <p className="text-xs text-muted-silver mt-1">Historical records only · synthetic benchmark excluded</p>
            </div>
            <div role="group" aria-label="Select booking horizon" className="flex flex-wrap gap-1 bg-surface border border-border p-1 rounded-lg">
              {BOOKING_HORIZONS.map(horizon => (
                <button
                  key={horizon}
                  type="button"
                  aria-pressed={selectedHorizon === horizon}
                  onClick={() => setSelectedHorizon(horizon)}
                  className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${selectedHorizon === horizon ? 'bg-emerald-500/15 text-emerald-300' : 'text-muted-silver hover:text-white'}`}
                >
                  {horizon}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <HorizonMetric label="Observations" value={selectedQuality?.observations ?? 0} />
            <HorizonMetric label="Index Eligible" value={selectedQuality ? selectedQuality.observations - selectedQuality.invalid : 0} />
            <HorizonMetric label="Average Comparable Fare" value={selectedQuality?.averageFare == null ? 'NO DATA' : `₹${selectedQuality.averageFare.toFixed(0)}`} />
            <HorizonMetric label="Market Surges" value={selectedQuality?.marketSurges ?? 0} />
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={horizonQuality} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="horizon" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#f8fafc' }} />
                <Bar dataKey="marketSurges" name="Market surges" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                <Bar dataKey="technicalOutliers" name="Technical outliers" fill="#ef4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="duplicates" name="Commercial duplicates" fill="#38bdf8" radius={[3, 3, 0, 0]} />
                <Bar dataKey="invalid" name="Index-ineligible" fill="#a78bfa" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="p-6 bg-card border border-border rounded-xl mt-6">
          <h3 className="text-xs font-semibold text-muted tracking-[0.2em] uppercase mb-6">Historical Trajectory</h3>
          <div className="h-80 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#f8fafc' }}
                  itemStyle={{ color: '#10b981', fontWeight: 600, fontFamily: 'monospace' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#scoreColor)" activeDot={{ r: 6, fill: '#10b981', stroke: '#18181b', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </StateBoundary>
    </div>
  );
}

function HorizonMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="p-4 bg-surface border border-border rounded-lg">
      <p className="text-[10px] uppercase tracking-widest text-muted mb-2">{label}</p>
      <p className="text-xl font-mono font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </div>
  );
}

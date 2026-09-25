'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { NationalAggregateIndex, ElementaryRouteIndex } from '@/types';
import { StateBoundary } from '@/components/StateBoundary';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { BarChart3, TrendingUp, Layers, Scale, Info } from 'lucide-react';
import { clsx } from 'clsx';

// These values mirror the demo route basket seeded in the backend. They are
// illustrative traffic weights, not official consumer expenditure weights.
const DGCA_WEIGHTS_INFO = [
  { route: 'DEL-BOM', desc: 'Delhi – Mumbai', weight: '24.50%', volume: '11.8M PAX', share: 'High Density Metro' },
  { route: 'DEL-BLR', desc: 'Delhi – Bengaluru', weight: '18.20%', volume: '8.7M PAX', share: 'Tech Metro Corridor' },
  { route: 'BOM-BLR', desc: 'Mumbai – Bengaluru', weight: '14.10%', volume: '6.8M PAX', share: 'Commercial Trunk' },
  { route: 'DEL-CCU', desc: 'Delhi – Kolkata', weight: '11.80%', volume: '5.6M PAX', share: 'East Metro Link' },
  { route: 'DEL-HYD', desc: 'Delhi – Hyderabad', weight: '9.60%', volume: '4.6M PAX', share: 'South Metro Link' },
  { route: 'BOM-MAA', desc: 'Mumbai – Chennai', weight: '8.20%', volume: '3.9M PAX', share: 'Coastal Trunk' },
  { route: 'DEL-PNQ', desc: 'Delhi – Pune', weight: '5.20%', volume: '2.5M PAX', share: 'Metro-Tier 2' },
  { route: 'DEL-PAT', desc: 'Delhi – Patna', weight: '4.60%', volume: '2.2M PAX', share: 'Regional Trunk' },
  { route: 'BOM-COK', desc: 'Mumbai – Kochi', weight: '3.80%', volume: '1.8M PAX', share: 'South Regional' },
];

export default function IndexAnalyticsPage() {
  const [jevonsIndices, setJevonsIndices] = useState<NationalAggregateIndex[]>([]);
  const [youngIndices, setYoungIndices] = useState<NationalAggregateIndex[]>([]);
  const [routeIndices, setRouteIndices] = useState<ElementaryRouteIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHorizon, setSelectedHorizon] = useState<string>('T+1');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [jev, yng, rts] = await Promise.all([
        api.getNationalIndices(undefined, undefined, 'JEVONS').catch(() => []),
        api.getNationalIndices(undefined, undefined, 'YOUNG_MODIFIED_LASPEYRES').catch(() => []),
        api.getRouteIndices().catch(() => []),
      ]);
      setJevonsIndices(jev);
      setYoungIndices(yng);
      setRouteIndices(rts);
    } catch (err: any) {
      setError(err.message || 'Failed to load index analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const availableHorizons = useMemo(() => {
    const list = Array.from(new Set(jevonsIndices.map(i => i.booking_horizon))).sort((a, b) => {
      return parseInt(a.replace('T+', '')) - parseInt(b.replace('T+', ''));
    });
    return list.length > 0 ? list : ['T+1', 'T+7', 'T+15', 'T+30', 'T+45'];
  }, [jevonsIndices]);

  // Merge Jevons and Young indices for chart comparison
  const chartData = useMemo(() => {
    const filteredJev = jevonsIndices.filter(i => i.booking_horizon === selectedHorizon);
    const filteredYng = youngIndices.filter(i => i.booking_horizon === selectedHorizon);

    const dates = Array.from(new Set([
      ...filteredJev.map(i => i.calculation_date),
      ...filteredYng.map(i => i.calculation_date)
    ])).sort();

    return dates.map(d => {
      const jMatch = filteredJev.find(i => i.calculation_date === d);
      const yMatch = filteredYng.find(i => i.calculation_date === d);
      return {
        date: d,
        jevons: jMatch ? parseFloat(jMatch.index_value.toString()) : null,
        young: yMatch ? parseFloat(yMatch.index_value.toString()) : null,
      };
    });
  }, [jevonsIndices, youngIndices, selectedHorizon]);

  const latestJevons = jevonsIndices.filter(i => i.booking_horizon === selectedHorizon).pop();
  const latestYoung = youngIndices.filter(i => i.booking_horizon === selectedHorizon).pop();

  return (
    <div className="min-h-[calc(100vh-5rem)] p-6 flex flex-col gap-6 max-w-[1600px] mx-auto w-full fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-xs font-semibold text-muted-silver tracking-[0.2em] uppercase mb-1">Methodological Analytics</h2>
          <h1 className="text-3xl font-bold tracking-tight text-soft-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-electric-cyan" /> Index Aggregation Engine
          </h1>
        </div>

        {/* Horizon Filter Tabs */}
        <div className="flex bg-card border border-border p-1 rounded-lg">
          {availableHorizons.map(h => (
            <button
              key={h}
              onClick={() => setSelectedHorizon(h)}
              className={clsx(
                'px-4 py-1.5 text-xs font-mono rounded-md transition-all',
                selectedHorizon === h
                  ? 'bg-electric-cyan/20 border border-electric-cyan/40 text-electric-cyan font-bold shadow-sm'
                  : 'text-muted-silver hover:text-soft-white'
              )}
            >
              {h}
            </button>
          ))}
        </div>
      </header>

      <StateBoundary loading={loading} error={error} onRetry={loadData} isEmpty={!loading && jevonsIndices.length === 0}>
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 bg-card border border-border rounded-xl">
            <span className="text-[10px] uppercase tracking-widest text-muted-silver block mb-1">Tier 2 Jevons Aggregate</span>
            <span className="text-3xl font-mono text-electric-cyan font-bold">
              {latestJevons ? parseFloat(latestJevons.index_value.toString()).toFixed(2) : '--'}
            </span>
            <span className="text-xs text-muted-silver block mt-1">Geometric Aggregation (T={selectedHorizon})</span>
          </div>

          <div className="p-5 bg-card border border-border rounded-xl">
            <span className="text-[10px] uppercase tracking-widest text-muted-silver block mb-1">Tier 2 Young / Laspeyres</span>
            <span className="text-3xl font-mono text-amber-400 font-bold">
              {latestYoung ? parseFloat(latestYoung.index_value.toString()).toFixed(2) : '--'}
            </span>
            <span className="text-xs text-muted-silver block mt-1">Arithmetic Weighted (T={selectedHorizon})</span>
          </div>

          <div className="p-5 bg-card border border-border rounded-xl">
            <span className="text-[10px] uppercase tracking-widest text-muted-silver block mb-1">Elementary Routes</span>
            <span className="text-3xl font-mono text-soft-white font-bold">
              {latestJevons?.route_count ?? 'NO DATA'}
            </span>
            <span className="text-xs text-muted-silver block mt-1">Active Indian Domestic Corridors</span>
          </div>

          <div className="p-5 bg-card border border-border rounded-xl">
            <span className="text-[10px] uppercase tracking-widest text-muted-silver block mb-1">National Coverage</span>
            <span className="text-3xl font-mono text-emerald-400 font-bold">
              {latestJevons ? `${latestJevons.coverage_pct}%` : 'NO DATA'}
            </span>
            <span className="text-xs text-muted-silver block mt-1">Sample Completeness</span>
          </div>
        </div>

        {/* Index Trajectory Comparison Chart */}
        <div className="p-6 bg-card border border-border rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xs font-semibold text-muted-silver tracking-[0.2em] uppercase">
                Methodological Trajectory Comparison ({selectedHorizon})
              </h3>
              <p className="text-xs text-muted-silver mt-1">
                Jevons Geometric Mean vs Young / Modified Laspeyres DGCA Weighted Formula
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-electric-cyan">
                <span className="w-3 h-0.5 bg-electric-cyan" /> Jevons Geometric Mean
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-3 h-0.5 bg-amber-400" /> Young / Laspeyres Weighted
              </span>
            </div>
          </div>

          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#f8fafc' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="jevons" name="Jevons Index" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 4, fill: '#06b6d4' }} />
                <Line type="monotone" dataKey="young" name="Young Index" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 4, fill: '#f59e0b' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DGCA Traffic Volume Basket Table */}
        <div className="p-6 bg-card border border-border rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-5 h-5 text-electric-cyan" />
            <h3 className="text-xs font-semibold text-muted-silver tracking-[0.2em] uppercase">
              DGCA Passenger Traffic Reference Weights Basket
            </h3>
          </div>

          <div className="mb-4 p-4 rounded-lg bg-surface border border-border flex items-start gap-3">
            <Info className="w-5 h-5 text-electric-cyan flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-silver leading-relaxed">
              <span className="text-soft-white font-bold">ILLUSTRATIVE / DEMO — NOT OFFICIAL:</span> The route basket below mirrors the configured prototype traffic-weight reference. Passenger volume weights are traffic-based engineering weights, not household consumer expenditure shares. External source period and verification are not available in this demo response.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-muted-silver">
                  <th className="pb-3 uppercase">Corridor Code</th>
                  <th className="pb-3 uppercase">Route Description</th>
                  <th className="pb-3 uppercase">DGCA Traffic Weight (w_r)</th>
                  <th className="pb-3 uppercase">Annual Volume</th>
                  <th className="pb-3 uppercase">Corridor Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {DGCA_WEIGHTS_INFO.map((item) => (
                  <tr key={item.route} className="text-soft-white hover:bg-white/5 transition-colors">
                    <td className="py-3 font-bold text-electric-cyan">{item.route}</td>
                    <td className="py-3">{item.desc}</td>
                    <td className="py-3 font-bold">{item.weight}</td>
                    <td className="py-3 text-muted-silver">{item.volume}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-surface border border-border text-muted-silver">
                        {item.share}
                      </span>
                    </td>
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

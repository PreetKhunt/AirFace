'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { NationalAggregateIndex } from '@/types';
import { StateBoundary } from '@/components/StateBoundary';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Clock } from 'lucide-react';
import { clsx } from 'clsx';

export default function BookingHorizonPage() {
  const [indices, setIndices] = useState<NationalAggregateIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHorizon, setSelectedHorizon] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getNationalIndices(); // Gets all horizons
      setIndices(data.filter(i => i.methodology === 'JEVONS'));
    } catch (err: any) {
      setError(err.message || 'Failed to load horizon data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const availableHorizons = useMemo(() => Array.from(new Set(indices.map(i => i.booking_horizon))).sort((a,b) => {
    const na = parseInt(a.replace('T+',''));
    const nb = parseInt(b.replace('T+',''));
    return na - nb;
  }), [indices]);

  useEffect(() => {
    if (availableHorizons.length > 0 && !selectedHorizon) {
      setSelectedHorizon(availableHorizons[0]);
    }
  }, [availableHorizons, selectedHorizon]);

  const latestDateStr = useMemo(() => {
    if (indices.length === 0) return null;
    return indices.map(i => i.calculation_date).sort().pop();
  }, [indices]);

  const chartData = useMemo(() => {
    if (!latestDateStr) return [];
    const latestByHorizon = indices.filter(i => i.calculation_date === latestDateStr);
    
    // Sort reverse for waterfall escalation visual (from far to near)
    const reversedHorizons = [...availableHorizons].reverse();

    return reversedHorizons.map((h, i) => {
      const match = latestByHorizon.find(idx => idx.booking_horizon === h);
      const val = match ? parseFloat(match.index_value) : 0;
      
      // Calculate escalation step (delta from previous further horizon)
      const prevMatch = i > 0 ? latestByHorizon.find(idx => idx.booking_horizon === reversedHorizons[i-1]) : null;
      const prevVal = prevMatch ? parseFloat(prevMatch.index_value) : 0;
      const delta = i === 0 ? val : val - prevVal;
      
      return {
        name: h,
        value: val,
        delta: delta,
        base: prevVal,
        coverage: match ? match.coverage_pct : "0.00",
        observations: 0,
        routes: match ? match.route_count : 0
      };
    }).filter(d => d.value > 0);
  }, [indices, availableHorizons, latestDateStr]);

  const selectedData = useMemo(() => {
    return chartData.find(d => d.name === selectedHorizon) || null;
  }, [chartData, selectedHorizon]);

  return (
    <div className="min-h-[calc(100vh-5rem)] p-6 flex flex-col gap-6 max-w-[1600px] mx-auto w-full fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-xs font-semibold text-muted tracking-[0.2em] uppercase mb-1">Temporal Analysis</h2>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Clock className="w-8 h-8 text-warning" /> Booking Horizon Escalation
          </h1>
        </div>
      </header>

      <StateBoundary loading={loading} error={error} onRetry={loadData} isEmpty={!loading && chartData.length === 0}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Timeline and Details */}
          <div className="lg:col-span-4 flex flex-col items-center bg-card border border-border rounded-xl p-8">
            <h3 className="text-xs font-semibold text-muted tracking-[0.2em] uppercase mb-8">Horizon Selection Timeline</h3>
            
            <div className="flex items-center w-full max-w-4xl relative">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-border -z-10" />
              {availableHorizons.map((h, idx) => (
                <div key={h} className="flex-1 flex justify-center relative">
                  <button
                    onClick={() => setSelectedHorizon(h)}
                    className={clsx(
                      'flex flex-col items-center gap-2 group outline-none',
                    )}
                  >
                    <div className={clsx(
                      'w-4 h-4 rounded-full border-2 transition-all duration-300',
                      selectedHorizon === h 
                        ? 'bg-warning border-warning shadow-[0_0_12px_rgba(245,158,11,0.8)] scale-125' 
                        : 'bg-background border-border group-hover:border-warning/50'
                    )} />
                    <span className={clsx(
                      'text-xs font-mono transition-colors mt-2',
                      selectedHorizon === h ? 'text-warning font-bold' : 'text-muted group-hover:text-white'
                    )}>
                      {h}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1 flex flex-col gap-4">
            {selectedData ? (
              <>
                <div className="bg-card border border-border p-6 rounded-xl flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-widest text-muted">Index Level</span>
                  <span className="text-4xl font-mono text-white font-bold">{selectedData.value.toFixed(2)}</span>
                </div>
                <div className="bg-card border border-border p-6 rounded-xl flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-widest text-muted">Price Escalation (vs previous horizon)</span>
                  <span className={`text-2xl font-mono font-bold ${selectedData.delta >= 0 ? 'text-danger' : 'text-accent'}`}>
                    {selectedData.delta > 0 ? '+' : ''}{selectedData.delta.toFixed(2)}
                  </span>
                </div>
                <div className="bg-card border border-border p-6 rounded-xl flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-widest text-muted">Coverage</span>
                  <span className="text-2xl font-mono text-white">{selectedData.coverage}%</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card border border-border p-5 rounded-xl flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-widest text-muted">Obs</span>
                    <span className="text-xl font-mono text-white">{selectedData.observations}</span>
                  </div>
                  <div className="bg-card border border-border p-5 rounded-xl flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-widest text-muted">Routes</span>
                    <span className="text-xl font-mono text-white">{selectedData.routes}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center border border-dashed border-border rounded-xl text-muted font-mono text-sm p-6 text-center">
                Select a horizon to view detailed metrics.
              </div>
            )}
          </div>

          {/* Chart */}
          <div className="lg:col-span-3 bg-card border border-border rounded-xl p-6 flex flex-col">
            <h3 className="text-xs font-semibold text-muted tracking-[0.2em] uppercase mb-6">Price Escalation Curve</h3>
            <div className="flex-1 w-full h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 30, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: '#18181b', opacity: 0.5}}
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#f8fafc' }}
                    itemStyle={{ color: '#f59e0b', fontWeight: 600, fontFamily: 'monospace' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '12px' }}
                    formatter={(value: any, name: any) => [value.toFixed(2), name === 'value' ? 'Total Index' : name]}
                  />
                  <Bar dataKey="base" stackId="a" fill="transparent" />
                  <Bar dataKey="delta" stackId="a" radius={[4, 4, 4, 4]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.delta > 0 ? '#f59e0b' : '#3b82f6'} fillOpacity={entry.name === selectedHorizon ? 1 : 0.6} />
                    ))}
                    <LabelList dataKey="value" position="top" formatter={(val: any) => val.toFixed(1)} fill="#f8fafc" fontSize={11} fontFamily="monospace" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </StateBoundary>
    </div>
  );
}

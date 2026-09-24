'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { ElementaryRouteIndex } from '@/types';
import { StateBoundary } from '@/components/StateBoundary';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, Map as MapIcon, ArrowRight, AlertCircle, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';

export default function RouteExplorerPage() {
  const [indices, setIndices] = useState<ElementaryRouteIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [selectedHorizon, setSelectedHorizon] = useState<string>('T+1');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getRouteIndices();
      setIndices(data);
      if (data.length > 0 && !selectedRoute) {
        setSelectedRoute(data[0].route_id);
        setSelectedHorizon(data[0].booking_horizon);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load route indices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const uniqueRoutes = useMemo(() => Array.from(new Set(indices.map(i => i.route_id))).sort(), [indices]);
  const availableHorizons = useMemo(() => Array.from(new Set(indices.map(i => i.booking_horizon))).sort(), [indices]);

  const availableHorizonsForRoute = useMemo(() => {
    if (!selectedRoute) return [];
    return Array.from(new Set(indices.filter(i => i.route_id === selectedRoute).map(i => i.booking_horizon))).sort();
  }, [indices, selectedRoute]);

  const filteredRoutes = useMemo(() => 
    uniqueRoutes.filter(r => r.toLowerCase().includes(searchQuery.toLowerCase())),
  [uniqueRoutes, searchQuery]);

  const selectedRouteData = useMemo(() => {
    if (!selectedRoute) return [];
    return indices
      .filter(i => i.route_id === selectedRoute && i.booking_horizon === selectedHorizon)
      .map(idx => ({
        date: idx.calculation_date,
        value: parseFloat(idx.index_value),
        observations: idx.observation_count,
        coverage: idx.coverage_pct,
        methodology: idx.methodology,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [indices, selectedRoute, selectedHorizon]);

  const latestPoint = selectedRouteData.length > 0 ? selectedRouteData[selectedRouteData.length - 1] : null;

  return (
    <div className="min-h-[calc(100vh-5rem)] p-6 flex flex-col gap-6 max-w-[1600px] mx-auto w-full fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-xs font-semibold text-muted-silver tracking-[0.2em] uppercase mb-1">Aviation Analytics</h2>
          <h1 className="text-3xl font-bold tracking-tight text-soft-white flex items-center gap-3">
            <MapIcon className="w-8 h-8 text-atmospheric-blue" /> Route Intelligence
          </h1>
        </div>
        
        {/* Pill Segmented Controls */}
        <div className="flex bg-card border border-border p-1 rounded-lg">
          {availableHorizons.map(h => (
            <button
              key={h}
              onClick={() => setSelectedHorizon(h)}
              className={clsx(
                'px-4 py-1.5 text-xs font-mono rounded-md transition-all',
                selectedHorizon === h 
                  ? 'bg-blue text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]' 
                  : 'text-muted hover:text-white'
              )}
            >
              {h}
            </button>
          ))}
        </div>
      </header>

      <StateBoundary loading={loading} error={error} onRetry={loadData} isEmpty={!loading && indices.length === 0}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
          
          {/* Route List Sidebar */}
          <div className="lg:col-span-1 bg-card border border-border rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border bg-surface">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
                <input
                  type="text"
                  placeholder="Search routes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-muted focus:outline-none focus:border-blue transition-colors"
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1 scrollbar-hide">
              {filteredRoutes.map(route => {
                const parts = route.split('-');
                return (
                  <button
                    key={route}
                    onClick={() => {
                      setSelectedRoute(route);
                      // Auto-switch to a valid horizon for this route if current has no data
                      const horizons = Array.from(new Set(indices.filter(i => i.route_id === route).map(i => i.booking_horizon))).sort();
                      if (horizons.length > 0 && !horizons.includes(selectedHorizon)) {
                        setSelectedHorizon(horizons[0]);
                      }
                    }}
                    className={clsx(
                      'w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all',
                      selectedRoute === route 
                        ? 'bg-blue/10 border border-blue/30 text-white shadow-[inset_4px_0_0_rgba(59,130,246,1)]' 
                        : 'text-muted border border-transparent hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-2 font-mono">
                      <span>{parts[0]}</span>
                      <ArrowRight className="w-3 h-3 text-muted" />
                      <span>{parts[1] || ''}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chart Area */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {latestPoint ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-5 bg-card border border-border rounded-xl">
                    <p className="text-[10px] uppercase tracking-widest text-muted mb-1">Current Index</p>
                    <p className="text-3xl font-mono text-white">{latestPoint.value.toFixed(2)}</p>
                  </div>
                  <div className="p-5 bg-card border border-border rounded-xl">
                    <p className="text-[10px] uppercase tracking-widest text-muted mb-1">Observations</p>
                    <p className="text-3xl font-mono text-white">{latestPoint.observations}</p>
                  </div>
                  <div className="p-5 bg-card border border-border rounded-xl">
                    <p className="text-[10px] uppercase tracking-widest text-muted mb-1">Methodology</p>
                    <p className="text-xl mt-1 font-mono text-blue">{latestPoint.methodology}</p>
                  </div>
                </div>

                <div className="flex-1 bg-card border border-border rounded-xl p-6 relative overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={selectedRouteData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="routeColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#f8fafc' }}
                        itemStyle={{ color: '#3b82f6', fontWeight: 600, fontFamily: 'monospace' }}
                        labelStyle={{ color: '#94a3b8', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#routeColor)" activeDot={{ r: 6, fill: '#3b82f6', stroke: '#18181b', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-border rounded-xl bg-card p-8 gap-4">
                <AlertCircle className="w-12 h-12 text-warning opacity-50" />
                <div className="text-center">
                  <p className="text-lg text-white font-mono mb-1">NO INDEX DATA</p>
                  <p className="text-sm text-muted">
                    {selectedRoute} at horizon {selectedHorizon} has no computed index observations.
                  </p>
                </div>
                {availableHorizonsForRoute.length > 0 && (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-muted">Available Horizons</span>
                    <div className="flex gap-2">
                      {availableHorizonsForRoute.map(hz => (
                        <button
                          key={hz}
                          onClick={() => setSelectedHorizon(hz)}
                          className="px-3 py-1 bg-surface border border-blue/40 rounded text-xs text-blue hover:bg-blue/10 transition-colors"
                        >
                          Switch to {hz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </StateBoundary>
    </div>
  );
}

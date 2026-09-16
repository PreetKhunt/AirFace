'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { ElementaryRouteIndex } from '@/types';
import { StateBoundary } from '@/components/StateBoundary';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RouteExplorerPage() {
  const [indices, setIndices] = useState<ElementaryRouteIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getRouteIndices();
      setIndices(data);
      if (data.length > 0 && !selectedRoute) {
        setSelectedRoute(data[0].route_id);
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

  const uniqueRoutes = useMemo(() => Array.from(new Set(indices.map(i => i.route_id))), [indices]);
  
  const selectedRouteData = useMemo(() => {
    if (!selectedRoute) return [];
    // Just looking at T+1 or a specific methodology to not overplot if multiple horizons exist
    return indices
      .filter(i => i.route_id === selectedRoute && i.booking_horizon === 'T+1' && i.methodology === 'JEVONS')
      .map(idx => ({
        date: idx.calculation_date,
        value: parseFloat(idx.index_value),
        observations: idx.observation_count,
        coverage: idx.coverage_pct
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [indices, selectedRoute]);

  return (
    <div className="min-h-screen p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <header className="p-6 bg-card border border-border rounded-xl shadow-sm">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
          Route Explorer
        </h1>
        <p className="text-sm text-gray-400">Examine elementary index values at the route level.</p>
      </header>

      <StateBoundary loading={loading} error={error} onRetry={loadData} isEmpty={!loading && indices.length === 0}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Route List */}
          <div className="lg:col-span-1 bg-card border border-border rounded-xl overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b border-border bg-card/50">
              <h3 className="font-semibold text-white">Top Routes</h3>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {uniqueRoutes.map(route => (
                <button
                  key={route}
                  onClick={() => setSelectedRoute(route)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedRoute === route ? 'bg-accent/10 text-accent border border-accent/20' : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {route}
                </button>
              ))}
            </div>
          </div>

          {/* Details & Chart */}
          <div className="lg:col-span-3 space-y-6">
            {selectedRouteData.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 bg-card border border-border rounded-xl">
                    <p className="text-sm font-medium text-gray-400">Current Index (T+1)</p>
                    <p className="text-2xl font-bold text-white mt-1">{selectedRouteData[selectedRouteData.length - 1].value.toFixed(2)}</p>
                  </div>
                  <div className="p-5 bg-card border border-border rounded-xl">
                    <p className="text-sm font-medium text-gray-400">Observation Count</p>
                    <p className="text-2xl font-bold text-white mt-1">{selectedRouteData[selectedRouteData.length - 1].observations}</p>
                  </div>
                  <div className="p-5 bg-card border border-border rounded-xl">
                    <p className="text-sm font-medium text-gray-400">Methodology</p>
                    <p className="text-xl font-bold text-white mt-1">JEVONS</p>
                  </div>
                </div>

                <div className="p-6 bg-card border border-border rounded-xl">
                  <h3 className="text-lg font-bold text-white mb-6">Index History — {selectedRoute}</h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedRouteData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis domain={['auto', 'auto']} stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                          labelStyle={{ color: '#888' }}
                        />
                        <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#1a1a1a', strokeWidth: 2 }} activeDot={{ r: 6 }} name="Index Value" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-gray-500 border border-dashed border-border rounded-xl h-full flex items-center justify-center">
                No T+1 Jevons data available for {selectedRoute}.
              </div>
            )}
          </div>
        </div>
      </StateBoundary>
    </div>
  );
}

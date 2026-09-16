'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { NationalAggregateIndex } from '@/types';
import { StateBoundary } from '@/components/StateBoundary';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function BookingHorizonPage() {
  const [indices, setIndices] = useState<NationalAggregateIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const chartData = useMemo(() => {
    if (indices.length === 0) return [];
    
    // Get the most recent calculation date
    const latestDateStr = indices.map(i => i.calculation_date).sort().pop();
    if (!latestDateStr) return [];
    
    // Group by horizon for the latest date
    const latestByHorizon = indices.filter(i => i.calculation_date === latestDateStr);
    
    const horizons = ['T+1', 'T+7', 'T+15', 'T+30', 'T+45'];
    
    return horizons.map(h => {
      const match = latestByHorizon.find(i => i.booking_horizon === h);
      return {
        name: h,
        value: match ? parseFloat(match.index_value) : 0,
        coverage: match ? match.coverage_pct : "0.00"
      };
    }).filter(d => d.value > 0);
  }, [indices]);

  return (
    <div className="min-h-screen p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <header className="p-6 bg-card border border-border rounded-xl shadow-sm">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
          Booking Horizon Analysis
        </h1>
        <p className="text-sm text-gray-400">Examine how airfare indices change according to advance booking lead-times.</p>
      </header>

      <StateBoundary loading={loading} error={error} onRetry={loadData} isEmpty={!loading && chartData.length === 0}>
        <div className="grid grid-cols-1 gap-6">
          <div className="p-6 bg-card border border-border rounded-xl">
            <h3 className="text-lg font-bold text-white mb-6">Current National Index by Booking Horizon</h3>
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={['auto', 'auto']} stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: '#333', opacity: 0.2}}
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="value" name="Index Value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-500 mt-6 text-center">
              Note: T+1 represents bookings made 1 day before departure, illustrating typical last-minute price escalation curves.
            </p>
          </div>
        </div>
      </StateBoundary>
    </div>
  );
}

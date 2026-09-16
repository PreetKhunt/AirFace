'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { DataQualityLog } from '@/types';
import { StateBoundary } from '@/components/StateBoundary';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldCheck } from 'lucide-react';

export default function DataQualityPage() {
  const [history, setHistory] = useState<DataQualityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getQualityHistory();
      setHistory(data.sort((a, b) => new Date(a.calculation_date).getTime() - new Date(b.calculation_date).getTime()));
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
      score: parseFloat(h.composite_score)
    }));
  }, [history]);

  return (
    <div className="min-h-screen p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <header className="p-6 bg-card border border-border rounded-xl shadow-sm">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
          Data Quality Scorecard
        </h1>
        <p className="text-sm text-gray-400">8-factor deterministic quality scoring across the pipeline.</p>
      </header>

      <StateBoundary loading={loading} error={error} onRetry={loadData} isEmpty={!loading && history.length === 0}>
        
        {latest && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="md:col-span-1 bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center">
              <ShieldCheck className="w-16 h-16 text-emerald-400 mb-4" />
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Composite Score</h2>
              <div className="text-5xl font-bold text-white mb-2">{latest.composite_score}</div>
              <p className="text-xs text-emerald-400 font-medium">EXCELLENT STATUS</p>
            </div>
            
            <div className="md:col-span-2 bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-bold text-white mb-4 uppercase">8-Factor Breakdown</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Completeness', val: latest.completeness_score },
                  { label: 'Validity', val: latest.validity_score },
                  { label: 'Consistency', val: latest.consistency_score },
                  { label: 'Timeliness', val: latest.timeliness_score },
                  { label: 'Source Reliability', val: latest.source_reliability_score },
                  { label: 'Dedup Integrity', val: latest.dedup_integrity_score },
                  { label: 'Outlier Cleanliness', val: latest.outlier_cleanliness_score },
                  { label: 'Availability', val: latest.availability_coverage_score },
                ].map((item, idx) => (
                  <div key={idx} className="bg-card/50 border border-border rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1 truncate">{item.label}</p>
                    <p className="text-lg font-bold text-white">{item.val}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="p-6 bg-card border border-border rounded-xl">
          <h3 className="text-lg font-bold text-white mb-6">Composite Score History</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#888' }}
                />
                <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#1a1a1a', strokeWidth: 2 }} activeDot={{ r: 6 }} name="Composite Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </StateBoundary>
    </div>
  );
}

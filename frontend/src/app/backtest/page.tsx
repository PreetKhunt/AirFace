'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { BacktestRun } from '@/types';
import { StateBoundary } from '@/components/StateBoundary';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function BacktestPage() {
  const [runs, setRuns] = useState<BacktestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getBacktestResults();
      setRuns(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (err: any) {
      setError(err.message || 'Failed to load backtest results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const latestRun = runs.length > 0 ? runs[0] : null;

  return (
    <div className="min-h-screen p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <header className="p-6 bg-card border border-border rounded-xl shadow-sm">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
          30-DAY BACKTEST & VALIDATION
        </h1>
        <p className="text-sm text-gray-400">Strict temporal-aligned benchmark validation of the calculated index.</p>
      </header>

      <StateBoundary loading={loading} error={error} onRetry={loadData} isEmpty={!loading && runs.length === 0} emptyMessage="No backtest runs found.">
        
        {latestRun && (
          <div className="space-y-6">
            
            <div className="flex flex-col md:flex-row gap-4 p-4 bg-card border border-border rounded-xl">
              <div className="flex-1">
                <span className="text-xs text-gray-400 block mb-1">Reference Source</span>
                <span className="text-sm font-bold text-white">{latestRun.reference_source}</span>
              </div>
              <div className="flex-1">
                <span className="text-xs text-gray-400 block mb-1">Data Mode</span>
                <span className="text-sm font-bold text-accent">{latestRun.data_mode}</span>
              </div>
              <div className="flex-1">
                <span className="text-xs text-gray-400 block mb-1">Methodology</span>
                <span className="text-sm font-bold text-white">{latestRun.methodology}</span>
              </div>
              <div className="flex-1">
                <span className="text-xs text-gray-400 block mb-1">Period</span>
                <span className="text-sm font-bold text-white">{latestRun.start_date} to {latestRun.end_date}</span>
              </div>
            </div>

            {latestRun.status === 'INSUFFICIENT_DATA' ? (
              <div className="p-12 bg-card border border-border rounded-xl text-center space-y-4">
                <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
                <h2 className="text-xl font-bold text-white">REFERENCE DATA UNAVAILABLE</h2>
                <p className="text-gray-400 text-sm max-w-md mx-auto">
                  Insufficient matching observations found between the scraped index ({latestRun.match_count}) and the reference baseline ({latestRun.sample_count}). Valid correlation requires a strict overlap without manufacturing artificial data.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <MetricCard title="MAPE" value={`${latestRun.mape}%`} />
                <MetricCard title="RMSE" value={latestRun.rmse || 'N/A'} />
                <MetricCard title="Pearson r" value={latestRun.pearson_r || 'N/A'} />
                <MetricCard title="Mean Bias" value={`${latestRun.mean_bias_pct}%`} />
                <MetricCard title="Directional Accuracy" value={`${latestRun.directional_accuracy}%`} />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 p-6 bg-card border border-border rounded-xl space-y-4">
                <h3 className="font-bold text-white mb-4">Coverage & Matching</h3>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Target Samples</span>
                  <span className="font-bold text-white">{latestRun.sample_count}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Matched Pairs</span>
                  <span className="font-bold text-emerald-400">{latestRun.match_count}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Unmatched Reference</span>
                  <span className="font-bold text-amber-400">{latestRun.sample_count - latestRun.match_count}</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-accent" style={{ width: `${latestRun.coverage_pct}%` }}></div>
                </div>
                <p className="text-xs text-right text-gray-500">{latestRun.coverage_pct}% Matching Rate</p>
              </div>
              
              <div className="md:col-span-2 p-6 bg-card border border-border rounded-xl flex items-center justify-center text-center">
                <div>
                  <h3 className="font-bold text-gray-500 mb-2">Visualizer Interface</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    The backend returns the exact validation metrics above. Rendering the full time-series comparison chart requires the exact daily reference vectors which are not currently attached to the `/api/v1/backtest/results` list endpoint response schema. 
                  </p>
                  <p className="text-xs text-accent">
                    The math engine evaluates RMSE/MAPE securely in Python without exposing raw reference vectors to the browser.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}
      </StateBoundary>
    </div>
  );
}

function MetricCard({ title, value }: { title: string, value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 text-center">
      <p className="text-xs font-medium text-gray-400 mb-2">{title}</p>
      <p className="text-xl lg:text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

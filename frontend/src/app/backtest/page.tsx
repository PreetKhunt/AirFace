'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { BacktestRun } from '@/types';
import { StateBoundary } from '@/components/StateBoundary';
import { AlertTriangle, CheckCircle2, LineChart as ChartIcon, Info } from 'lucide-react';

const REFERENCE_DISCLOSURE =
  'Official first-party historical DGCA/MoSPI airfare micro-data is not available as a verified reference series for this prototype. External validation status is REFERENCE_UNAVAILABLE. The displayed metrics evaluate the pipeline against the version-controlled DEMO SYNTHETIC BENCHMARK and are not official benchmark accuracy.';

function isReferenceValidationComplete(status: string): boolean {
  return status === 'VALIDATED' || status === 'REFERENCE_VALIDATED';
}

function referenceValidationLabel(status: string): string {
  if (isReferenceValidationComplete(status)) return 'DEMO SYNTHETIC BENCHMARK';
  if (status === 'INSUFFICIENT_DATA') return 'Insufficient Reference Overlap';
  return status.replace(/_/g, ' ');
}

export default function BacktestPage() {
  const [runs, setRuns] = useState<BacktestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const latestRun = runs.length > 0 ? runs[0] : null;
  const validationComplete = latestRun ? isReferenceValidationComplete(latestRun.status) : false;

  return (
    <div className="min-h-[calc(100vh-5rem)] p-6 flex flex-col gap-6 max-w-[1600px] mx-auto w-full fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-xs font-semibold text-muted-silver tracking-[0.2em] uppercase mb-1">Index Validation</h2>
          <h1 className="text-3xl font-bold tracking-tight text-soft-white flex items-center gap-3">
            <ChartIcon className="w-8 h-8 text-accent" /> Prototype Reference Validation
          </h1>
        </div>
      </header>

      <StateBoundary loading={loading} error={error} onRetry={loadData} isEmpty={!loading && runs.length === 0} emptyMessage="No backtest runs found.">
        
        {latestRun && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Meta Info */}
            <div className="lg:col-span-3 flex flex-col md:flex-row gap-4 p-4 bg-card border border-border rounded-xl">
              <div className="flex-1 border-r border-border pr-4">
                <span className="text-[10px] uppercase tracking-widest text-muted block mb-1">Reference Source</span>
                <span className="text-sm font-mono text-white">{latestRun.reference_source}</span>
              </div>
              <div className="flex-1 border-r border-border px-4">
                <span className="text-[10px] uppercase tracking-widest text-muted block mb-1">Reference Type</span>
                <span className="text-sm font-mono text-accent">DEMO SYNTHETIC BENCHMARK</span>
              </div>
              <div className="flex-1 border-r border-border px-4">
                <span className="text-[10px] uppercase tracking-widest text-muted block mb-1">Data Mode</span>
                <span className="text-sm font-mono text-white">{latestRun.data_mode}</span>
              </div>
              <div className="flex-1 border-r border-border px-4">
                <span className="text-[10px] uppercase tracking-widest text-muted block mb-1">Methodology</span>
                <span className="text-sm font-mono text-white">{latestRun.methodology}</span>
              </div>
              <div className="flex-1 border-r border-border px-4">
                <span className="text-[10px] uppercase tracking-widest text-muted block mb-1">Observation Window</span>
                <span className="text-sm font-mono text-white">{latestRun.start_date} &rarr; {latestRun.end_date}</span>
              </div>
              <div className="flex-1 pl-4">
                <span className="text-[10px] uppercase tracking-widest text-muted block mb-1">Matched</span>
                <span className="text-sm font-mono text-accent">{latestRun.match_count} / {latestRun.sample_count}</span>
              </div>
            </div>

            {/* Disclosure */}
            <div className="lg:col-span-3 border-l-2 border-warning bg-warning/5 px-5 py-4">
              <div className="text-xs font-bold tracking-[0.2em] text-warning uppercase mb-2">Validation Provenance Disclosure</div>
              <p className="text-sm text-muted leading-relaxed">{REFERENCE_DISCLOSURE}</p>
            </div>

            {/* Content Based on Status */}
            {!validationComplete ? (
              <div className="lg:col-span-3 h-[400px] bg-card border border-border rounded-xl flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-warning" />
                <AlertTriangle className="w-16 h-16 text-warning mb-6" />
                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">DATA COVERAGE INCOMPLETE</h2>
                <p className="text-muted text-sm max-w-xl font-mono leading-relaxed">
                  The backtest found {latestRun.match_count} matching observations out of {latestRun.sample_count}. Metrics remain unavailable until the backend has enough valid temporal overlap.
                </p>
                <div className="mt-8 px-4 py-2 bg-warning/10 border border-warning/20 text-warning text-xs font-bold tracking-widest uppercase rounded">
                  Status: {referenceValidationLabel(latestRun.status)}
                </div>
              </div>
            ) : (
              <>
                <div className="lg:col-span-3 border-l-2 border-accent bg-accent/5 px-5 py-4">
                  <div className="text-xs font-bold tracking-[0.2em] text-accent uppercase">Validation Against Version-Controlled Reference Series</div>
                  <p className="text-sm text-muted mt-2">
                    Metrics below evaluate pipeline fidelity against the configured prototype reference baseline — not official DGCA historical airfare micro-data.
                  </p>
                </div>
                <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-5 gap-4">
                  <MetricCard title="MAPE" value={latestRun.mape ? `${latestRun.mape}%` : '--'} desc="Mean Absolute Pct Error" status={latestRun.mape ? (parseFloat(latestRun.mape) < 15 ? 'good' : 'warn') : 'warn'} />
                  <MetricCard title="RMSE" value={latestRun.rmse || '--'} desc="Root Mean Square Error" />
                  <MetricCard title="Pearson r" value={latestRun.pearson_r || '--'} desc="Linear Correlation" status={latestRun.pearson_r ? (parseFloat(latestRun.pearson_r) > 0.8 ? 'good' : 'warn') : 'warn'} />
                  <MetricCard title="Mean Bias" value={latestRun.mean_bias_pct ? `${latestRun.mean_bias_pct}%` : '--'} desc="Directional Bias" />
                  <MetricCard title="Directional Accuracy" value={latestRun.directional_accuracy ? `${latestRun.directional_accuracy}%` : '--'} desc="Trend match" status={latestRun.directional_accuracy ? (parseFloat(latestRun.directional_accuracy) > 80 ? 'good' : 'warn') : 'warn'} />
                </div>

                <div className="lg:col-span-1 p-6 bg-card border border-border rounded-xl flex flex-col gap-6">
                  <h3 className="text-xs font-semibold text-muted tracking-[0.2em] uppercase">Coverage & Matching</h3>
                  
                  <div className="space-y-4 font-mono text-sm">
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted">Target Samples</span>
                      <span className="text-white">{latestRun.sample_count}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted">Matched Pairs</span>
                      <span className="text-accent">{latestRun.match_count}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted">Unmatched</span>
                      <span className="text-warning">{latestRun.sample_count - latestRun.match_count}</span>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] uppercase tracking-widest text-muted">Matching Rate</span>
                      <span className="font-mono text-accent">{latestRun.coverage_pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${latestRun.coverage_pct}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 p-6 bg-surface border border-border rounded-xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
                  
                  <Info className="w-10 h-10 text-accent mb-4 opacity-80" />
                  <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-widest">Secure Evaluation Engine</h3>
                  <p className="text-muted text-sm max-w-lg mb-6 leading-relaxed">
                    Validation metrics (MAPE, RMSE, Pearson r, mean bias, and directional accuracy) are calculated by the backend from persisted index observations and the configured synthetic reference series.
                  </p>
                  
                  <div className="px-4 py-2 border border-accent/30 bg-accent/10 rounded-lg text-accent text-xs font-mono font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> {referenceValidationLabel(latestRun.status).toUpperCase()}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </StateBoundary>
    </div>
  );
}

function MetricCard({ title, value, desc, status }: { title: string, value: string, desc: string, status?: 'good'|'warn'|'bad' }) {
  let color = 'text-white';
  if (status === 'good') color = 'text-accent';
  if (status === 'warn') color = 'text-warning';
  if (status === 'bad') color = 'text-danger';

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col group hover:border-border/80 transition-colors">
      <h3 className="text-[10px] uppercase tracking-widest text-muted mb-4">{title}</h3>
      <div className={`text-3xl font-mono font-bold mb-1 ${color}`}>{value}</div>
      <div className="text-[10px] uppercase text-muted tracking-wide">{desc}</div>
    </div>
  );
}

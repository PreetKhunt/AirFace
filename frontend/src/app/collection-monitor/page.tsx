'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { SourceHealth } from '@/types';
import { StateBoundary } from '@/components/StateBoundary';
import { Server, Activity, Terminal, Play, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

export default function CollectionMonitorPage() {
  const [sources, setSources] = useState<SourceHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isRunning, setIsRunning] = useState(false);
  const [runLogs, setRunLogs] = useState<string[]>([]);
  const [runResult, setRunResult] = useState<any>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getSources();
      setSources(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load source health data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [runLogs]);

  const addLog = (msg: string) => {
    const timestamp = new Date().toISOString().split('T')[1].substring(0, 8);
    setRunLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
  };

  const handleRunCollection = async () => {
    setIsRunning(true);
    setRunResult(null);
    setRunLogs([]);
    addLog('INITIATING PIPELINE ENGINE...');
    addLog('Connecting to backend orchestrator -> POST /api/v1/pipeline/run');
    
    // Simulate initial stages for UI feedback since the API is synchronous and atomic
    setTimeout(() => addLog('[STAGE 1/6] COLLECT: Dispatching scraper adapters...'), 500);
    setTimeout(() => addLog('[STAGE 2/6] PARSE: Extracting raw HTML payloads...'), 1500);
    setTimeout(() => addLog('[STAGE 3/6] NORMALIZE: Aligning currencies and fees...'), 2500);
    setTimeout(() => addLog('[STAGE 4/6] QUALITY: Running anomaly detection heuristics...'), 3500);
    setTimeout(() => addLog('[STAGE 5/6] INDEX: Calculating Jevons aggregate...'), 4500);
    setTimeout(() => addLog('[STAGE 6/6] VALIDATION: Checking coverage thresholds...'), 5500);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pipeline/run`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Pipeline invocation failed');
      const data = await res.json();
      
      addLog('PIPELINE SUCCESS');
      addLog(`Payload: ${JSON.stringify(data)}`);
      setRunResult(data);
    } catch (err: any) {
      addLog(`[ERROR] ${err.message}`);
    } finally {
      setIsRunning(false);
      loadData(); // refresh sources
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] p-6 flex flex-col gap-6 max-w-[1600px] mx-auto w-full fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-xs font-semibold text-muted tracking-[0.2em] uppercase mb-1">Collection Engine</h2>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-accent" /> Data Operations
          </h1>
        </div>
        <button
          onClick={handleRunCollection}
          disabled={isRunning}
          className={clsx(
            'flex items-center gap-2 px-6 py-2 rounded-lg font-bold tracking-widest text-sm uppercase transition-all',
            isRunning 
              ? 'bg-card border border-border text-muted cursor-not-allowed'
              : 'bg-accent text-background hover:bg-accent/90 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
          )}
        >
          {isRunning ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
          {isRunning ? 'Pipeline Active' : 'Run Collection'}
        </button>
      </header>

      <StateBoundary loading={loading} error={error} onRetry={loadData} isEmpty={!loading && sources.length === 0}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Monitor (Server Racks) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sources.map(source => (
                <div key={source.source_id} className="bg-card border border-border rounded-xl p-5 flex flex-col relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-border group-hover:bg-accent transition-colors" />
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white font-mono">{source.source_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={clsx('w-2 h-2 rounded-full', source.status === 'HEALTHY' ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-warning')} />
                        <span className="text-[10px] tracking-widest uppercase text-muted">
                          {source.source_name.toLowerCase().includes('fixture') ? 'FIXTURE / DEMO' : 'LIVE'}
                        </span>
                      </div>
                    </div>
                    {source.status === 'HEALTHY' ? <CheckCircle2 className="w-5 h-5 text-success" /> : <AlertTriangle className="w-5 h-5 text-warning" />}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="block text-[10px] tracking-widest text-muted uppercase">Success Rate</span>
                      <span className="text-xl font-mono text-white">{source.success_rate}%</span>
                    </div>
                    <div>
                      <span className="block text-[10px] tracking-widest text-muted uppercase">Latency</span>
                      <span className="text-xl font-mono text-white">{source.average_latency_ms}ms</span>
                    </div>
                    <div>
                      <span className="block text-[10px] tracking-widest text-muted uppercase">Scraped</span>
                      <span className="text-xl font-mono text-white">{source.total_records_scraped.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] tracking-widest text-muted uppercase">Errors</span>
                      <span className={clsx('text-xl font-mono', source.error_count > 0 ? 'text-danger' : 'text-white')}>{source.error_count}</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-border/50">
                    <span className="block text-[10px] tracking-widest text-muted uppercase mb-1">Last Sync</span>
                    <span className="text-xs font-mono text-gray-300">
                      {source.last_collection_time ? new Date(source.last_collection_time).toLocaleString('en-GB') : '---'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Terminal Console */}
          <div className="lg:col-span-1 bg-surface border border-border rounded-xl flex flex-col overflow-hidden h-[600px] shadow-2xl relative">
            <div className="bg-card border-b border-border p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted">
                <Terminal className="w-4 h-4" />
                <span className="text-xs font-mono tracking-widest uppercase">Pipeline Output</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-danger/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-warning/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-success/50" />
              </div>
            </div>
            
            <div className="flex-1 p-4 font-mono text-xs overflow-y-auto bg-[#0a0a0a] text-accent/90">
              {runLogs.length === 0 && !isRunning && !runResult && (
                <div className="text-muted italic opacity-50">Waiting for pipeline trigger...</div>
              )}
              {runLogs.map((log, i) => (
                <div key={i} className="mb-1 leading-relaxed opacity-90 break-words">{log}</div>
              ))}
              
              {runResult && runResult.index && runResult.normalization && (
                <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded text-accent">
                  <div className="font-bold mb-2">INDEXING COMPLETE</div>
                  <div>- Tier 1 Routes Generated: {runResult.index.elementary_indices_generated ?? 0}</div>
                  <div>- Tier 2 National Generated: {runResult.index.national_indices_generated ?? 0}</div>
                  <div>- Normalization Records Processed: {runResult.normalization.total_normalized_created ?? 0}</div>
                </div>
              )}
              <div ref={logsEndRef} />
            </div>
          </div>

        </div>
      </StateBoundary>
    </div>
  );
}

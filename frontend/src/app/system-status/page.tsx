'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { SystemStatusResponse, HealthResponse, SourceHealth } from '@/types';
import { StateBoundary } from '@/components/StateBoundary';
import { Cpu, Database, Server, Radio, Activity, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Zap } from 'lucide-react';
import { clsx } from 'clsx';

export default function SystemStatusPage() {
  const [sysStatus, setSysStatus] = useState<SystemStatusResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [sources, setSources] = useState<SourceHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<string>('');

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [sys, h, srcs] = await Promise.all([
        api.getSystemStatus().catch((e) => {
          console.warn('System status check degraded:', e);
          return null;
        }),
        api.getHealth().catch((e) => {
          console.warn('Health check failed:', e);
          return null;
        }),
        api.getSources().catch(() => []),
      ]);

      setSysStatus(sys);
      setHealth(h);
      setSources(srcs);
      setLastCheck(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(err.message || 'Failed to check system health');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const isBackendHealthy = !!health && health.status === 'ok';
  const isDbHealthy = !!sysStatus && sysStatus.database_connected;
  const isRedisHealthy = !!sysStatus && sysStatus.redis_connected;
  const activeMode = sysStatus?.data_mode || 'HISTORICAL';

  const services = [
    {
      name: 'Frontend Application',
      category: 'Client Interface',
      status: 'HEALTHY' as const,
      detail: 'Next.js App Router (SSR & Client Hydration)',
      icon: Radio,
    },
    {
      name: 'Backend API Service',
      category: 'FastAPI Gateway',
      status: isBackendHealthy ? ('HEALTHY' as const) : ('OFFLINE' as const),
      detail: `FastAPI ${health?.version || '1.0.0'} (${health?.service || 'airfare-index-api'})`,
      icon: Server,
    },
    {
      name: 'Relational Database',
      category: 'Time-Series & Relational Store',
      status: isDbHealthy ? ('HEALTHY' as const) : ('DEGRADED' as const),
      detail: isDbHealthy ? 'Connected (SQLAlchemy Session Pool active)' : 'Database connection unavailable',
      icon: Database,
    },
    {
      name: 'Redis Cache & Broker',
      category: 'In-Memory Message Broker',
      status: isRedisHealthy ? ('HEALTHY' as const) : ('NOT CONFIGURED' as const),
      detail: isRedisHealthy ? 'Redis Broker online' : 'Optional broker offline (synchronous execution mode)',
      icon: Zap,
    },
    {
      name: 'Index Engine Subsystem',
      category: 'Statistical Calculation Tier',
      status: isDbHealthy ? ('HEALTHY' as const) : ('DEGRADED' as const),
      detail: 'Tier 1 Jevons Elementary & Tier 2 DGCA Young Aggregation',
      icon: Activity,
    },
    {
      name: 'Scraper Adapter Subsystem',
      category: 'Data Acquisition Tier',
      status: sources.length > 0 ? ('HEALTHY' as const) : ('DEGRADED' as const),
      detail: `${sources.length} adapters active (Historical, Synthetic, Indigo)`,
      icon: Cpu,
    },
  ];

  const overallStatus = isBackendHealthy && isDbHealthy ? 'OPERATIONAL' : isBackendHealthy ? 'DEGRADED' : 'OFFLINE';

  return (
    <div className="min-h-[calc(100vh-5rem)] p-6 flex flex-col gap-6 max-w-[1600px] mx-auto w-full fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-xs font-semibold text-muted-silver tracking-[0.2em] uppercase mb-1">Infrastructure Telemetry</h2>
          <h1 className="text-3xl font-bold tracking-tight text-soft-white flex items-center gap-3">
            <Cpu className="w-8 h-8 text-electric-cyan" /> System Status & Health
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-muted-silver">
            Last checked: {lastCheck || 'Just now'}
          </div>
          <button
            onClick={() => loadStatus()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-xs font-mono text-soft-white hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', loading && 'animate-spin')} />
            Refresh Telemetry
          </button>
        </div>
      </header>

      <StateBoundary loading={loading} error={error} onRetry={loadStatus}>
        {/* Top Status Banner */}
        <div className={clsx(
          'p-6 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4',
          overallStatus === 'OPERATIONAL' 
            ? 'bg-emerald-500/10 border-emerald-500/30' 
            : overallStatus === 'DEGRADED'
            ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-danger/10 border-danger/30'
        )}>
          <div className="flex items-center gap-4">
            <div className={clsx(
              'w-12 h-12 rounded-full flex items-center justify-center',
              overallStatus === 'OPERATIONAL' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            )}>
              {overallStatus === 'OPERATIONAL' ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-soft-white">
                AIRFACE Core Systems: {overallStatus}
              </h3>
              <p className="text-xs text-muted-silver">
                Active Operational Mode: <span className="font-mono text-soft-white font-bold">{activeMode}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-3 py-1.5 rounded-lg bg-surface border border-border font-mono text-xs text-muted-silver">
              Version: <span className="text-soft-white">{health?.version || '1.0.0'}</span>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((svc) => {
            const Icon = svc.icon;
            const isOk = svc.status === 'HEALTHY';
            const isWarn = svc.status === 'DEGRADED' || svc.status === 'NOT CONFIGURED';
            return (
              <div key={svc.name} className="p-6 bg-card border border-border rounded-xl flex flex-col justify-between relative group hover:border-white/20 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center text-electric-cyan">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-soft-white">{svc.name}</h4>
                      <p className="text-[10px] uppercase tracking-widest text-muted-silver">{svc.category}</p>
                    </div>
                  </div>

                  <span className={clsx(
                    'px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border',
                    isOk ? 'bg-success/10 border-success/30 text-success' :
                    isWarn ? 'bg-warning/10 border-warning/30 text-warning' :
                    'bg-danger/10 border-danger/30 text-danger'
                  )}>
                    {svc.status}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-border/50 text-xs font-mono text-muted-silver">
                  {svc.detail}
                </div>
              </div>
            );
          })}
        </div>

        {/* Source Health Breakdown */}
        <div className="p-6 bg-card border border-border rounded-xl">
          <h3 className="text-xs font-semibold text-muted-silver tracking-[0.2em] uppercase mb-4">
            Scraper Adapters & Data Feed Feasibility
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-muted-silver">
                  <th className="pb-3 uppercase">Adapter Name</th>
                  <th className="pb-3 uppercase">Mode</th>
                  <th className="pb-3 uppercase">Status</th>
                  <th className="pb-3 uppercase">Success Rate</th>
                  <th className="pb-3 uppercase">Records</th>
                  <th className="pb-3 uppercase">Avg Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {sources.map((s) => (
                  <tr key={s.source_id} className="text-soft-white">
                    <td className="py-3 font-bold">{s.source_name}</td>
                    <td className="py-3 text-muted-silver">{s.source_name.toLowerCase().includes('fixture') ? 'FIXTURE' : 'LIVE'}</td>
                    <td className="py-3">
                      <span className={clsx(
                        'px-2 py-0.5 rounded text-[10px] font-bold border',
                        s.status === 'HEALTHY' ? 'bg-success/10 border-success/30 text-success' : 'bg-warning/10 border-warning/30 text-warning'
                      )}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3">{s.success_rate}%</td>
                    <td className="py-3">{s.total_records_scraped.toLocaleString()}</td>
                    <td className="py-3">{s.average_latency_ms}ms</td>
                  </tr>
                ))}
                {sources.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-muted-silver">
                      No active scraper adapters reported. Trigger demo seed to populate feeds.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </StateBoundary>
    </div>
  );
}

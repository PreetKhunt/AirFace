'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Scene, SceneTransition } from '@/components/CinematicTransition';
import { GlassSurface, GlassCard, GlassMetric } from '@/components/GlassSurface';
import { ArrowRight, Cloud, Network, TrendingUp, Shield, BarChart3, Map, Clock, Activity, Cpu } from 'lucide-react';
import { api } from '@/lib/api';
import { getAdapterOperationalStatus } from '@/lib/adapterStatus';
import { SystemStatusResponse, NationalAggregateIndex, DataQualityLog, SourceHealth, NormalizedIndexObservation, ProvenanceAuditTrail, HorizonSummaryResponse, PipelineStatus } from '@/types';
import { clsx } from 'clsx';

export default function CinematicLandingPage() {
  const [sysStatus, setSysStatus] = useState<SystemStatusResponse | null>(null);
  const [indices, setIndices] = useState<NationalAggregateIndex[]>([]);
  const [dq, setDq] = useState<DataQualityLog | null>(null);
  const [sources, setSources] = useState<SourceHealth[]>([]);
  const [horizonSummary, setHorizonSummary] = useState<HorizonSummaryResponse | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [sampleNorm, setSampleNorm] = useState<NormalizedIndexObservation | null>(null);
  const [sampleProv, setSampleProv] = useState<ProvenanceAuditTrail | null>(null);
  const [totalObservations, setTotalObservations] = useState(0);
  const [routeIds, setRouteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [sys, nat, quality, srcs, normData, pipeline, horizons, routeIndices] = await Promise.all([
        api.getSystemStatus().catch(() => null),
        api.getNationalIndices().catch(() => []),
        api.getQualityScore().catch(() => null),
        api.getSources().catch(() => []),
        api.getNormalizedObservations(undefined, undefined, true, 500).catch(() => ({ items: [], total: 0 })),
        api.getPipelineStatus().catch(() => null),
        api.getHorizonSummary().catch(() => null),
        api.getRouteIndices().catch(() => []),
      ]);
      setSysStatus(sys);
      setIndices(nat);
      setDq(quality);
      setSources(srcs);
      setPipelineStatus(pipeline);
      setHorizonSummary(horizons);
      setRouteIds(Array.from(new Set(routeIndices.map(route => route.route_id))));
      setTotalObservations(normData.total);

      if (normData.items.length > 0) {
        const item = normData.items[0];
        setSampleNorm(item);
        if (item.parsed?.observation_id) {
          const prov = await api.getProvenance(item.parsed.observation_id).catch(() => null);
          setSampleProv(prov);
        }
      }
    } catch (err) {
      console.error('Failed to load landing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const latestIndex = indices.length > 0 ? indices[indices.length - 1] : null;
  const fixtureSources = sources.filter(s => getAdapterOperationalStatus(s) === 'HISTORICAL/FIXTURE FALLBACK').length;
  const activeMode = sysStatus?.data_mode || latestIndex?.data_mode || 'DATA MODE UNAVAILABLE';
  const airlineCount = pipelineStatus?.counts.airlines ?? 0;
  const networkAirports = Array.from(new Set(routeIds.flatMap(route => route.split('-')))).slice(0, 6);
  const networkPositions = [
    { x: '20%', y: '25%' }, { x: '80%', y: '28%' }, { x: '45%', y: '65%' },
    { x: '65%', y: '75%' }, { x: '30%', y: '75%' }, { x: '75%', y: '48%' },
  ];

  const formatFare = (value: string | null | undefined) =>
    value == null ? 'NO DATA' : `₹${parseFloat(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  return (
    <div className="snap-scroll">
      {/* SCENE 01: THE SKY */}
      <Scene
        id="sky"
        title="AIRFACE"
        subtitle="India's Airfare Intelligence Platform"
        background="stars"
        parallax
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative mb-12">
            <div className="absolute -inset-4 bg-gradient-to-r from-electric-cyan/20 to-atmospheric-blue/20 blur-3xl rounded-full" />
            <div className="relative">
              <div className="text-6xl md:text-7xl lg:text-8xl font-light tracking-tighter text-soft-white mb-4">
                UNDERSTANDING
              </div>
              <div className="text-5xl md:text-6xl lg:text-7xl font-light tracking-tighter text-electric-cyan animate-glow-cyan">
                THE PRICE OF INDIA&apos;S SKIES
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface/80 border border-white/10 mb-8 font-mono text-xs text-muted-silver">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span>OPERATIONAL MODE:</span>
            <span className="text-soft-white font-bold">{activeMode}</span>
          </div>

          <p className="text-xl text-muted-silver max-w-2xl mx-auto mb-12 leading-relaxed">
            Every flight leaves a signal. AirFace transforms persisted airfare observations
            into measurable intelligence for India&apos;s economic landscape.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="#control-room"
              className="px-8 py-4 bg-gradient-to-r from-electric-cyan to-atmospheric-blue text-soft-white font-semibold rounded-full hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] transition-all duration-300 hover:scale-105"
            >
              Enter Control Room
            </Link>
            <Link
              href="/methodology"
              className="px-8 py-4 glass-surface border border-electric-cyan/30 text-electric-cyan font-semibold rounded-full hover:bg-electric-cyan/10 transition-all duration-300"
            >
              Explore Methodology
            </Link>
          </div>
        </div>

        {/* Aircraft window effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 border-2 border-electric-cyan/20 rounded-full blur-xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 border border-atmospheric-blue/10 rounded-full" />
          <Cloud className="absolute top-1/3 left-1/3 w-24 h-24 text-white/10 animate-float" />
          <Cloud className="absolute top-1/2 right-1/4 w-32 h-32 text-white/10 animate-float" style={{ animationDelay: '2s' }} />
        </div>
      </Scene>

      <SceneTransition from="THE SKY" to="THE NETWORK" label="Navigation Systems Online" />

      {/* SCENE 02: THE NETWORK */}
      <Scene
        id="network"
        title="The Network"
        subtitle="Persisted airfare observations form a picture of India's skies"
        background="route"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="relative mb-8">
              <div className="absolute -inset-4 bg-gradient-to-r from-atmospheric-blue/20 to-transparent blur-2xl" />
              <Network className="relative w-16 h-16 text-electric-cyan mb-4" />
              <h3 className="text-3xl font-light text-soft-white mb-4">Indian Air Route Network</h3>
              <p className="text-muted-silver leading-relaxed">
                From Delhi to Mumbai, Bangalore to Chennai, our system monitors every major
                domestic corridor. Each route tells a story of supply, demand, and seasonal patterns.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <GlassMetric
                label="Active Corridors"
                value={latestIndex?.route_count ?? 'NO DATA'}
                size="sm"
              />
              <GlassMetric
                label="Coverage"
                value={latestIndex ? `${latestIndex.coverage_pct}%` : 'NO DATA'}
                size="sm"
              />
              <GlassMetric
                label="Airlines"
                value={airlineCount || 'NO DATA'}
                size="sm"
              />
              <GlassMetric
                label="Observations"
                value={totalObservations > 0 ? totalObservations.toLocaleString() : 'NO DATA'}
                size="sm"
              />
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-atmospheric-blue/5 to-transparent rounded-3xl" />
            <div className="relative p-8">
              {/* Route network visualization */}
              <div className="relative h-96">
                <div className="absolute inset-0 border border-atmospheric-blue/20 rounded-2xl" />

                {/* Route lines */}
                <div className="absolute top-1/4 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-electric-cyan to-transparent" />
                <div className="absolute top-1/3 right-1/4 w-1/3 h-px bg-gradient-to-r from-transparent via-atmospheric-blue to-transparent transform rotate-12" />
                <div className="absolute bottom-1/3 left-1/3 w-2/5 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent transform -rotate-6" />

                {/* Route nodes */}
                {networkAirports.map((label, index) => (
                  <div
                    key={label}
                    className="absolute w-12 h-12 flex items-center justify-center"
                    style={{ ...networkPositions[index], transform: 'translate(-50%, -50%)' }}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-atmospheric-blue to-electric-cyan flex items-center justify-center text-xs font-bold text-soft-white shadow-lg">
                      {label}
                    </div>
                  </div>
                ))}
                {networkAirports.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-muted-silver">NO ROUTE INDEX DATA</div>}
              </div>

              <div className="mt-8 text-center">
                <Link
                  href="/route-explorer"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-electric-cyan/30 text-electric-cyan rounded-full hover:bg-electric-cyan/10 transition-colors"
                >
                  Explore Route Intelligence
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Scene>

      <SceneTransition from="THE NETWORK" to="THE FARE" label="Structural Analysis" />

      {/* SCENE 03: THE FARE */}
      <Scene
        id="fare"
        title="The Fare"
        subtitle="Every index begins with an observation"
        background="pipeline"
      >
        <div className="max-w-4xl mx-auto">
          <GlassSurface className="p-8 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-2xl font-mono text-muted-silver mb-2">{sampleNorm?.route_id || 'NO DATA'}</div>
                <div className="text-sm text-muted-silver">{sampleNorm?.booking_horizon || 'NO DATA'}</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-mono font-bold text-electric-cyan mb-2">{formatFare(sampleNorm?.comparable_index_fare)}</div>
                <div className="text-sm text-muted-silver">Comparable Fare (P_comparable)</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-mono text-muted-silver">{sampleNorm?.parsed ? `${sampleNorm.parsed.airline_code} ${sampleNorm.parsed.flight_number}` : 'NO DATA'}</div>
                <div className="text-sm text-muted-silver">{sampleNorm?.parsed ? `${sampleNorm.parsed.cabin_class || 'NO CABIN'} · ${sampleNorm.parsed.fare_family || 'NO FARE FAMILY'}` : 'NO DATA'}</div>
              </div>
            </div>
          </GlassSurface>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'BASE', value: formatFare(sampleNorm?.parsed?.base_fare), color: 'from-accent to-accent/70' },
              { label: 'UDF', value: formatFare(sampleNorm?.parsed?.udf_fee), color: 'from-success to-success/70' },
              { label: 'ASF', value: formatFare(sampleNorm?.parsed?.asf_fee), color: 'from-warning to-warning/70' },
              { label: 'GST', value: formatFare(sampleNorm?.parsed?.gst_tax), color: 'from-info to-info/70' },
              { label: 'YQ', value: formatFare(sampleNorm?.parsed?.yq_surcharge), color: 'from-muted to-muted/70' },
            ].map((component) => (
              <GlassCard
                key={component.label}
                className="text-center p-6"
                intensity="light"
              >
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${component.color} flex items-center justify-center mx-auto mb-4`}>
                  <div className="text-xs font-bold text-soft-white">{component.label.charAt(0)}</div>
                </div>
                <div className="text-xl font-mono font-bold text-soft-white">{component.value}</div>
                <div className="text-xs text-muted-silver mt-2">{component.label}</div>
              </GlassCard>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-silver max-w-2xl mx-auto mb-6">
              Each fare component is parsed, validated, and normalized to create
              comparable index observations: P_comp = Base + UDF + ASF + GST + YQ.
              Convenience fees and optional add-ons are strictly excluded.
            </p>
            <Link
              href="/data-cleaning"
              className="inline-flex items-center gap-2 px-6 py-3 border border-accent/30 text-accent rounded-full hover:bg-accent/10 transition-colors"
            >
              Inspect Observation Integrity
              <Shield className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </Scene>

      <SceneTransition from="THE FARE" to="THE PIPELINE" label="Data Processing" />

      {/* SCENE 04: THE PIPELINE */}
      <Scene
        id="pipeline"
        title="The Pipeline"
        subtitle="From raw observation to statistical intelligence"
        background="pipeline"
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
            {[
              { stage: 'RAW', icon: '📥', desc: 'HTML/JSON payloads', count: pipelineStatus?.counts.raw ?? 'NO DATA' },
              { stage: 'PARSED', icon: '🔍', desc: 'Fare extraction', count: pipelineStatus?.counts.parsed ?? 'NO DATA' },
              { stage: 'NORMALIZED', icon: '⚖️', desc: 'Currency alignment', count: pipelineStatus?.counts.normalized ?? 'NO DATA' },
              { stage: 'QUALITY', icon: '🛡️', desc: '8-factor scoring', count: dq ? `${dq.composite_score}%` : 'NO DATA' },
              { stage: 'INDEX', icon: '📊', desc: 'Jevons aggregation', count: indices.length || 'NO DATA' },
            ].map((stage, index) => (
              <div key={stage.stage} className="flex items-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-electric-cyan/20 to-atmospheric-blue/20 border border-electric-cyan/30 flex flex-col items-center justify-center">
                    <div className="text-2xl">{stage.icon}</div>
                    <div className="text-xs font-bold text-soft-white mt-1">{stage.stage}</div>
                  </div>
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-silver text-center w-24">
                    {typeof stage.count === 'number' ? stage.count.toLocaleString() : stage.count}
                  </div>
                </div>
                {index < 4 && (
                  <div className="hidden md:block w-16 h-1 bg-gradient-to-r from-electric-cyan/20 to-atmospheric-blue/20 mx-4" />
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <GlassCard title="Data Quality" subtitle="8-Factor Composite Score">
              {dq ? (
                <div className="text-center py-8">
                  <div className="text-6xl font-mono font-bold text-electric-cyan mb-2">
                    {dq.composite_score}
                  </div>
                  <div className="text-sm text-muted-silver">Empirical DQ Score (/100)</div>
                  <div className="mt-4 text-xs text-muted-silver">
                    Evaluated across completeness, validity, consistency, timeliness, reliability,
                    deduplication, outlier cleanliness, and availability coverage.
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-silver">
                  Quality scoring calculated dynamically from database observations.
                </div>
              )}
            </GlassCard>

            <GlassCard title="Collection Health" subtitle="Scraper Adapter Operational Status">
              <div className="py-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl font-mono font-bold text-soft-white">
                    {sources.length || 0}
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-bold bg-surface text-muted-silver border border-border">
                    {fixtureSources > 0 ? 'FIXTURE-BACKED DEMO' : 'NOT CONFIGURED'}
                  </div>
                </div>
                <div className="space-y-3">
                  {sources.map((source) => (
                    <div key={source.source_id} className="flex items-center justify-between">
                      <span className="text-sm text-muted-silver">{source.source_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-muted-silver uppercase">{getAdapterOperationalStatus(source)}</span>
                        <span className="text-xs text-muted-silver">{source.success_rate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </Scene>

      <SceneTransition from="THE PIPELINE" to="THE HORIZON" label="Temporal Analysis" />

      {/* SCENE 05: THE HORIZON */}
      <Scene
        id="horizon"
        title="The Horizon"
        subtitle="Advance purchase window changes the airfare signal"
        background="horizon"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <GlassCard>
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-soft-white mb-2">5 Advance Horizons</h4>
                <p className="text-muted-silver text-sm">
                  Airfares exhibit steep escalation as departure approaches.
                  AirFace stratifies indices into T+1, T+7, T+15, T+30, and T+45 windows.
                </p>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="py-8">
                <div className="text-center mb-6">
                  <div className="text-4xl font-mono font-bold text-soft-white">{horizonSummary?.horizons.filter(h => h.availability_state === 'AVAILABLE').length ?? 'NO DATA'} / {horizonSummary?.horizons.length ?? 'NO DATA'}</div>
                  <div className="text-sm text-muted-silver">Horizons with Index Data</div>
                </div>
                <div className="space-y-3">
                  {(horizonSummary?.horizons ?? []).map((item) => (
                    <div key={item.horizon} className="flex items-center justify-between gap-3">
                      <span className="font-mono text-amber-400 font-bold text-sm">{item.horizon}</span>
                      <span className="text-xs text-muted-silver">{item.availability_state === 'AVAILABLE' ? `${item.observation_count} observations · ${item.route_count} routes` : 'DATA NOT AVAILABLE'}</span>
                    </div>
                  ))}
                  {horizonSummary?.horizons.length === 0 && <div className="text-xs text-muted-silver">No horizon summary is available.</div>}
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-electric-cyan mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-soft-white mb-2">Macroeconomic Insight</h4>
                <p className="text-muted-silver text-sm mb-6">
                  Stratifying by advance booking window prevents temporal composition bias
                  and yields unbiased CPI price relatives.
                </p>
                <Link
                  href="/booking-horizon"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-electric-cyan/30 text-electric-cyan rounded-full hover:bg-electric-cyan/10 transition-colors text-sm"
                >
                  Explore Horizon Analytics
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </GlassCard>
          </div>
        </div>
      </Scene>

      <SceneTransition from="THE HORIZON" to="THE NATIONAL SIGNAL" label="Macroeconomic Aggregation" />

      {/* SCENE 06: THE NATIONAL SIGNAL */}
      <Scene
        id="national-signal"
        title="The National Signal"
        subtitle="India's Airfare Price Index"
        background="map"
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative mb-12">
            <div className="absolute -inset-8 bg-gradient-to-r from-electric-cyan/10 to-atmospheric-blue/10 blur-3xl rounded-full" />
            <div className="relative">
              <div className="text-8xl md:text-9xl font-light tracking-tighter text-soft-white mb-2">
                {latestIndex?.index_value ? parseFloat(latestIndex.index_value.toString()).toFixed(2) : 'NO DATA'}
              </div>
              <div className="text-xl text-muted-silver uppercase tracking-widest">
                NATIONAL AIRFARE PRICE INDEX ({activeMode})
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <GlassMetric
              label="Base Period"
              value={latestIndex?.base_date || 'NO DATA'}
              size="sm"
            />
            <GlassMetric
              label="Calculation Date"
              value={latestIndex?.calculation_date || 'NO DATA'}
              size="sm"
            />
            <GlassMetric
              label="Horizon"
              value={latestIndex?.booking_horizon || 'NO DATA'}
              size="sm"
            />
            <GlassMetric
              label="Coverage"
              value={latestIndex ? `${latestIndex.coverage_pct}%` : 'NO DATA'}
              size="sm"
            />
          </div>

          <p className="text-muted-silver max-w-2xl mx-auto mb-8 text-sm">
            Experimental airfare price indicator derived from the configured route basket and methodology.
            Tier 1 elementary indices use the Jevons geometric mean, aggregated via DGCA passenger volume weights.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/index-analytics"
              className="px-8 py-4 bg-gradient-to-r from-atmospheric-blue to-electric-cyan text-soft-white font-semibold rounded-full hover:shadow-[0_0_40px_rgba(30,58,138,0.4)] transition-all duration-300"
            >
              Open Index Analytics
            </Link>
            <Link
              href="/methodology"
              className="px-8 py-4 glass-surface border border-atmospheric-blue/30 text-atmospheric-blue font-semibold rounded-full hover:bg-atmospheric-blue/10 transition-all duration-300"
            >
              Methodology Details
            </Link>
          </div>
        </div>
      </Scene>

      <SceneTransition from="THE NATIONAL SIGNAL" to="TRUST" label="Cryptographic Provenance" />

      {/* SCENE 07: TRUST */}
      <Scene
        id="trust"
        title="Trust"
        subtitle="Every number has a cryptographic trail"
        background="provenance"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <GlassCard title="Cryptographic Audit Trail" subtitle="Immutable Verification">
              <div className="py-6">
                <div className="font-mono text-xs text-emerald-400 break-all bg-obsidian p-4 rounded-lg mb-4 border border-emerald-500/20">
                  {sampleProv?.payload_sha256_hash || 'NO DATA'}
                </div>
                <p className="text-sm text-muted-silver">
                  Each index observation is cryptographically linked to its raw scraper payload
                  through deterministic SHA-256 hashing, enabling tamper-evident audit trails.
                </p>
              </div>
            </GlassCard>

            <GlassCard title="Data Provenance" subtitle="Lineage Snapshot">
              <div className="py-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-silver">Observation ID</span>
                  <span className="text-xs font-mono text-emerald-400">{sampleNorm?.observation_id ? `${sampleNorm.observation_id.slice(0, 16)}...` : 'NO DATA'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-silver">Source Portal</span>
                  <span className="text-xs font-mono text-emerald-400">{sampleProv?.source_portal || 'NO DATA'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-silver">Index Methodology</span>
                  <span className="text-xs font-mono text-emerald-400">Jevons Elementary</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-silver">Data Mode</span>
                  <span className="text-xs font-mono text-emerald-400">{activeMode}</span>
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/provenance"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-soft-white font-semibold rounded-full hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all duration-300"
            >
              Explore Provenance Graph
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </Scene>

      {/* SCENE 08: CONTROL ROOM */}
      <Scene
        id="control-room"
        title="Control Room"
        subtitle="Operational Intelligence Workspace"
        background="control"
        className="min-h-[80vh]"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-light text-soft-white mb-4">
              Aviation Intelligence Control Room
            </h2>
            <p className="text-xl text-muted-silver max-w-3xl mx-auto">
              Access the 10 interconnected modules of the AIRFACE pipeline.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'OVERVIEW', icon: BarChart3, href: '/', color: 'from-accent to-accent/70' },
              { label: 'ROUTE INTEL', icon: Map, href: '/route-explorer', color: 'from-success to-success/70' },
              { label: 'HORIZONS', icon: Clock, href: '/booking-horizon', color: 'from-amber-500 to-orange-500' },
              { label: 'INDEX ANALYTICS', icon: BarChart3, href: '/index-analytics', color: 'from-blue to-atmospheric-blue' },
              { label: 'DATA QUALITY', icon: Shield, href: '/data-quality', color: 'from-warning to-warning/70' },
              { label: 'CLEANING ENGINE', icon: Shield, href: '/data-cleaning', color: 'from-rose-500 to-pink-500' },
              { label: 'COLLECTION', icon: Activity, href: '/collection-monitor', color: 'from-emerald-500 to-green-500' },
              { label: 'VALIDATION', icon: BarChart3, href: '/backtest', color: 'from-info to-info/70' },
              { label: 'PROVENANCE', icon: Network, href: '/provenance', color: 'from-teal-500 to-emerald-500' },
              { label: 'SYSTEM STATUS', icon: Cpu, href: '/system-status', color: 'from-purple-500 to-indigo-500' },
            ].map((module) => {
              const Icon = module.icon;
              return (
                <Link
                  key={module.label}
                  href={module.href}
                  className="group"
                >
                  <GlassSurface className="p-6 text-center hover:scale-105 transition-transform duration-300">
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${module.color} flex items-center justify-center mx-auto mb-3 group-hover:shadow-lg transition-shadow`}>
                      <Icon className="w-7 h-7 text-soft-white" />
                    </div>
                    <div className="text-xs font-semibold text-soft-white tracking-wider">{module.label}</div>
                    <div className="text-[10px] text-muted-silver mt-1">Module</div>
                  </GlassSurface>
                </Link>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/route-explorer"
                className="px-8 py-4 glass-heavy border border-electric-cyan/30 text-electric-cyan font-semibold rounded-full hover:bg-electric-cyan/10 transition-all duration-300"
              >
                Start with Route Intelligence
              </Link>
              <Link
                href="/collection-monitor"
                className="px-8 py-4 glass-heavy border border-atmospheric-blue/30 text-atmospheric-blue font-semibold rounded-full hover:bg-atmospheric-blue/10 transition-all duration-300"
              >
                Monitor Collection Pipeline
              </Link>
            </div>
          </div>
        </div>
      </Scene>
    </div>
  );
}
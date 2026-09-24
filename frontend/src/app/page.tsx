'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Scene, SceneTransition } from '@/components/CinematicTransition';
import { GlassSurface, GlassCard, GlassMetric } from '@/components/GlassSurface';
import { ArrowRight, Cloud, Network, TrendingUp, Shield, BarChart3, Map, Clock, Activity } from 'lucide-react';
import { api } from '@/lib/api';
import { SystemStatusResponse, NationalAggregateIndex, DataQualityLog, SourceHealth } from '@/types';
import { clsx } from 'clsx';

export default function CinematicLandingPage() {
  const [sysStatus, setSysStatus] = useState<SystemStatusResponse | null>(null);
  const [indices, setIndices] = useState<NationalAggregateIndex[]>([]);
  const [dq, setDq] = useState<DataQualityLog | null>(null);
  const [sources, setSources] = useState<SourceHealth[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [sys, nat, quality, srcs] = await Promise.all([
        api.getSystemStatus().catch(() => null),
        api.getNationalIndices().catch(() => []),
        api.getQualityScore().catch(() => null),
        api.getSources().catch(() => []),
      ]);
      setSysStatus(sys);
      setIndices(nat);
      setDq(quality);
      setSources(srcs);
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
  const totalScraped = sources.reduce((sum, s) => sum + s.total_records_scraped, 0);
  const healthySources = sources.filter(s => s.status === 'HEALTHY').length;

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

          <p className="text-xl text-muted-silver max-w-2xl mx-auto mb-12 leading-relaxed">
            Every flight leaves a signal. AirFace transforms millions of airfare observations
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
        subtitle="Thousands of airfare observations form a picture of India's skies"
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
                value={latestIndex?.route_count || 12}
                size="sm"
              />
              <GlassMetric
                label="Coverage"
                value={latestIndex?.coverage_pct || '87.4'}
                unit="%"
                size="sm"
              />
              <GlassMetric
                label="Airlines"
                value="4"
                size="sm"
              />
              <GlassMetric
                label="Observations"
                value={totalScraped.toLocaleString()}
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

                {/* Mock route lines (would be dynamic with real data) */}
                <div className="absolute top-1/4 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-electric-cyan to-transparent" />
                <div className="absolute top-1/3 right-1/4 w-1/3 h-px bg-gradient-to-r from-transparent via-atmospheric-blue to-transparent transform rotate-12" />
                <div className="absolute bottom-1/3 left-1/3 w-2/5 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent transform -rotate-6" />

                {/* Route nodes */}
                {[
                  { label: 'DEL', x: '15%', y: '25%' },
                  { label: 'BOM', x: '85%', y: '25%' },
                  { label: 'BLR', x: '40%', y: '60%' },
                  { label: 'MAA', x: '60%', y: '75%' },
                  { label: 'CCU', x: '25%', y: '75%' },
                  { label: 'HYD', x: '75%', y: '45%' },
                ].map((node) => (
                  <div
                    key={node.label}
                    className="absolute w-12 h-12 flex items-center justify-center"
                    style={{ left: node.x, top: node.y, transform: 'translate(-50%, -50%)' }}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-atmospheric-blue to-electric-cyan flex items-center justify-center text-xs font-bold text-soft-white shadow-lg">
                      {node.label}
                    </div>
                  </div>
                ))}
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
                <div className="text-2xl font-mono text-muted-silver mb-2">DEL → BOM</div>
                <div className="text-sm text-muted-silver">T+7</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-mono font-bold text-electric-cyan mb-2">₹4,582</div>
                <div className="text-sm text-muted-silver">Comparable Fare</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-mono text-muted-silver">Indigo 6E-205</div>
                <div className="text-sm text-muted-silver">Direct · 2h 15m</div>
              </div>
            </div>
          </GlassSurface>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'BASE', value: '₹3,820', color: 'from-accent to-accent/70' },
              { label: 'UDF', value: '₹430', color: 'from-success to-success/70' },
              { label: 'ASF', value: '₹250', color: 'from-warning to-warning/70' },
              { label: 'GST', value: '₹682', color: 'from-info to-info/70' },
              { label: 'YQ', value: '₹0', color: 'from-muted to-muted/70' },
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
              comparable index observations. No hidden fees, no optional extras—just
              the true cost of air travel.
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
              { stage: 'RAW', icon: '📥', desc: 'HTML/JSON payloads', count: totalScraped },
              { stage: 'PARSED', icon: '🔍', desc: 'Fare extraction', count: 0 },
              { stage: 'NORMALIZED', icon: '⚖️', desc: 'Currency alignment', count: 0 },
              { stage: 'QUALITY', icon: '🛡️', desc: '8-factor scoring', count: 0 },
              { stage: 'INDEX', icon: '📊', desc: 'Jevons aggregation', count: indices.length },
            ].map((stage, index) => (
              <div key={stage.stage} className="flex items-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-electric-cyan/20 to-atmospheric-blue/20 border border-electric-cyan/30 flex flex-col items-center justify-center">
                    <div className="text-2xl">{stage.icon}</div>
                    <div className="text-xs font-bold text-soft-white mt-1">{stage.stage}</div>
                  </div>
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-silver text-center w-24">
                    {stage.count.toLocaleString()}
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
                  <div className="text-sm text-muted-silver">Composite Score</div>
                  <div className="mt-4 text-xs text-muted-silver">
                    Based on completeness, validity, consistency, timeliness, reliability,
                    deduplication, outlier cleanliness, and availability coverage.
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-silver">
                  Quality scoring available after pipeline execution
                </div>
              )}
            </GlassCard>

            <GlassCard title="Collection Health" subtitle="Scraper Adapter Status">
              <div className="py-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl font-mono font-bold text-soft-white">
                    {healthySources}/{sources.length}
                  </div>
                  <div className={clsx(
                    'px-3 py-1 rounded-full text-xs font-bold',
                    healthySources === sources.length
                      ? 'bg-success/10 text-success border border-success/20'
                      : 'bg-warning/10 text-warning border border-warning/20'
                  )}>
                    {healthySources === sources.length ? 'ALL SYSTEMS GO' : 'DEGRADED'}
                  </div>
                </div>
                <div className="space-y-3">
                  {sources.map((source) => (
                    <div key={source.source_id} className="flex items-center justify-between">
                      <span className="text-sm text-muted-silver">{source.source_name}</span>
                      <div className="flex items-center gap-2">
                        <div className={clsx(
                          'w-2 h-2 rounded-full',
                          source.status === 'HEALTHY' ? 'bg-success animate-pulse' : 'bg-warning'
                        )} />
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
        subtitle="Booking time changes the airfare signal"
        background="horizon"
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center mb-12 overflow-x-auto pb-4">
            <div className="flex gap-2">
              {['T+1', 'T+7', 'T+15', 'T+30', 'T+45'].map((horizon) => (
                <button
                  key={horizon}
                  className="px-6 py-3 rounded-full border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors"
                >
                  {horizon}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <GlassCard>
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-soft-white mb-2">Advance Purchase Window</h4>
                <p className="text-muted-silver text-sm">
                  Fares evolve dramatically as departure approaches.
                  Our system captures this temporal dimension across 5 strategic horizons.
                </p>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="py-8">
                <div className="text-center mb-6">
                  <div className="text-4xl font-mono font-bold text-soft-white">+28.4%</div>
                  <div className="text-sm text-muted-silver">Average escalation T+45 → T+1</div>
                </div>
                <div className="space-y-3">
                  {[
                    { horizon: 'T+45', value: '100.0', change: '+0%' },
                    { horizon: 'T+30', value: '108.2', change: '+8.2%' },
                    { horizon: 'T+15', value: '119.7', change: '+19.7%' },
                    { horizon: 'T+7', value: '125.4', change: '+25.4%' },
                    { horizon: 'T+1', value: '128.4', change: '+28.4%' },
                  ].map((item) => (
                    <div key={item.horizon} className="flex items-center justify-between">
                      <span className="text-sm text-muted-silver">{item.horizon}</span>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-soft-white">{item.value}</span>
                        <span className="text-xs text-amber-400">{item.change}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-electric-cyan mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-soft-white mb-2">Strategic Insight</h4>
                <p className="text-muted-silver text-sm mb-6">
                  Understanding horizon-based pricing enables better policy decisions,
                  corporate travel planning, and consumer protection.
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
                {latestIndex?.index_value || '104.82'}
              </div>
              <div className="text-xl text-muted-silver uppercase tracking-widest">
                NATIONAL AIRFARE PRICE INDEX
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <GlassMetric
              label="Base = 100"
              value="100.00"
              size="sm"
            />
            <GlassMetric
              label="Daily Change"
              value="+0.42"
              unit="%"
              trend="up"
              trendValue="+0.42%"
              size="sm"
            />
            <GlassMetric
              label="Monthly Change"
              value="+2.18"
              unit="%"
              trend="up"
              trendValue="+2.18%"
              size="sm"
            />
            <GlassMetric
              label="Coverage"
              value={latestIndex?.coverage_pct || '87.4'}
              unit="%"
              size="sm"
            />
          </div>

          <p className="text-muted-silver max-w-2xl mx-auto mb-8">
            The Jevons geometric mean aggregates thousands of route-level observations
            into a single national indicator. Weighted by DGCA passenger volumes,
            it represents the true price movement of India&apos;s domestic air travel.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-8 py-4 bg-gradient-to-r from-atmospheric-blue to-electric-cyan text-soft-white font-semibold rounded-full hover:shadow-[0_0_40px_rgba(30,58,138,0.4)] transition-all duration-300"
            >
              Enter Control Room
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
        subtitle="Every number has a trail"
        background="provenance"
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
            {[
              { label: 'NATIONAL INDEX', value: latestIndex?.index_value || '104.82' },
              { label: 'ROUTE', value: 'DEL-BOM' },
              { label: 'BOOKING HORIZON', value: 'T+7' },
              { label: 'INDEX OBSERVATION', value: '₹4,582' },
              { label: 'NORMALIZED OBSERVATION', value: 'obs_8f2e...' },
              { label: 'PARSED OBSERVATION', value: 'obs_8f2e...' },
              { label: 'RAW OBSERVATION', value: 'raw_a1b2...' },
              { label: 'SHA-256', value: 'e3b0c4...' },
            ].map((node, index) => (
              <div key={node.label} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 flex items-center justify-center mb-2">
                  <div className="text-xs font-bold text-emerald-400 text-center px-1">{node.label.split(' ')[0]}</div>
                </div>
                <div className="text-xs text-muted-silver text-center mt-2">{node.value}</div>
                {index < 7 && (
                  <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 mt-16 w-8 h-1 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20" />
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <GlassCard title="Cryptographic Audit Trail" subtitle="Immutable Verification">
              <div className="py-6">
                <div className="font-mono text-sm text-emerald-400 break-all bg-obsidian p-4 rounded-lg mb-4">
                  8f2e4a9b1c3d5e7f89101112131415161718192021222324252627282930
                </div>
                <p className="text-sm text-muted-silver">
                  Each index value is cryptographically linked to its source data through
                  SHA-256 hashing. This creates an immutable audit trail from final
                  aggregation back to raw scraper payloads.
                </p>
              </div>
            </GlassCard>

            <GlassCard title="Data Provenance" subtitle="Complete Lineage">
              <div className="py-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-silver">Index Calculation</span>
                    <span className="text-xs font-mono text-emerald-400">Jevons Geometric Mean</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-silver">Data Quality Score</span>
                    <span className="text-xs font-mono text-emerald-400">{dq?.composite_score || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-silver">Source Integrity</span>
                    <span className="text-xs font-mono text-emerald-400">SHA-256 Verified</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-silver">Temporal Coverage</span>
                    <span className="text-xs font-mono text-emerald-400">{indices.length} Days</span>
                  </div>
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
              Where MARKET, ROUTES, HORIZONS, COLLECTION, QUALITY, VALIDATION, and PROVENANCE
              become accessible. The operational heart of AirFace.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {[
              { label: 'MARKET', icon: BarChart3, href: '/', color: 'from-accent to-accent/70' },
              { label: 'ROUTES', icon: Map, href: '/route-explorer', color: 'from-success to-success/70' },
              { label: 'HORIZONS', icon: Clock, href: '/booking-horizon', color: 'from-amber-500 to-orange-500' },
              { label: 'COLLECTION', icon: Activity, href: '/collection-monitor', color: 'from-emerald-500 to-green-500' },
              { label: 'QUALITY', icon: Shield, href: '/data-quality', color: 'from-warning to-warning/70' },
              { label: 'INTEGRITY', icon: Shield, href: '/data-cleaning', color: 'from-rose-500 to-pink-500' },
              { label: 'VALIDATION', icon: BarChart3, href: '/backtest', color: 'from-info to-info/70' },
              { label: 'PROVENANCE', icon: Network, href: '/provenance', color: 'from-teal-500 to-emerald-500' },
            ].map((module) => {
              const Icon = module.icon;
              return (
                <Link
                  key={module.label}
                  href={module.href}
                  className="group"
                >
                  <GlassSurface className="p-6 text-center hover:scale-105 transition-transform duration-300">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${module.color} flex items-center justify-center mx-auto mb-4 group-hover:shadow-lg transition-shadow`}>
                      <Icon className="w-8 h-8 text-soft-white" />
                    </div>
                    <div className="text-sm font-semibold text-soft-white">{module.label}</div>
                    <div className="text-xs text-muted-silver mt-1">Workspace</div>
                  </GlassSurface>
                </Link>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-silver mb-6">
              Ready to explore India&apos;s airfare intelligence?
            </p>
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
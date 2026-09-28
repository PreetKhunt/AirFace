'use client';

import { BookOpen, CheckCircle, Shield, Layers, Scale, AlertCircle } from 'lucide-react';

export default function MethodologyPage() {
  return (
    <div className="min-h-screen p-6 md:p-8 space-y-6 max-w-7xl mx-auto fade-in">
      <header className="p-6 bg-card border border-border rounded-xl shadow-sm">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
          Methodology & Mathematical Framework
        </h1>
        <p className="text-sm text-muted-silver leading-relaxed">
          Methodology informed by established CPI index-number principles, SIH26056 requirements, and project-defined engineering decisions.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Statistical Pipeline Steps */}
        <div className="p-6 bg-card border border-border rounded-xl space-y-4">
          <h2 className="text-lg font-bold text-white mb-4 border-b border-border pb-2 flex items-center gap-2">
            <Layers className="w-5 h-5 text-electric-cyan" /> End-to-End Statistical Pipeline
          </h2>
          
          <MethodologyStep num="1" title="Automated Web Scraping" desc="HTML DOM parsing and JSON payload collection from airline direct portals and aggregators." />
          <MethodologyStep num="2" title="Structural Parsing" desc="Extraction of base fare, mandatory statutory charges (UDF, ASF, YQ), and GST into structured models." />
          <MethodologyStep num="3" title="Fare Normalization" desc="Calculation of comparable index fare: P_comp = Base + UDF + ASF + GST + YQ. Strict exclusion of convenience fees." />
          <MethodologyStep num="4" title="Commercial Deduplication" desc="Resolving commercially identical flights across channels while giving priority to direct airline feeds." />
          <MethodologyStep num="5" title="Outlier & Surge Treatment" desc="Tukey IQR anomaly exclusion with a strict 3.5x median technical ceiling. Genuine market surges are preserved." />
          <MethodologyStep num="6" title="8-Factor Empirical DQ Scoring" desc="Multi-dimensional data quality scoring evaluated across completeness, validity, consistency, freshness, and reliability." />
          <MethodologyStep num="7" title="Tier 1 Elementary Jevons Index" desc="Unweighted geometric mean of price relatives per Route × Horizon × Date cell: I_t = exp(mean(ln(p_t / p_0))) * 100." />
          <MethodologyStep num="8" title="DGCA Volume-Weighted National Index" desc="Tier 2 aggregation using DGCA passenger traffic volume reference weights via Young/Modified Laspeyres & Jevons formulas." />
          <MethodologyStep num="9" title="Statistical Backtesting & Validation" desc="Evaluation of RMSE, MAPE, Pearson r, and Directional Accuracy against reference baseline datasets." />
          <MethodologyStep num="10" title="Cryptographic Provenance Trail" desc="Immutable SHA-256 hash tracking from raw scraper payload to final national index contribution." />
        </div>

        {/* Requirements & Disclosures */}
        <div className="space-y-6">
          <div className="p-6 bg-card border border-border rounded-xl border-l-4 border-l-emerald-500">
            <h3 className="text-md font-bold text-white flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              A. SIH26056 PROBLEM REQUIREMENTS
            </h3>
            <ul className="list-disc pl-5 text-xs text-muted-silver space-y-1.5">
              <li>Automated scraping of Airline and OTA portals for NSO CPI augmentation.</li>
              <li>Stratification across advance booking windows (T+1, T+7, T+15, T+30, T+45).</li>
              <li>Comparable fare isolation and double-counting prevention.</li>
              <li>Data quality and cleaning heuristics.</li>
              <li>National aggregation and verification dashboard.</li>
            </ul>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl border-l-4 border-l-electric-cyan">
            <h3 className="text-md font-bold text-white flex items-center gap-2 mb-2">
              <Scale className="w-5 h-5 text-electric-cyan" />
              B. VERIFIED INDEX-NUMBER PRINCIPLES
            </h3>
            <ul className="list-disc pl-5 text-xs text-muted-silver space-y-1.5">
              <li>Jevons geometric mean selected for Tier 1 elementary indices to satisfy the Axiomatic Time Reversal Test and prevent Carli upward substitution bias.</li>
              <li>Young / Modified Laspeyres used for Tier 2 national aggregation with fixed reference weights.</li>
              <li>DGCA passenger traffic volume shares used as traffic-based reference weights.</li>
            </ul>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl border-l-4 border-l-accent">
            <h3 className="text-md font-bold text-white flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-accent" />
              C. PROJECT ENGINEERING DECISIONS
            </h3>
            <ul className="list-disc pl-5 text-xs text-muted-silver space-y-1.5">
              <li>Strict isolation between LIVE, HISTORICAL, and SYNTHETIC data modes.</li>
              <li>Cryptographic SHA-256 payload hashing for full observation lineage.</li>
              <li>Zero-imputation policy: Missing fares are tracked as missing rather than cosmetically filled.</li>
              <li>Deterministic seed architecture for reproducible evaluation.</li>
            </ul>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl border-l-4 border-l-amber-500">
            <h3 className="text-md font-bold text-white flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              D. PROTOTYPE LIMITATIONS & DISCLOSURES
            </h3>
            <p className="text-xs text-muted-silver leading-relaxed mb-2">
              This prototype demonstrates engineering feasibility and algorithmic correctness. It is an experimental indicator designed to demonstrate data ingestion, normalization, and index aggregation pipelines for SIH26056 evaluation.
            </p>
            <p className="text-[11px] font-mono text-muted-silver italic">
              Official historical DGCA airfare micro-data was not available for prototype validation; validation baselines represent version-controlled synthetic and demo reference datasets.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

function MethodologyStep({ num, title, desc }: { num: string, title: string, desc: string }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-7 h-7 flex-shrink-0 bg-accent/20 text-accent text-xs font-bold rounded-full flex items-center justify-center border border-accent/30">
        {num}
      </div>
      <div>
        <h4 className="font-bold text-white text-xs">{title}</h4>
        <p className="text-xs text-muted-silver mt-0.5 leading-normal">{desc}</p>
      </div>
    </div>
  );
}

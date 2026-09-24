'use client';

import { BookOpen, CheckCircle } from 'lucide-react';

export default function MethodologyPage() {
  return (
    <div className="min-h-screen p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <header className="p-6 bg-card border border-border rounded-xl shadow-sm">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
          Methodology & Architecture
        </h1>
        <p className="text-sm text-gray-400">Strict adherence to the IMF/ILO CPI Manual (2020) and project directives.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="p-6 bg-card border border-border rounded-xl space-y-4">
          <h2 className="text-lg font-bold text-white mb-4 border-b border-border pb-2">Statistical Pipeline</h2>
          
          <MethodologyStep num="1" title="Data Collection" desc="Scraping HTML DOM payloads from primary Airline and OTA websites ensuring structural integrity." />
          <MethodologyStep num="2" title="Parsing" desc="Extracting gross totals, base fares, explicit taxes (UDF, ASF, YQ)." />
          <MethodologyStep num="3" title="Fare Normalization" desc="Isolating comparable components. Subtracting optional conveniences fees." />
          <MethodologyStep num="4" title="Deduplication" desc="Identifying commercially identical flight variants across disparate OTAs." />
          <MethodologyStep num="5" title="Outlier Handling" desc="Tukey IQR based exclusion bounds ensuring transient website pricing bugs do not poison the index." />
          <MethodologyStep num="6" title="Jevons Elementary Index" desc="Tier 1 calculation computing the unweighted geometric mean of price relatives per Route/Horizon." />
          <MethodologyStep num="7" title="DGCA Weighting" desc="Application of official passenger volume proportions." />
          <MethodologyStep num="8" title="National Index" desc="Tier 2 aggregation using the Young / Modified Laspeyres formula for macroeconomic reporting." />
          <MethodologyStep num="9" title="Backtest Validation" desc="Rigorous 30-day temporal-aligned statistical validation against established reference baselines." />

        </div>

        <div className="space-y-6">
          <div className="p-6 bg-card border border-border rounded-xl border-l-4 border-l-emerald-500">
            <h3 className="text-md font-bold text-white flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              OFFICIAL SIH REQUIREMENTS
            </h3>
            <ul className="list-disc pl-5 text-sm text-gray-300 space-y-2">
              <li>Real-time automated web scraping.</li>
              <li>Support for dynamic pricing based on advance booking horizons.</li>
              <li>Calculation of a robust Airfare Price Index.</li>
              <li>Data quality and cleaning mechanisms.</li>
            </ul>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl border-l-4 border-l-accent">
            <h3 className="text-md font-bold text-white flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-accent" />
              PROJECT ENGINEERING DECISIONS
            </h3>
            <ul className="list-disc pl-5 text-sm text-gray-300 space-y-2">
              <li>Strict isolation between LIVE, HISTORICAL, and SYNTHETIC data modes.</li>
              <li>Cryptographic SHA-256 payload hashing for audit trails.</li>
              <li>Zero-imputation policy ensuring exact statistical truth over cosmetic chart filling.</li>
              <li>Asynchronous task queues preserving UI responsiveness.</li>
            </ul>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl border-l-4 border-l-accent">
            <h3 className="text-md font-bold text-white flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-accent" />
              PROPOSED ANALYTICAL METHODOLOGY
            </h3>
            <ul className="list-disc pl-5 text-sm text-gray-300 space-y-2">
              <li>Jevons geometric mean selected over Carli to satisfy the Time Reversal Test.</li>
              <li>T+1 through T+45 booking stratification mitigating advance-purchase volatility masking.</li>
              <li>Target benchmarks (e.g. MAPE &lt; 5%) established as proposed criteria, not binding federal law.</li>
            </ul>
            <p className="text-xs text-gray-500 mt-4 italic">
              Disclaimer: This prototype demonstrates technical feasibility and methodological correctness. It does not replace India&apos;s official Consumer Price Index.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

function MethodologyStep({ num, title, desc }: { num: string, title: string, desc: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-8 h-8 flex-shrink-0 bg-accent/20 text-accent font-bold rounded-full flex items-center justify-center border border-accent/30">
        {num}
      </div>
      <div>
        <h4 className="font-bold text-white text-sm">{title}</h4>
        <p className="text-sm text-gray-400 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

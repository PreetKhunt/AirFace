'use client';

import { ArrowDown, BookOpen, ShieldCheck, Sigma } from 'lucide-react';

const steps = [
  ['DATA COLLECTION', 'Source adapters retain the raw observation, source details, collection time and declared data mode. This demo uses synthetic fixtures; it does not perform live fare scraping.'],
  ['FARE NORMALIZATION', 'Comparable fare = Base Fare + UDF + ASF + GST + YQ. Convenience fees and optional extras are excluded; a total-minus-convenience-fee fallback is used when the component breakdown is incomplete.'],
  ['QUALITY CONTROL', 'The prototype checks component consistency, screens commercial duplicates and classifies price anomalies. Invalid component totals and technical outliers are excluded from index eligibility.'],
  ['JEVONS ROUTE INDEX', 'For each route and booking horizon, matched flight price relatives are combined as a geometric mean against the persisted base period.'],
  ['NATIONAL AGGREGATION', 'Route indices are combined with passenger-volume reference weights using a weighted arithmetic (Young / Modified Laspeyres) or geometric (Jevons) mean.'],
  ['VALIDATION', 'Calculated values are date-aligned with a configured reference series. Metrics require matched observations; they are not evidence of official benchmark accuracy.'],
  ['PROVENANCE', 'Every parsed observation retains a trace to its raw payload and SHA-256 checksum.'],
] as const;

const horizons = [
  ['T+1', 'Last-minute'],
  ['T+7', 'Short-term'],
  ['T+15', 'Standard advance'],
  ['T+30', 'Early booking'],
  ['T+45', 'Baseline advance'],
] as const;

export default function MethodologyPage() {
  return (
    <div className="min-h-screen p-6 md:p-8 space-y-8 max-w-7xl mx-auto fade-in">
      <header className="glass-surface rounded-2xl p-8">
        <div className="section-label mb-3">AIRFACE / STATISTICAL FRAMEWORK</div>
        <h1 className="text-3xl md:text-5xl font-light tracking-tight text-white">From observed fares to an auditable index.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-silver">
          The frozen framework defines comparable fares and separate indices for each booking horizon. The current prototype implements
          the core calculations on demo data; proposed production features and official validation data are identified below.
        </p>
      </header>

      <section className="glass-surface rounded-2xl p-6 md:p-8">
        <div className="section-label mb-2">INDEPENDENT BOOKING HORIZONS</div>
        <h2 className="text-xl font-semibold text-white">One series per advance-booking window</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-silver">
          Booking window = calendar date of travel − calendar date of collection. Observations from different horizons are never
          combined in an elementary route index.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {horizons.map(([horizon, description]) => (
            <div key={horizon} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="font-mono text-lg text-electric-cyan">{horizon}</div>
              <div className="mt-1 text-xs text-muted-silver">{description}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6">
        <div className="glass-surface rounded-2xl p-6">
          <div className="section-label mb-6">PROTOTYPE PIPELINE</div>
          <div className="space-y-3">
            {steps.map(([title, description], index) => (
              <div key={title}>
                <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-electric-cyan/30 bg-electric-cyan/10 text-xs font-mono text-electric-cyan">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold tracking-wide text-white">{title}</h2>
                    <p className="mt-1 text-xs leading-relaxed text-muted-silver">{description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && <ArrowDown className="mx-auto my-1 h-4 w-4 text-electric-cyan/50" />}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-surface rounded-2xl p-6">
            <div className="flex items-center gap-3 text-electric-cyan"><Sigma className="h-5 w-5" /><h2 className="font-bold">Index formulas</h2></div>
            <ul className="mt-4 space-y-3 text-xs leading-relaxed text-muted-silver">
              <li><strong className="text-white">Comparable fare:</strong> base fare + UDF + ASF + GST + mandatory YQ surcharge.</li>
              <li><strong className="text-white">Route × horizon (Jevons):</strong> 100 × exp(mean[ln(current fare ÷ base fare)]).</li>
              <li><strong className="text-white">National Young / Modified Laspeyres:</strong> sum(route index × route weight) ÷ sum(observed route weights).</li>
              <li><strong className="text-white">Directional markets:</strong> A→B and B→A are separate route series.</li>
              <li><strong className="text-white">Missing fares:</strong> remain missing; no index-value imputation is applied.</li>
            </ul>
          </div>
          <div className="glass-surface rounded-2xl p-6">
            <div className="flex items-center gap-3 text-electric-cyan"><ShieldCheck className="h-5 w-5" /><h2 className="font-bold">Comparability &amp; anomaly rules</h2></div>
            <ul className="mt-4 space-y-3 text-xs leading-relaxed text-muted-silver">
              <li><strong className="text-white">Excluded from fare:</strong> convenience fees, optional baggage, seat selection, meals, insurance and conditional promotions.</li>
              <li><strong className="text-white">Component check:</strong> a full breakdown must reconcile to the displayed total (with or without convenience fee); mismatches are disqualified.</li>
              <li><strong className="text-white">Deduplication:</strong> matches origin/destination, airline, flight, travel date, departure time, horizon, cabin and fare family; direct airline sources outrank OTAs, then the lowest fare wins within a tier.</li>
              <li><strong className="text-white">Tukey screen:</strong> the prototype uses a 1.5 × IQR upper fence; elevated fares below 3.5 × the cell median remain possible market surges, not automatic exclusions.</li>
              <li><strong className="text-white">Small cells:</strong> outlier screening is skipped when fewer than four positive fares are available.</li>
            </ul>
          </div>
          <div className="glass-surface rounded-2xl p-6">
            <div className="flex items-center gap-3 text-electric-cyan"><ShieldCheck className="h-5 w-5" /><h2 className="font-bold">Weights, validation &amp; auditability</h2></div>
            <p className="mt-4 text-xs leading-relaxed text-muted-silver">
              The framework specifies DGCA passenger-volume reference weights. Values bundled with this synthetic demo are not official
              DGCA weights. Validation compares matched dates and reports MAPE, RMSE, bias, correlation and directional accuracy when
              available; the prototype can emit descriptive metrics from three matched pairs, while the research validation guardrail
              calls for at least 15 pairs before making a confidence claim. Provenance preserves LIVE, HISTORICAL or SYNTHETIC mode and
              traces records back to their raw payload hash.
            </p>
          </div>
          <div className="glass-surface rounded-2xl p-6">
            <div className="flex items-center gap-3 text-electric-cyan"><BookOpen className="h-5 w-5" /><h2 className="font-bold">Scope &amp; disclosure</h2></div>
            <p className="mt-4 text-xs leading-relaxed text-muted-silver">
              Synthetic composite-horizon weights, imputation and automated live scraping are not presented as active methodology here.
              The reference baseline is synthetic demo data—not official DGCA or MoSPI airfare microdata—and prototype metrics do not
              establish production accuracy.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

import { Link } from 'react-router-dom'

const examples = [
  { title: 'List exactly the 1,312 seeded signal definitions', code: 'GET /api/v1/signals/catalog/seed' },
  { title: 'List the full live catalog, including grouped source signals and evaluated additions', code: 'GET /api/v1/signals/catalog?limit=1500&offset=0' },
  { title: 'Continue through the live catalog', code: 'GET /api/v1/signals/catalog?limit=1500&offset=1500' },
  { title: 'Recent public source context', code: 'GET /api/v1/signals/recent?days=3&limit=12' },
  { title: 'Arkansas Medicaid prescriptions (partial observed counts)', code: 'GET /api/v1/signals/sources/sdud/latest?search=insulin&limit=50' },
  { title: 'Latest values for selected IDs', code: 'POST /api/v1/signals/latest\nContent-Type: application/json\n\n{"ids":["sig_...","sig_..."]}' },
  { title: 'One date or a range', code: 'POST /api/v1/signals/history\nContent-Type: application/json\n\n{"ids":["sig_..."],"start_date":"2025-01-01","end_date":"2025-12-31"}' },
  { title: 'Every recorded revision for point-in-time use', code: 'POST /api/v1/signals/history\nContent-Type: application/json\n\n{"ids":["sig_..."],"date":"2025-01-31","include_revisions":true}' },
  { title: 'Usable and recent-period coverage for the exact 1,312 seeded IDs', code: 'GET /api/v1/signals/coverage/summary' },
]

export default function ApiGuide() {
  return <div className="mx-auto max-w-4xl space-y-10 py-2">
    <div>
      <h1 className="font-serif text-5xl sm:text-6xl text-ink tracking-tight">PULSE signal API</h1>
      <p className="mt-4 text-lg sm:text-xl leading-relaxed text-slate-700">Use the same-origin <code className="inline-code">/api/v1</code> paths locally. A later domain can point to the same routes. Interactive OpenAPI documentation is available at <a className="font-semibold text-ink underline decoration-slate-400 underline-offset-4 hover:decoration-ink" href="/docs">/docs</a>.</p>
    </div>

    <section className="paper-card rounded-2xl p-6 sm:p-8">
      <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight text-ink">What a signal means</h2>
      <div className="pulse-doc-prose">
        <p>Each stable <code>sig_</code> ID identifies an origin, measure, cadence, geography, and entity. A value can be an observed public statistic, a news-derived score, or a predicted demand state. Read its <code>unit</code>, <code>state_definition</code>, source, observation date, and forecast horizon before interpreting it. A five-state demand value of 4 means the model’s highest relative category; it is not four units, four prescriptions, or an order recommendation.</p>
        <p>Use <code>/catalog/seed</code> to retrieve exactly the 1,312 checked-in definitions. Validated CMS refreshes may add stable IDs for newer drug outputs; source adapters also add stable IDs for values that need dimensions beyond a seed definition, such as NADAC classification and pricing unit or an FDA generic name. <code>/catalog</code> returns the larger live catalog in pages of at most 1,500; advance <code>offset</code> until a page has fewer rows than the requested limit. See <code>/freshness</code> for counts. Not every ID has a current usable observation. <code>/latest</code> returns validated values in <code>values</code>. Its <code>latest_recorded_values</code> array gives the absolute latest stored row for every requested ID, including rows flagged <code>usable: false</code>. The <code>unusable_recorded_values</code> array highlights archived rows for IDs that lack a usable value, with their real dates and <code>unusable_reason</code>. Do not treat those numbers as current demand or use them for purchasing. <code>missing_ids</code> means no usable value exists; <code>missing_details</code> gives the gap reason and last recorded period, or <code>unknown_id</code> for an unrecognized ID.</p>
        <p>Six legacy seed IDs collapse unrelated FDA events or NADAC pricing units. The API publishes separate NADAC IDs keyed by rate classification and pricing unit, and FDA shortage IDs keyed by the source generic name. An FDA shortage value of 1 means at least one listed presentation has status <code>Current</code> in that dated snapshot; 0 means the listed presentations were all <code>Resolved</code> or <code>To Be Discontinued</code>. It does not measure Arkansas stock or demand, and an absent record is unknown. The 18 ATC model rows used a zero-filled feature vector. The 20 archived news outputs have a local article-text Ridge shadow runner: it prefers captured titles and summaries from the latest closed UTC month, falling back to a current-month-to-date estimate targeted at month end when the closed month has no captured text. These are model estimates, not observed values. The fit has only ten matched training months, and its inputs differ from the archived full-text corpus, so all such rows stay explicitly unusable until a compatible input path passes chronological validation. The <code>/freshness</code> response includes the <code>news_model</code> run status, signal count, latest recorded target period, and reason it is not publishable. Conflicting values for one period carry <code>ambiguous: true</code>; callers should not choose one automatically. The evaluated annual Part D baseline is a separate projection. A five-state value is a relative category, not units to buy.</p>
        <p>The source-defined FDA enforcement IDs count drug recall reports in the 30 report-date days ending at the FDA feed’s update date: Class I, II, III, Not Yet Classified, and Total. These counts are dated published reports. They do not show whether a recall remains active, whether an Arkansas pharmacy has stock, or how much demand will change. The legacy <code>recall_active</code> ID remains unusable.</p>
      </div>
    </section>

    <section className="paper-card rounded-2xl p-6 sm:p-8">
      <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight text-ink">Weekly surveillance signals</h2>
      <div className="pulse-doc-prose">
        <p>The catalog includes source observations alongside the 1,312 seed definitions. Search <code>/catalog?search=fluview</code>, <code>/catalog?search=nndss</code>, or <code>/catalog?search=cdc_wval</code> to find their stable IDs, then request those IDs through <code>/latest</code> or <code>/history</code>. These observations provide disease context. They have not been validated as inputs to the saved drug-demand model and do not represent prescriptions or units to buy.</p>
      </div>
      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-left">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-800">
            <tr>
              <th className="py-3.5 px-4 text-sm sm:text-base font-semibold tracking-wide">Catalog names</th>
              <th className="py-3.5 px-4 text-sm sm:text-base font-semibold tracking-wide">Interpretation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            <tr>
              <td className="py-4 px-4 font-mono text-sm sm:text-[15px] font-semibold text-ink whitespace-nowrap align-top bg-slate-50/40">fluview_ili, fluview_wili</td>
              <td className="py-4 px-4 text-base sm:text-[16px] leading-relaxed text-slate-700">Weekly percentage of outpatient visits for influenza-like illness. Arkansas has ILI; weighted ILI is available for the U.S. only.</td>
            </tr>
            <tr>
              <td className="py-4 px-4 font-mono text-sm sm:text-[15px] font-semibold text-ink whitespace-nowrap align-top bg-slate-50/40">nndss_*</td>
              <td className="py-4 px-4 text-base sm:text-[16px] leading-relaxed text-slate-700">Provisional Arkansas and U.S. weekly disease reports. Current-week cases, previous-52-week maximum, current-year cumulative, and prior-year cumulative counts have separate IDs. An unpublished or suppressed cell is absent, not zero.</td>
            </tr>
            <tr>
              <td className="py-4 px-4 font-mono text-sm sm:text-[15px] font-semibold text-ink whitespace-nowrap align-top bg-slate-50/40">cdc_wval_site_mean_*</td>
              <td className="py-4 px-4 text-base sm:text-[16px] leading-relaxed text-slate-700">An unweighted mean of reporting wastewater sites for each pathogen and geography. Read <code className="inline-code">contributing_site_rows</code> in <code className="inline-code">data_quality</code> before interpreting coverage. This is not CDC’s official geographic median.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="pulse-doc-prose mt-4">
        <p>For each row, <code>observation_date</code> is the source week, <code>source_timestamp</code> is its release or update time, and <code>ingested_at</code> is when PULSE recorded it. The <code>/recent</code> route shows source context recorded within the requested window; it only includes weekly periods from the past 14 days and may include a revision to an earlier week.</p>
      </div>
    </section>

    <section className="space-y-5">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">Requests</h2>
      {examples.map(item => <div className="paper-card rounded-2xl p-6 sm:p-7" key={item.title}>
        <h3 className="text-lg sm:text-xl font-semibold text-ink">{item.title}</h3>
        <pre className="mt-3.5 overflow-x-auto rounded-xl bg-slate-900 p-4 sm:p-5 font-mono text-sm sm:text-base leading-relaxed text-slate-100 border border-slate-800">{item.code}</pre>
      </div>)}
    </section>

    <section className="paper-card rounded-2xl p-6 sm:p-8">
      <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight text-ink">History size</h2>
      <div className="pulse-doc-prose">
        <p>Latest accepts up to 1,500 IDs per request; split the full catalog into batches after paging through it. History accepts up to 100 IDs. If a history request spans more than 10,000 recorded source rows, it returns HTTP 413 without truncating values. Retry with fewer IDs or a shorter date range. The private browser trainer splits oversized ID batches automatically.</p>
        <p>Public signal requests have a per-client budget that refills over time. If the API returns HTTP 429, wait the number of seconds in its <code>Retry-After</code> header before retrying. This limit also applies to browser training history downloads.</p>
      </div>
    </section>

    <section className="paper-card rounded-2xl p-6 sm:p-8">
      <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight text-ink">Coverage and freshness</h2>
      <div className="pulse-doc-prose">
        <p><code>GET /api/v1/signals/freshness</code> returns catalog counts, the latest non-shadow observation period, <code>latest_model_target_date</code> for shadow targets, <code>failed_sources</code> for adapters whose most recent attempt failed, and the separate <code>news_model</code> status. <code>GET /api/v1/signals/coverage/summary</code> separates usable recorded coverage, recent source observations, and drug projections targeting the current year or later; it also groups IDs without a usable value by reason. A current-target projection may use an older source observation. Recent source observations mean within 14 days for weekly, 60 days for monthly, or 400 days for annual periods. These are display thresholds, not proof of upstream publication completeness. A failed adapter does not invalidate other verified source data; use each row’s status and timestamp. <code>GET /api/v1/signals/coverage</code> lists per-signal gaps and model target dates. <code>GET /api/v1/signals/demand/drugs</code> ranks stored drug demand states; <code>GET /api/v1/signals/news/recent?days=3</code> and <code>GET /api/v1/signals/sources/shortages/recent?days=3</code> return dated source context.</p>
        <p>News rows include <code>timestamp_kind</code>: GDELT dates are first seen by its feed, while FDA dates come from RSS <code>pubDate</code>. The news response also includes <code>source_checks</code> with each feed’s latest status, attempt time, last success time, and a sanitized <code>last_error_code</code> / <code>last_error_http_status</code> when a check fails. Raw upstream exception text is not returned; FDA fallback items remain visible when general news fails.</p>
        <p><code>GET /api/v1/signals/sources/nadac/latest</code> returns current NADAC acquisition-rate groups by classification and pricing unit. The same group metrics are available as catalog signal IDs and through <code>/latest</code> and <code>/history</code>. The four legacy catalog IDs combine unlike units and remain marked <code>identity_dimensions_collapsed</code> in coverage. The drug ranking uses a separately evaluated two-year persistence projection from the latest published Arkansas Medicare Part D claims. Its target year, source year, method, holdout accuracy, and four <code>state_thresholds_claims</code> accompany the rows. Those thresholds divide historical annual claim counts into five relative categories; they are not purchase quantities. Newer CMS drug outputs receive stable IDs during a successful evaluated baseline refresh; earlier periods may have no observations. The API never advances a source’s date or fills a missing value with a forecast.</p>
        <p>Catalog, drug-ranking, and SDUD product searches treat <code>%</code> and <code>_</code> as literal text. The public signal routes are read-only. Private sales and inventory files stay in the browser workspace and are not part of this API.</p>
      </div>
    </section>

    <div className="pt-2">
      <Link to="/signals" className="dark-pill inline-flex px-8 py-3.5 text-base font-semibold">Browse signals</Link>
    </div>
  </div>
}

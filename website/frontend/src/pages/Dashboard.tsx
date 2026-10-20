import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowUpRight, Brain, Check, FileSpreadsheet, Loader2, PackageCheck, Upload } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { apiFetch, login } from '../api'
import { getBrowserPlan, lockBrowserPlan, trainInBrowser, unlockBrowserPlan } from '../browserForecast'
import { privateStoreUnlocked } from '../privateStore'
import { Confetti, type ConfettiRef } from '../components/ui/confetti'
import { ProgressiveFluxLoader } from '../components/ui/progressive-flux-loader'

type PlanItem = { drug_name: string; on_hand_units: number; on_order_units?: number; expected_arrival_date?: string | null; incoming_eta_overdue?: boolean; incoming_counted_by_day_14?: boolean; as_of_date?: string; forecast_1d_units: number; forecast_7d_units: number; forecast_14d_units: number; days_until_stockout: number | null; minimum_buy_1d_units: number; minimum_buy_7d_units: number; minimum_buy_14d_units: number; recommended_order_units: number; inventory_status: string }
type Status = { ready: boolean; metrics?: { drugs_trained: number; history_start: string; history_end: string; signal_candidate_count: number; signal_feature_count: number; signal_selection_rule: string; planning_summary: { reorder_now: number; total_recommended_order_units: number } } }
type Signal = { signal_id: string; kind: 'demand' | 'news'; score: number; drugs: string[]; source: string; article?: { title: string; url: string; source: string; published_at: string; match_note: string } | null; demand_context?: { scope: string; method: string; points: { day: number; predicted_units: number; cumulative_units: number }[] } | null }
type RecentPublicSignal = { id: string; signal_id: string; value: number; unit: string | null; observation_date: string; ingested_at: string }

const stages = ['Checking your files', 'Finding signals for each medication', 'Training demand models', 'Building your replenishment plan']

export default function Dashboard() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status | null>(null)
  const [items, setItems] = useState<PlanItem[]>([])
  const [signals, setSignals] = useState<Signal[]>([])
  const [recentNews, setRecentNews] = useState<Array<{ title: string; url: string; source: string; published_at: string; timestamp_kind: 'gdelt_first_seen' | 'rss_pub_date' }>>([])
  const [recentPublicSignals, setRecentPublicSignals] = useState<RecentPublicSignal[]>([])
  const [salesFile, setSalesFile] = useState<File | null>(null)
  const [inventoryFile, setInventoryFile] = useState<File | null>(null)
  const [fileSelectionGeneration, setFileSelectionGeneration] = useState(0)
  const [signalYears, setSignalYears] = useState(2)
  const [planSignalYears, setPlanSignalYears] = useState(0)
  const [busy, setBusy] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const confettiRef = useRef<ConfettiRef>(null)
  const [stage, setStage] = useState(0)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [initialWait, setInitialWait] = useState(true)
  const [username, setUsername] = useState('')
  const [locked, setLocked] = useState(false)
  const [illustrative, setIllustrative] = useState(false)
  const illustrativeRef = useRef(false)
  const [unlockPassword, setUnlockPassword] = useState('')
  const unlockingRef = useRef(false)

  async function load(accountUsername: string) {
    const plan = getBrowserPlan(accountUsername)
    if (!plan && illustrativeRef.current) return
    illustrativeRef.current = false
    setIllustrative(false)
    if (plan && plan.model !== 'browser_xgboost_direct_14d_v6') {
      setStatus({ ready: false })
      setItems([])
      setPlanSignalYears(0)
      setError('This saved plan used older training rules. Upload current sales and inventory histories with matching last dates to recalculate it. Include stockout_flag in sales if you track stockouts.')
      return
    }
    setStatus(plan ? { ready: true, metrics: { drugs_trained: plan.items.length, history_start: plan.history_start,
      history_end: plan.history_end, signal_candidate_count: 1312,
      signal_feature_count: plan.per_drug.reduce((sum, row) => sum + row.signals_used.length, 0) / plan.per_drug.length,
      signal_selection_rule: 'top_5_point_in_time_eligible_with_holdout_gate', planning_summary: {
        reorder_now: plan.items.filter(item => item.inventory_status === 'reorder_now').length,
        total_recommended_order_units: plan.items.reduce((sum, item) => sum + item.recommended_order_units, 0),
      } } } : { ready: false })
    setItems(plan?.items ?? [])
    setPlanSignalYears(plan?.signal_years ?? 0)
    setSignals([])
    if (plan) {
      apiFetch('/v1/signals/news/recent?days=3').then(result => setRecentNews(result.articles)).catch(() => setRecentNews([]))
      apiFetch('/v1/signals/recent?days=3&limit=4').then(result => setRecentPublicSignals(result.signals)).catch(() => setRecentPublicSignals([]))
    }
  }

  useEffect(() => {
    let active = true
    async function checkAccount() {
      try {
        const user = await apiFetch('/auth/me')
        if (!active) return
        if (unlockingRef.current) return
        setUsername(user.username)
        if (!privateStoreUnlocked(user.username)) {
          lockBrowserPlan()
          setStatus(null)
          setItems([])
          setLocked(true)
          return
        }
        setLocked(false)
        await load(user.username)
      } catch {
        if (active && !unlockingRef.current) { lockBrowserPlan(); navigate('/') }
      }
    }
    checkAccount()
    const timer = setTimeout(() => setInitialWait(false), 500)
    window.addEventListener('focus', checkAccount)
    const onPrivateLock = () => {
      setCelebrate(false)
      illustrativeRef.current = false
      setIllustrative(false)
      setStatus(null)
      setItems([])
      setSalesFile(null)
      setInventoryFile(null)
      setFileSelectionGeneration(value => value + 1)
      setUnlockPassword('')
      setSignals([])
      setRecentNews([])
      setRecentPublicSignals([])
      setLocked(true)
    }
    window.addEventListener('pulse-private-locked', onPrivateLock)
    return () => {
      active = false
      clearTimeout(timer)
      window.removeEventListener('focus', checkAccount)
      window.removeEventListener('pulse-private-locked', onPrivateLock)
    }
  }, [navigate])

  async function unlock(event: FormEvent) {
    event.preventDefault()
    if (unlockingRef.current) return
    setError('')
    unlockingRef.current = true
    try {
      await login(username, unlockPassword)
      await unlockBrowserPlan(username, unlockPassword)
      const user = await apiFetch('/auth/me')
      if (user.username !== username) {
        lockBrowserPlan()
        throw new Error('The signed-in account changed while unlocking. Try again.')
      }
      setLocked(false)
      await load(username)
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not unlock workspace') }
    finally { setUnlockPassword(''); unlockingRef.current = false }
  }

  useEffect(() => {
    if (!busy) return
    const timer = window.setInterval(() => setStage(current => Math.min(current + 1, stages.length - 1)), 8000)
    return () => window.clearInterval(timer)
  }, [busy])

  useEffect(() => {
    if (!celebrate || !status?.ready || busy) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setCelebrate(false); return }
    const frame = window.requestAnimationFrame(() => confettiRef.current?.fire({
      particleCount: 90, spread: 75, startVelocity: 35, origin: { y: .38 },
      colors: ['#126F73', '#B4EAF5', '#EFC77B', '#FFFFFF'], disableForReducedMotion: true,
    }))
    const timeout = window.setTimeout(() => setCelebrate(false), 5000)
    return () => { window.cancelAnimationFrame(frame); window.clearTimeout(timeout) }
  }, [celebrate, status?.ready, busy])

  async function train(event: FormEvent) {
    event.preventDefault()
    if (!salesFile || !inventoryFile) { setError('Choose both a sales history and an inventory history CSV.'); return }
    const selectedSales = salesFile
    const selectedInventory = inventoryFile
    illustrativeRef.current = false
    setIllustrative(false)
    setSalesFile(null)
    setInventoryFile(null)
    setFileSelectionGeneration(value => value + 1)
    setBusy(true); setCelebrate(false); setError(''); setStage(0)
    try {
      await trainInBrowser(selectedSales, selectedInventory, signalYears, setProgress)
      const user = await apiFetch('/auth/me')
      if (user.username !== username) {
        lockBrowserPlan()
        setLocked(true)
        throw new Error('The signed-in account changed during training. Unlock this workspace again.')
      }
      await load(username)
      setCelebrate(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Training failed')
    } finally { setBusy(false) }
  }

  async function showExample() {
    setError('')
    try {
      const response = await fetch('/illustrative-plan.json')
      if (!response.ok) throw new Error('Could not load the synthetic example')
      const plan = await response.json()
      if (!plan.illustrative || !Array.isArray(plan.items) || plan.items.length !== 24) throw new Error('Synthetic example is incomplete')
      illustrativeRef.current = true
      setIllustrative(true)
      setItems(plan.items)
      setPlanSignalYears(0)
      setStatus({ ready: true, metrics: {
        drugs_trained: 0, history_start: plan.history_start, history_end: plan.history_end,
        signal_candidate_count: 0, signal_feature_count: 0, signal_selection_rule: 'synthetic_example',
        planning_summary: { reorder_now: plan.items.filter((item: PlanItem) => item.minimum_buy_7d_units > 0).length,
          total_recommended_order_units: plan.items.reduce((sum: number, item: PlanItem) => sum + item.recommended_order_units, 0) },
      } })
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not load the synthetic example') }
  }

  if (locked) return <div className="mx-auto max-w-lg paper-card rounded-2xl p-7"><h1 className="font-serif text-4xl text-ink">Unlock your workspace.</h1><p className="mt-3 text-sm text-slate-600">Your saved plan is encrypted on this device. Enter your account password to unlock it or train a new plan.</p><form onSubmit={unlock} className="mt-5 space-y-4"><label className="block text-sm font-medium">Password<input type="password" autoComplete="current-password" value={unlockPassword} onChange={event => setUnlockPassword(event.target.value)} required className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>{error && <p role="alert" className="text-sm text-risk-high">{error}</p>}<button className="dark-pill px-6 py-3 text-sm">Unlock plan</button></form></div>
  if (initialWait) return <Loading />
  if (error && !status) return <Notice text={error} />
  if (!status) return <Loading />
  if (busy) return <Training stage={stage} progress={progress} />
  if (!status.ready) return <UploadPanel key={fileSelectionGeneration} salesFile={salesFile} inventoryFile={inventoryFile} signalYears={signalYears} onSignalYears={setSignalYears} onSales={setSalesFile} onInventory={setInventoryFile} onSubmit={train} onPreview={showExample} error={error} />

  const urgent = items.filter(item => item.recommended_order_units > 0)
  const today = new Date()
  const todayDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const salesEndDay = Date.parse(`${status.metrics?.history_end ?? ''}T00:00:00Z`)
  const daysSinceSales = Math.round((todayDay - salesEndDay) / 86_400_000)
  const inventoryAsOf = [...new Set(items.map(item => item.as_of_date).filter(Boolean))].sort()
  const staleInventory = items.some(item => {
    const asOfDay = Date.parse(`${item.as_of_date ?? ''}T00:00:00Z`)
    const daysSinceInventory = Math.round((todayDay - asOfDay) / 86_400_000)
    return !Number.isFinite(daysSinceInventory) || daysSinceInventory < 0 || daysSinceInventory > 1
  })
  const stalePlan = !Number.isFinite(daysSinceSales) || daysSinceSales < 0 || daysSinceSales > 1 || staleInventory
  const noEligiblePublicSignals = planSignalYears > 0 && (status.metrics?.signal_feature_count ?? 0) === 0
  const inventoryLabel = inventoryAsOf.length === 0 ? 'an unknown date'
    : inventoryAsOf.length === 1 ? inventoryAsOf[0]
    : `${inventoryAsOf[0]} to ${inventoryAsOf[inventoryAsOf.length - 1]}`

  return <div className="space-y-6">
    {celebrate && <Confetti ref={confettiRef} manualstart className="pointer-events-none fixed inset-0 z-[100] h-full w-full" aria-hidden="true" />}
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Your workspace</p><h1 className="mt-2 font-serif text-5xl font-normal text-ink">Demand & inventory</h1><p className="mt-2 text-sm text-slate-500">History {status.metrics?.history_start} to {status.metrics?.history_end}</p></div><button onClick={() => { illustrativeRef.current = false; setIllustrative(false); setStatus({ ready: false }); setError('') }} className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-ink shadow-sm transition hover:bg-slate-100">{illustrative ? 'Train with your files' : 'Train with new files'}</button></div>
    {illustrative && <div role="note" className="rounded-xl border border-primary-200 bg-primary-50 p-5 text-sm text-ink"><p className="font-semibold">Illustrative synthetic example</p><p className="mt-1">Based on the 24-medication demo CSVs, dated {status.metrics?.history_end}. These projections were constructed for the demo; no model was trained and no purchase is recommended.</p></div>}
    {!illustrative && stalePlan && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950"><p className="font-semibold">Historical plan: update your files before ordering.</p><p className="mt-1">Sales end on {status.metrics?.history_end}; recorded inventory is from {inventoryLabel}. Forecast days and quantities below are anchored to those dates, not today.</p></div>}
    {noEligiblePublicSignals && <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950"><p className="font-semibold">No public signals were eligible for this training run.</p><p className="mt-1">You selected {planSignalYears} {planSignalYears === 1 ? 'year' : 'years'} of signal history, but none passed both point-in-time availability and the holdout improvement check for these sales records. The forecast used your sales and inventory histories; the latest inventory balance still drives the order plan. A longer lookback or later source releases may change signal eligibility.</p></div>}
    <div className="grid gap-4 sm:grid-cols-3"><Metric icon={<PackageCheck />} label="Medications" value={items.length} /><Metric icon={<AlertTriangle />} label={stalePlan ? "Historical gaps within 7 days" : "Need stock within 7 days"} value={items.filter(item => item.minimum_buy_7d_units > 0).length} /><Metric icon={<ArrowUpRight />} label="Suggested orders to review" value={urgent.length} /></div>
    {!illustrative && <section className="rounded-2xl border border-primary-100 bg-primary-50/40 p-6 shadow-sm sm:p-8"><div className="mb-6 flex items-start gap-3"><span className="rounded-xl bg-primary-100 p-2 text-primary-700"><Brain className="h-6 w-6" /></span><div><h2 className="text-xl font-semibold text-slate-900">Recent news & public signals</h2><p className="mt-1 text-sm text-slate-600">Dated source context from the public API. Articles are topic context, not attribution for your forecast.</p></div></div>{signals.length ? <div className="grid gap-4 md:grid-cols-2">{signals.slice(0, 4).map(signal => <SignalCard key={signal.signal_id} signal={signal} />)}</div> : recentNews.length || recentPublicSignals.length ? <div className="grid gap-4 md:grid-cols-2">{recentPublicSignals.slice(0, 2).map(signal => <RecentSignalCard key={signal.id} signal={signal} />)}{recentNews.slice(0, 4 - Math.min(2, recentPublicSignals.length)).map(article => <a key={article.url} href={article.url} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-xs text-slate-500">{article.source} · {article.timestamp_kind === 'gdelt_first_seen' ? 'first seen by GDELT' : 'FDA feed date'} {new Date(article.published_at).toLocaleDateString()}</p><p className="mt-2 font-medium text-ink">{article.title}</p></a>)}</div> : <p className="rounded-xl bg-white p-6 text-sm text-slate-600">No verified update was recorded in the last three days. Public catalog signals with unknown historical availability are excluded from your model.</p>}<a href="/signals" className="mt-5 inline-block text-sm font-medium text-primary-800 underline">Browse all public signals</a></section>}
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="border-b border-slate-200 p-5"><h2 className="font-semibold text-slate-900">{illustrative ? "Synthetic restock example" : stalePlan ? "Historical replenishment scenario" : "Restock priorities"}</h2><p className="mt-1 text-sm text-slate-500">Minimum units cover each horizon, including any gap before an incoming order arrives. Incoming stock is counted only after its dated arrival; orders without an ETA are shown but excluded.</p></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-4 py-3 text-left">Drug</th><th className="px-4 py-3 text-right">On hand</th><th className="px-4 py-3 text-right">Incoming</th><th className="px-4 py-3 text-right">Demand 1d / 7d / 14d</th><th className="px-4 py-3 text-right">Stockout</th><th className="px-4 py-3 text-right">{stalePlan ? "Scenario gap 1d / 7d / 14d" : "Buy 1d / 7d / 14d"}</th><th className="px-4 py-3 text-right">{stalePlan ? "Scenario order" : "Target order"}</th></tr></thead><tbody className="divide-y divide-slate-100">{urgent.map(item => <tr key={item.drug_name}><td className="px-4 py-3 font-medium text-slate-900">{item.drug_name}</td><td className="px-4 py-3 text-right">{item.on_hand_units}{item.as_of_date && <span className="block text-xs text-slate-500">as of {item.as_of_date}</span>}</td><td className="px-4 py-3 text-right">{(item.on_order_units ?? 0) > 0 ? <>{item.on_order_units}<span className="block text-xs text-slate-500">{item.incoming_eta_overdue ? `ETA ${item.expected_arrival_date} overdue; excluded` : item.expected_arrival_date ? `ETA ${item.expected_arrival_date}` : "ETA unknown; excluded"}</span></> : "None"}</td><td className="px-4 py-3 text-right">{Math.ceil(item.forecast_1d_units)} / {Math.ceil(item.forecast_7d_units)} / {Math.ceil(item.forecast_14d_units)}</td><td className="px-4 py-3 text-right">{item.days_until_stockout ? `Day ${item.days_until_stockout}` : 'Beyond 14 days'}</td><td className="px-4 py-3 text-right font-medium text-risk-high">{item.minimum_buy_1d_units} / {item.minimum_buy_7d_units} / {item.minimum_buy_14d_units}</td><td className="px-4 py-3 text-right font-semibold">{item.recommended_order_units}</td></tr>)}</tbody></table>{!urgent.length && <p className="p-8 text-center text-sm text-slate-500">{stalePlan ? "No medications exceeded modeled coverage in this historical scenario." : "No medications currently need a purchase based on this forecast."}</p>}</div></section>
    {!illustrative && <p className="text-xs text-slate-500">XGBoost trained in this browser using your sales and inventory files; private CSVs were not uploaded. The model predicts the next 14-day total directly; 1-day and 7-day figures are allocations. An average of {(status.metrics?.signal_feature_count ?? 0).toFixed(1)} public signals per drug passed point-in-time availability and holdout improvement checks. The saved plan is encrypted on this device and should be checked against pharmacy practice.</p>}
  </div>
}

function UploadPanel({ salesFile, inventoryFile, signalYears, onSignalYears, onSales, onInventory, onSubmit, onPreview, error }: { salesFile: File | null; inventoryFile: File | null; signalYears: number; onSignalYears: (years: number) => void; onSales: (file: File | null) => void; onInventory: (file: File | null) => void; onSubmit: (event: FormEvent) => void; onPreview: () => void; error: string }) {
  return <div className="mx-auto max-w-4xl space-y-8"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Start with your data</p><h1 className="mt-3 font-serif text-5xl font-normal text-ink">Build your demand plan.</h1><p className="mt-4 max-w-2xl text-slate-600">Select local sales and inventory files. XGBoost trains in this browser; your private CSVs stay on this device.</p></div><form onSubmit={onSubmit} className="grid gap-5 md:grid-cols-2"><FileCard title="Past sales" description="CSV columns: date (YYYY-MM-DD), drug_name, units_sold. Include at least 130 consecutive days per drug, with 0 for no-sales days. Optional stockout_flag (0 or 1) marks censored sales days; affected training targets are excluded." file={salesFile} onChange={onSales} /><FileCard title="Inventory history" description="CSV columns: date (YYYY-MM-DD), drug_name, on_hand_units. Cover at least 130 sales days per drug with a same-day or previous-day stock snapshot. The latest date must match the last sales date. Optional: on_order_units and expected_arrival_date (YYYY-MM-DD). Unknown arrival dates are excluded." file={inventoryFile} onChange={onInventory} /><div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-5"><label htmlFor="signal-years" className="block text-sm font-semibold text-ink">Public signal history</label><p className="mt-1 text-xs text-slate-500">History is measured back from the last date in your sales file. Longer history downloads more public records and uses more memory and compute. Only values with a verified source timestamp available before the training date are used; older catalog rows may be excluded.</p><select id="signal-years" value={signalYears} onChange={event => onSignalYears(Number(event.target.value))} className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option value={0}>Sales and inventory only</option><option value={1}>Past 1 year</option><option value={2}>Past 2 years</option><option value={3}>Past 3 years</option></select></div><div className="md:col-span-2">{error && <p role="alert" className="mb-3 text-sm text-risk-high">{error}</p>}<button className="dark-pill flex w-full items-center justify-center gap-2 px-5 py-3.5 text-sm font-medium"><Brain className="h-4 w-4" /> Train on this device</button><button type="button" onClick={onPreview} className="mt-3 w-full rounded-full border border-primary-200 bg-white px-5 py-3 text-sm font-medium text-ink transition hover:bg-primary-50">View synthetic example</button><p className="mt-3 text-xs text-slate-500">The model predicts a direct 14-day total. Keep this tab open while it trains.</p></div></form><div className="rounded-xl border border-slate-200 bg-white p-6"><h2 className="font-semibold text-slate-900">Expected file columns</h2><div className="mt-3 grid gap-4 sm:grid-cols-2 text-sm text-slate-600"><p><span className="font-medium text-ink">Sales:</span> date, drug_name, units_sold; optional stockout_flag (0 or 1)</p><p><span className="font-medium text-ink">Inventory:</span> date, drug_name, on_hand_units, covering at least 130 sales days; optional on_order_units and expected_arrival_date</p></div></div></div>
}

function FileCard({ title, description, file, onChange }: { title: string; description: string; file: File | null; onChange: (file: File | null) => void }) {
  return <label className="cursor-pointer rounded-xl border border-dashed border-slate-300 bg-white p-6 hover:border-primary-500"><span className="flex items-center gap-2 font-semibold text-slate-900"><FileSpreadsheet className="h-5 w-5 text-primary-600" />{title}</span><span className="mt-2 block text-sm text-slate-500">{description}</span><span className="mt-4 flex items-center gap-2 text-sm font-medium text-primary-700"><Upload className="h-4 w-4" />{file?.name ?? 'Choose CSV file'}</span><input type="file" accept=".csv,text/csv" className="sr-only" onChange={event => onChange(event.target.files?.[0] ?? null)} /></label>
}

function Training({ stage, progress }: { stage: number; progress: string }) {
  const message = progress || 'Preparing local files and public signals'
  return <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-50"><Loader2 className="h-7 w-7 animate-spin text-primary-600" /></div><h1 className="mt-5 font-serif text-4xl text-ink">Training on your device.</h1><p className="mt-2 text-sm text-slate-500">This can take several minutes for a large history.</p><ProgressiveFluxLoader phases={[{ at: 0, label: message }]} ariaLabel="Training on this device" className="mt-6 gap-3" barClassName="h-3" textClassName="text-base leading-snug text-primary-800 sm:text-lg" /><ol className="mt-7 space-y-3 text-left">{stages.map((label, index) => <li key={label} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${index === stage ? 'bg-primary-50 font-medium text-primary-800' : 'text-slate-500'}`}>{index < stage ? <Check className="h-4 w-4 text-risk-low" /> : index === stage ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="h-4 w-4 rounded-full border border-slate-300" />}{label}</li>)}</ol></div>
}

function SignalCard({ signal }: { signal: Signal }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><p className="text-base font-semibold text-slate-900">{signal.signal_id.replace(/_/g, ' ')}</p><span className="shrink-0 text-xs font-medium text-primary-700">{(signal.score * 100).toFixed(0)}% correlation</span></div><p className="mt-2 text-sm text-slate-500">Relevant to {signal.drugs.slice(0, 2).join(', ')}{signal.drugs.length > 2 ? ` +${signal.drugs.length - 2}` : ''}</p>{signal.kind === 'demand' && signal.demand_context && <div className="mt-4"><div className="h-32"><ResponsiveContainer width="100%" height="100%"><LineChart data={signal.demand_context.points}><XAxis dataKey="day" hide /><YAxis hide /><Tooltip labelFormatter={day => `Day ${day}`} /><Line type="monotone" dataKey="cumulative_units" name="Cumulative units" stroke="#3E6548" dot={false} strokeWidth={2} /></LineChart></ResponsiveContainer></div><p className="text-xs text-slate-500">14-day demand across all your medications</p></div>}{signal.kind === 'news' && signal.article && <p className="mt-4 text-base font-medium leading-snug text-slate-800">{signal.article.title}</p>}</div>
}

function RecentSignalCard({ signal }: { signal: RecentPublicSignal }) {
  const value = signal.unit === 'share'
    ? `${(signal.value * 100).toFixed(1)}%`
    : `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(signal.value)} ${signal.unit?.replace(/_/g, ' ') ?? ''}`
  return <div className="rounded-xl border border-slate-200 bg-white p-5">
    <p className="text-xs text-slate-500">Public signal · recorded {new Date(signal.ingested_at).toLocaleDateString()}</p>
    <p className="mt-2 font-medium capitalize text-ink">{signal.signal_id.replace(/_/g, ' ')}</p>
    <p className="mt-2 text-xl font-semibold text-ink">{value}</p>
    <p className="mt-2 text-xs text-slate-600">Observed period: {signal.observation_date}</p>
  </div>
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5"><span className="text-primary-600">{icon}</span><div><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{value}</p></div></div>
}

function Loading() { return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div> }
function Notice({ text }: { text: string }) { return <p role="alert" className="rounded-lg bg-red-50 p-5 text-risk-high">{text}</p> }

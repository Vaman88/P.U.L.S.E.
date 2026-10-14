import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownToLine, ArrowUpRight, ChevronRight, Search, Package, AlertTriangle, CalendarDays, RotateCcw } from 'lucide-react'
import RiskOverview from './Dashboard'
import { SAMPLE_PLANS, STATUS_LABEL, PLAN_AS_OF, HORIZON_DATES, fmtLong, fmtShort, fmtUnits, explain, type MedicinePlan } from '../demo/planningData'
import '../planning.css'

export default function PlanningDashboard({ demoOnly = false }: { demoOnly?: boolean }) {
  const [view, setView] = useState<'demo' | 'live'>(() => demoOnly ? 'demo' : localStorage.getItem('pulse-dashboard-view') === 'live' ? 'live' : 'demo')
  const [selectedId, setSelectedId] = useState(SAMPLE_PLANS[0].id)
  const [horizon, setHorizon] = useState(14)
  const [search, setSearch] = useState('')
  const [onlyAttention, setOnlyAttention] = useState(false)
  const selected = SAMPLE_PLANS.find(plan => plan.id === selectedId)!
  const filtered = SAMPLE_PLANS.filter(plan => `${plan.name} ${plan.strength}`.toLowerCase().includes(search.toLowerCase()) && (!onlyAttention || plan.suggested > 0))
  const urgent = SAMPLE_PLANS.filter(plan => plan.minimum7 > 0)
  const orders = SAMPLE_PLANS.reduce((sum, plan) => sum + plan.suggested, 0)
  function switchView(value: 'demo' | 'live') { setView(value); localStorage.setItem('pulse-dashboard-view', value) }
  function exportPlan() {
    const rows = [['drug_name','strength','on_hand_units','demand_14d_units','minimum_buy_7d_units','suggested_order_units','sample_as_of_date'], ...SAMPLE_PLANS.map(plan => [plan.name,plan.strength,plan.onHand,plan.demand14,plan.minimum7,plan.suggested,PLAN_AS_OF])]
    const blob = new Blob([rows.map(row => row.join(',')).join('\n')], { type:'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob), link = document.createElement('a')
    link.href = url; link.download = 'pulse-illustrative-plan.csv'; link.click(); URL.revokeObjectURL(url)
  }
  return <div className="planning-workspace">
    {!demoOnly && <div className="workspace-view-tabs" role="group" aria-label="Dashboard data source"><button type="button" aria-pressed={view === 'demo'} onClick={() => switchView('demo')}>Test demo</button><button type="button" aria-pressed={view === 'live'} onClick={() => switchView('live')}>My workspace</button><span>{view === 'demo' ? 'Illustrative data' : 'Your existing model results'}</span></div>}
    {view === 'live' ? <RiskOverview /> : <>
      <div className="planning-page-heading"><div><p className="plan-eyebrow">YOUR NEXT 14 DAYS, IN VIEW</p><h1>Demand &amp; inventory</h1><p>A clearer plan for the medicines on your shelves.</p></div><button type="button" className="plan-button secondary" onClick={exportPlan}><ArrowDownToLine size={16} />Export sample plan</button></div>
      <div className="demo-disclosure" role="note"><span className="demo-tag">TEST DEMO</span><p>Sample data from the PULSE repository. These quantities are illustrative, not forecasts for your clinic.</p><span className="demo-as-of">As of {fmtShort(PLAN_AS_OF)}, 2026</span></div>
      <div className="plan-stat-strip"><div><Package size={20} /><span>Medications in view<strong>{SAMPLE_PLANS.length}</strong></span></div><div><AlertTriangle size={20} /><span>Need stock within 7 days<strong>{urgent.length}</strong></span></div><div><ArrowUpRight size={20} /><span>Suggested sample order<strong>{fmtUnits(orders)} <small>units</small></strong></span></div><div><CalendarDays size={20} /><span>Planning window<strong>14 <small>days</small></strong></span></div></div>
      <div className="plan-workbench">
        <section className="plan-medications bg-surface" aria-labelledby="medication-heading">
          <div className="plan-section-heading"><div><p className="plan-eyebrow">01 / STOCK REVIEW</p><h2 id="medication-heading">Your medication list</h2></div><span>{filtered.length} of {SAMPLE_PLANS.length}</span></div>
          <div className="plan-table-controls"><label className="plan-search"><Search size={16} /><span className="sr-only">Search sample medications</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Find a medication" /></label><button type="button" className={`attention-filter ${onlyAttention ? 'is-selected' : ''}`} aria-pressed={onlyAttention} onClick={() => setOnlyAttention(value => !value)}>Needs attention</button></div>
          <div className="plan-table-scroll" role="region" aria-label="Sample medication planning table" tabIndex={0}><table className="plan-table"><thead><tr><th>Medication</th><th>On hand</th><th>14-day demand</th><th>Order</th><th>Status</th></tr></thead><tbody>{filtered.map(plan => <tr key={plan.id} className={selectedId === plan.id ? 'is-selected' : ''}><td><button type="button" className="medicine-select" aria-pressed={selectedId === plan.id} onClick={() => setSelectedId(plan.id)}><span className={`medicine-swatch swatch-${plan.id}`} /><span><strong>{plan.name}</strong><small>{plan.strength} · {plan.form}</small></span><ChevronRight size={14} /></button></td><td>{fmtUnits(plan.onHand)}</td><td>{fmtUnits(plan.demand14)}</td><td><strong>{plan.suggested ? fmtUnits(plan.suggested) : '—'}</strong></td><td><span className={`plan-status ${plan.status}`}>{STATUS_LABEL[plan.status]}</span></td></tr>)}</tbody></table>{!filtered.length && <p className="plan-empty" role="status">No medications match. Try another name or clear the attention filter.</p>}</div>
          <div className="plan-table-footer"><span>Incoming stock counts after its dated arrival.</span><button type="button" onClick={() => { setSearch('');setOnlyAttention(false);setSelectedId(SAMPLE_PLANS[0].id);setHorizon(14) }}><RotateCcw size={13} />Reset demo</button></div>
        </section>
        <aside className="plan-order-summary bg-surface"><p className="plan-eyebrow">02 / NEXT ORDER</p><h2>Review before you order.</h2><p>Prioritize the gap, then account for deliveries and a safety buffer.</p><div className="order-priority">{urgent.map(plan => <button type="button" key={plan.id} onClick={() => setSelectedId(plan.id)}><span><strong>{plan.name}</strong><small>Stock gap on day {plan.stockoutDay}</small></span><b>{plan.minimum7}<small>minimum units / 7d</small></b></button>)}</div><div className="order-note"><Package size={18} /><p>{SAMPLE_PLANS.filter(plan => plan.incoming).length} sample deliveries are expected within the planning window.</p></div>{!demoOnly ? <button type="button" className="plan-button" onClick={() => switchView('live')}>Open my workspace <ArrowUpRight size={15} /></button> : <Link className="plan-button" to="/login">Sign in to your workspace <ArrowUpRight size={15} /></Link>}</aside>
      </div>
      <section className="plan-analysis bg-surface" aria-labelledby="projection-title"><div className="plan-section-heading"><div><p className="plan-eyebrow">03 / MEDICATION DETAIL</p><h2 id="projection-title">{selected.name} <span>{selected.strength}</span></h2><p>How stock coverage changes across the sample plan.</p></div><div className="horizon-selector" role="group" aria-label="Projection horizon">{[1,7,14].map(value => <button key={value} type="button" aria-pressed={horizon === value} onClick={() => setHorizon(value)}>{value} {value === 1 ? 'day' : 'days'}</button>)}</div></div><div className="plan-analysis-grid"><StockChart plan={selected} horizon={horizon} /><div className="plan-explanation"><span className={`plan-status ${selected.status}`}>{STATUS_LABEL[selected.status]}</span><h3>{selected.suggested > 0 ? `${selected.suggested} units suggested` : 'Covered for this window'}</h3><ul>{explain(selected).map(text => <li key={text}>{text}</li>)}</ul><p className="plan-model-note">This demo uses the repository’s deterministic sample arithmetic. It does not train a model or place an order.</p></div></div></section>
      <footer className="plan-page-footer"><span>Planning window: {fmtLong(HORIZON_DATES[0])} – {fmtLong(HORIZON_DATES[13])}</span><span>Pharmacy staff review every decision.</span></footer>
    </>}
  </div>
}

function StockChart({ plan, horizon }: { plan:MedicinePlan; horizon:number }) {
  const [scrubDay, setScrubDay] = useState(plan.creditedFromDay ?? 0)
  const day = Math.min(scrubDay, horizon)
  const dayLabel = Number(day.toFixed(1))
  const lowerDay = Math.floor(day)
  const lowerRemaining = lowerDay === 0 ? plan.onHand : plan.days[lowerDay - 1].remaining
  const upperRemaining = plan.days[Math.min(lowerDay, horizon - 1)].remaining
  const remaining = lowerRemaining + (upperRemaining - lowerRemaining) * (day - lowerDay)
  const units = fmtUnits(Math.round(remaining))
  const points = [{day:0,remaining:plan.onHand}, ...plan.days.slice(0,horizon)]
  const max = Math.max(plan.onHand,...points.map(point => point.remaining),1)
  const x = (day:number) => 42 + day / horizon * 580
  const y = (units:number) => 210 - units / max * 175
  const line = points.map(point => `${x(point.day)},${y(point.remaining)}`).join(' ')
  function setDayFromPointer(clientX: number, svg: SVGSVGElement) {
    const rect = svg.getBoundingClientRect()
    setScrubDay(Math.max(0, Math.min(horizon, ((clientX - rect.left) * 650 / rect.width - 42) * horizon / 580)))
  }
  const markerX = x(day)
  const labelX = Math.max(120, Math.min(markerX, 544))
  return <div className="plan-chart"><div className="chart-legend"><span><i />Projected stock</span><span className="chart-delivery-key"><i />Dated delivery</span></div><svg viewBox="0 0 650 265" role="slider" tabIndex={0} aria-label="Projected stock day" aria-valuemin={0} aria-valuemax={horizon} aria-valuenow={dayLabel} aria-valuetext={`${dayLabel === 0 ? 'On hand' : `Day ${dayLabel}`}: ${units} units remaining`} onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); setDayFromPointer(event.clientX, event.currentTarget) }} onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) setDayFromPointer(event.clientX, event.currentTarget) }} onPointerUp={event => event.currentTarget.releasePointerCapture(event.pointerId)} onKeyDown={event => { if (event.key === 'ArrowLeft') { event.preventDefault(); setScrubDay(Math.max(0, day - 1)) } else if (event.key === 'ArrowRight') { event.preventDefault(); setScrubDay(Math.min(horizon, day + 1)) } else if (event.key === 'Home') { event.preventDefault(); setScrubDay(0) } else if (event.key === 'End') { event.preventDefault(); setScrubDay(horizon) } }}>
    {[0,.5,1].map(value => <g key={value}><line x1="42" x2="622" y1={y(value*max)} y2={y(value*max)} className="chart-grid" /><text x="32" y={y(value*max)+4} textAnchor="end">{Math.round(value*max)}</text></g>)}
    <polygon points={`42,210 ${line} ${x(horizon)},210`} className="chart-fill" /><polyline points={line} className="chart-line" />
    {plan.creditedFromDay && plan.creditedFromDay <= horizon && <g><line x1={x(plan.creditedFromDay)} x2={x(plan.creditedFromDay)} y1="28" y2="210" className="chart-delivery" /><text x={x(plan.creditedFromDay)-5} y="20" textAnchor="end">Delivery counted</text></g>}
    <g className="chart-scrub"><line x1={markerX} x2={markerX} y1="64" y2="210" /><circle cx={markerX} cy={y(remaining)} r="5" /><rect x={labelX-78} y="35" width="156" height="25" rx="12" /><text x={labelX} y="52" textAnchor="middle">{dayLabel === 0 ? 'On hand' : `Day ${dayLabel}`} · {units} units</text></g>
    {[0,Math.ceil(horizon/2),horizon].filter((d,i,a)=>a.indexOf(d)===i).map(day => <text key={day} x={x(day)} y="237" textAnchor="middle">{day === 0 ? 'On hand' : `Day ${day}`}</text>)}
  </svg><p className="chart-caption"><strong>{dayLabel === 0 ? 'On hand' : `Day ${dayLabel}`}: {units} units remaining</strong><span>Drag the marker or use arrow keys · {fmtShort(PLAN_AS_OF)} sample inventory</span></p></div>
}

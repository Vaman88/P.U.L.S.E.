import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'
import PharmacyScene from '../components/PharmacyScene'
import usePublicReveals from '../hooks/usePublicReveals'
import '../public.css'
import '../planning-hero.css'
import '../landing-content.css'

// Marketing copy from pulse-source HEAD a58cfb0, website/frontend/src/pages/LandingPage.tsx.
const features = [
  ['Forecast each medication', 'A separate XGBoost model uses past sales and eligible dated public signals for each drug.'],
  ['Plan the next purchase', 'See projected demand and minimum units needed for the next day, week, and two weeks.'],
  ['Understand the context', 'Review relevant demand signals and related news alongside the inventory plan.'],
]
const steps = [
  ['Add sales history', 'Upload a daily CSV with a date, medication name, and units sold.'],
  ['Add inventory', 'Upload on-hand quantities for the same medications. The latest balance is used.'],
  ['Review your plan', 'PULSE trains your account’s models and shows demand, stockout timing, and order guidance.'],
]
const questions = [
  ['What files do I need?', 'A daily sales CSV and an inventory CSV for the same medications. The upload screen shows the required columns.'],
  ['How are signals used?', 'Each medication’s model selects up to five relevant dated signals from the catalog using only its training history.'],
  ['Can I update the plan?', 'Yes. Select newer sales and inventory files in your workspace to train a fresh local model and replace its encrypted plan.'],
  ['Is this a clinical decision tool?', 'No. PULSE is a research demo. Forecasts and purchase guidance need review by qualified pharmacy staff.'],
]
const faqTerms = ['file csv upload sales inventory', 'signal catalog history', 'plan update retrain newer fresh replace', 'clinical decision medical research qualified']

function findFaqAnswer(query: string) {
  const words = query.toLowerCase().match(/[a-z]{4,}/g) ?? []
  const scores = faqTerms.map(terms => words.filter(word => terms.split(' ').some(term => term.startsWith(word) || word.startsWith(term))).length)
  const best = Math.max(...scores)
  return best ? questions[scores.indexOf(best)] : null
}

export default function LandingPage() {
  const pageRef = useRef<HTMLDivElement>(null)
  const [faqQuery, setFaqQuery] = useState('')
  const [faqResult, setFaqResult] = useState<string[] | null | undefined>()
  function askFaq(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFaqResult(findFaqAnswer(faqQuery))
  }
  usePublicReveals(pageRef)
  return <div className="pulse-public pulse-source-landing" ref={pageRef}>
    <a className="pulse-skip" href="#main">Skip to content</a>
    <PublicHeader overlay />
    <main id="main">
      <section className="pulse-hero pulse-planning-hero">
        <div className="pulse-container pulse-hero-grid">
          <div className="compact-hero-row">
            <div className="pulse-hero-title">
              <p className="pulse-hero-kicker">A calmer way to plan replenishment</p>
              <h1>Local care.<br /><span>A clearer plan.</span></h1>
            </div>
            <PharmacyScene />
          </div>
          <div className="compact-hero-intro">
            <p>Turn your sales and inventory history into a focused 14-day plan—so you can see which medicines may need attention, and when.</p>
            <div className="pulse-hero-actions">
              <Link to="/demo" className="pulse-button pulse-button-light">Explore the demo <ArrowUpRight size={18} /></Link>
              <a className="pulse-hero-link" href="#how-it-works">See how it works <ArrowRight size={17} /></a>
            </div>
          </div>
        </div>
      </section>
      <section id="features" className="source-features pulse-container">
        <div className="source-section-heading pulse-reveal"><p>What PULSE does</p><h2>Answers you can act on, without the noise.</h2><p>Daily sales and current stock become a concise view of demand, purchase needs, and the signals behind them.</p></div>
        <div className="source-feature-list pulse-reveal">{features.map(([title,copy])=><article key={title}><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </section>
      <section id="how-it-works" className="source-workflow pulse-container">
        <div className="source-section-heading pulse-reveal"><p>A simple workflow</p><h2>Two files in. A clearer plan out.</h2><p>No complicated setup. Start with the records you already have, then let your browser handle the modeling work.</p><span>Local CSVs · browser training</span></div>
        <ol className="source-steps pulse-reveal">{steps.map(([title,copy],index)=><li key={title}><span aria-hidden="true">0{index+1}</span><div><h3>{title}</h3><p>{copy}</p></div></li>)}</ol>
      </section>
      <section id="questions" className="pulse-faq-section">
        <div className="pulse-faq pulse-container">
          <div className="pulse-reveal pulse-faq-intro"><p className="source-label">Good to know</p><h2>Questions</h2><p>Start with the essentials. Find an answer from these PULSE FAQs below.</p></div>
          <div className="pulse-faq-list pulse-reveal">
            {questions.map(([question,answer])=><details key={question}><summary>{question}<span className="pulse-faq-plus" aria-hidden="true">⌄</span></summary><p>{answer}</p></details>)}
            <form className="pulse-faq-ask" onSubmit={askFaq}><label htmlFor="faq-question">Find an answer</label><div><input id="faq-question" value={faqQuery} onChange={event => { setFaqQuery(event.target.value); setFaqResult(undefined) }} placeholder="Ask about files, signals, plans…" required /><button type="submit" aria-label="Find FAQ answer"><ArrowRight size={19} /></button></div></form>
            {faqResult !== undefined && <div className="pulse-faq-answer" role="status">{faqResult ? <><strong>{faqResult[0]}</strong><p>{faqResult[1]}</p></> : <p>No matching FAQ answer yet. Browse the questions above or visit the <Link to="/api-guide">API guide</Link>.</p>}</div>}
          </div>
        </div>
      </section>
      <section className="pulse-cta pulse-container">
        <p className="source-label">Ready when you are</p><h2>Make the next replenishment decision a little clearer.</h2><p>Start a private workspace, select your history, and see what may need attention over the next 14 days.</p><Link to="/signup" className="pulse-button">Create a workspace <ArrowRight size={18} /></Link>
      </section>
    </main>
    <PublicFooter />
  </div>
}

import { Link } from 'react-router-dom'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'
import '../public.css'
import '../landing-content.css'

export default function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const privacy = kind === 'privacy'
  return <div className="pulse-public pulse-legal-page">
    <a className="pulse-skip" href="#main">Skip to content</a>
    <PublicHeader />
    <main id="main" className="pulse-legal pulse-container">
      <Link className="pulse-legal-back" to="/">← Back to PULSE</Link>
      <h1>{privacy ? 'Privacy overview' : 'Use & limitations'}</h1>
      <p className="pulse-legal-lead">{privacy ? 'How the current PULSE research demo handles the information you provide.' : 'What the PULSE research demo can and cannot be used for.'}</p>
      {privacy ? <>
        <section><h2>Your files</h2><p>Sales and inventory CSVs selected in the workspace are read and used for training in your browser. The raw CSVs are not sent to the PULSE API or saved as part of the plan.</p></section>
        <section><h2>Saved plan</h2><p>The resulting plan can be saved in your browser’s IndexedDB, encrypted with a key derived from your password. Clearing this site’s browser storage removes that local copy.</p></section>
        <section><h2>Account and public data</h2><p>Creating an account sends your username and password to the PULSE service. The service stores a password hash and uses session cookies for sign-in. The browser requests public signal data separately from your private CSVs.</p></section>
      </> : <>
        <section><h2>Research use</h2><p>PULSE is a research demo, not a clinical decision tool. Forecasts and purchase guidance need review by qualified pharmacy staff before any operational decision.</p></section>
        <section><h2>Illustrative examples</h2><p>The sample plan uses illustrative data. It is not a forecast for your clinic and does not place an order.</p></section>
        <section><h2>Check the source data</h2><p>Public signals can be delayed, revised, or incomplete. Review their dates and definitions, and verify stock, deliveries, and supplier timing before acting on a plan.</p></section>
      </>}
      <p className="pulse-legal-note">This is a plain-language product notice for the current research demo; it is not a finalized legal policy or agreement.</p>
    </main>
    <PublicFooter />
  </div>
}

import { Link } from 'react-router-dom'
import { Pill } from 'lucide-react'

export default function PublicFooter() {
  return <footer className="pulse-footer-wrap">
    <div className="pulse-footer pulse-container">
      <div className="pulse-footer-intro"><Link to="/" className="pulse-wordmark" aria-label="PULSE home"><span className="pulse-brand-icon" aria-hidden="true"><Pill size={20} /></span>pulse<span className="pulse-wordmark-period">.</span></Link><p>Pharmacy demand planning with a clearer view of what may need attention.</p></div>
      <nav aria-label="Product links"><h2>Product</h2><a href="/#how-it-works">How it works</a><Link to="/demo">Sample plan</Link><Link to="/login">Workspace</Link></nav>
      <nav aria-label="Resource links"><h2>Resources</h2><a href="/#questions">Questions</a><Link to="/signals">Public signals</Link><Link to="/api-guide">API guide</Link><a href="/docs">API docs</a></nav>
      <nav aria-label="Legal links"><h2>Legal</h2><Link to="/privacy">Privacy overview</Link><Link to="/terms">Use &amp; limitations</Link></nav>
      <div className="pulse-footer-bottom">PULSE · Research demo</div>
    </div>
  </footer>
}

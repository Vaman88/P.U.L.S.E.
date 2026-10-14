import { Link } from 'react-router-dom'
import type { CSSProperties } from 'react'

export default function PublicFooter() {
  return <footer className="pulse-footer-wrap">
    <div className="pulse-footer pulse-container">
      <div className="pulse-footer-links">
      <nav aria-label="Product links"><h2>Product</h2><a href="/#how-it-works">How it works</a><Link to="/demo">Sample plan</Link><Link to="/login">Workspace</Link></nav>
      <nav aria-label="Resource links"><h2>Resources</h2><a href="/#questions">Questions</a><Link to="/signals">Public signals</Link><Link to="/api-guide">API guide</Link><a href="/docs">API docs</a></nav>
      <nav aria-label="Legal links"><h2>Legal</h2><Link to="/privacy">Privacy overview</Link><Link to="/terms">Use &amp; limitations</Link></nav>
      </div>
      <p className="pulse-footer-description">Pharmacy demand planning with a clearer view of what may need attention.</p>
      <Link to="/" className="pulse-footer-wordmark" aria-label="PULSE home">{'PULSE'.split('').map((letter, index) => <span key={index} aria-hidden="true" style={{ '--letter': index } as CSSProperties}>{letter}</span>)}</Link>
      <div className="pulse-footer-bottom">PULSE · Research demo</div>
    </div>
  </footer>
}

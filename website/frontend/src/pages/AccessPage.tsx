import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { login, register } from '../api'
import { unlockBrowserPlan } from '../browserForecast'
import PublicHeader from '../components/PublicHeader'

export default function AccessPage({ mode }: { mode: 'login' | 'signup' }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const signup = mode === 'signup'
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      if (signup) await register(username,password)
      else await login(username,password)
      await unlockBrowserPlan(username,password)
      navigate('/dashboard')
    } catch(error) { setError(error instanceof Error ? error.message : 'Could not sign in') }
    finally { setBusy(false) }
  }
  return <div className="pulse-public pulse-access"><PublicHeader /><main className="pulse-access-main"><div className={`pulse-access-card ${signup ? 'is-signup' : ''}`}>
    <nav className="pulse-access-tabs" aria-label="Account action"><span className="pulse-access-tab-indicator" aria-hidden="true" /><Link to="/login" aria-current={!signup ? 'page' : undefined}>Sign in</Link><Link to="/signup" aria-current={signup ? 'page' : undefined}>Sign up</Link></nav>
    <div className="pulse-access-body" key={mode}><h1>{signup ? 'Make room for clarity.' : 'Welcome back.'}</h1><p className="pulse-access-description">{signup ? 'Create an account to select local files and train your own models.' : 'Sign in to unlock a forecast saved on this device.'}</p><form onSubmit={submit} className="pulse-form"><label className="pulse-field">Username<input value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" minLength={3} maxLength={40} required placeholder="Your username" /></label><label className="pulse-field">Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete={signup ? 'new-password' : 'current-password'} minLength={signup ? 12 : 1} required placeholder="Your password" />{signup && <span className="pulse-field-help">Use at least 12 characters.</span>}</label>{error && <p role="alert" className="pulse-form-error">{error}</p>}<button className="pulse-button pulse-submit" disabled={busy}>{busy ? 'Please wait…' : signup ? 'Create my workspace' : 'Open my workspace'}<ArrowRight size={18} /></button></form><p className="pulse-form-note">Your plan uses AES-256-GCM encryption on this device; account passwords use Argon2id hashing. Private CSVs are not uploaded.</p></div>
  </div></main></div>
}

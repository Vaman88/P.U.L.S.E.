import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const AccessPage = lazy(() => import('./pages/AccessPage'))
const PlanningDemo = lazy(() => import('./pages/PlanningDashboard'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const SignalsPage = lazy(() => import('./pages/SignalsPage'))
const ApiGuide = lazy(() => import('./pages/ApiGuide'))
const LegalPage = lazy(() => import('./pages/LegalPage'))

function App() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-sm text-slate-600" role="status" aria-live="polite">Loading PULSE…</div>}>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AccessPage mode="login" />} />
          <Route path="/signup" element={<AccessPage mode="signup" />} />
          <Route path="/privacy" element={<LegalPage kind="privacy" />} />
          <Route path="/terms" element={<LegalPage kind="terms" />} />
          <Route element={<Layout />}>
            <Route path="/demo" element={<PlanningDemo demoOnly />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/signals" element={<SignalsPage />} />
            <Route path="/api-guide" element={<ApiGuide />} />
          </Route>
        </Routes>
      </Router>
    </Suspense>
  )
}

export default App

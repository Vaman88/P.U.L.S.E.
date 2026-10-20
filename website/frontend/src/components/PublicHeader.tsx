import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ArrowRight, Menu, X, UserRound, LogOut } from "lucide-react";
import { isSignedIn } from "../api";

export default function PublicHeader({
  overlay = false,
  workspace = false,
  demo = false,
  onLogout,
  onLogoutAll,
}: {
  overlay?: boolean;
  workspace?: boolean;
  demo?: boolean;
  onLogout?: () => void;
  onLogoutAll?: () => void;
}) {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { if (!demo) { let active = true; isSignedIn().then(value => { if (active) setSignedIn(value); }); return () => { active = false; }; } }, [demo]);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [overContent, setOverContent] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); menuRef.current?.focus(); } };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  useEffect(() => {
    if (!overlay || !topRef.current || typeof IntersectionObserver === "undefined") return;
    // A 12px document sentinel changes state without a per-frame scroll listener.
    const observer = new IntersectionObserver(([entry]) => {
      setScrolled(!entry.isIntersecting);
    });
    observer.observe(topRef.current);
    return () => observer.disconnect();
  }, [overlay]);
  useEffect(() => {
    if (!overlay || typeof IntersectionObserver === "undefined") return;
    const hero = document.querySelector(".pulse-hero");
    if (!hero) return;
    // Change text color when the hero clears the transparent navigation.
    const observer = new IntersectionObserver(([entry]) => {
      setOverContent(!entry.isIntersecting);
    }, { rootMargin: "-92px 0px 0px 0px", threshold: 0 });
    observer.observe(hero);
    return () => observer.disconnect();
  }, [overlay]);
  useEffect(() => {
    // A link from an access page loads /#section before React renders its target.
    // Restore that initial anchor after the landing page has mounted. Subsequent
    // same-page clicks stay native, including browser history and reduced motion.
    if (workspace || window.location.pathname !== "/" || !window.location.hash) return;

    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(window.location.hash.slice(1));
      target?.scrollIntoView({ block: "start", behavior: "auto" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  return (
    <>
    {overlay && <div ref={topRef} className="pulse-header-sentinel" aria-hidden="true" />}
    <header className={`pulse-header ${workspace ? "pulse-workspace-header" : ""} ${overlay ? "pulse-header-overlay" : ""} ${scrolled ? "is-scrolled" : ""} ${overContent ? "is-over-content" : ""}`}>
      <div className="pulse-header-inner pulse-container">
        <Link to="/" className="pulse-wordmark" aria-label="Pulse home">
          <img className="pulse-brand-icon" src="/pulse-supply-mark.svg" alt="" />
          PULSE
        </Link>
        <button
          ref={menuRef}
          className="pulse-menu-toggle"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls={workspace ? "workspace-navigation" : "public-navigation"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={23} /> : <Menu size={23} />}
        </button>
        <nav
          id={workspace ? "workspace-navigation" : "public-navigation"}
          aria-label={workspace ? "Workspace navigation" : "Main navigation"}
          className={`pulse-nav ${open ? "is-open" : ""}`}
        >
          <div className="pulse-header-links">
          {workspace ? (demo ? <NavLink to="/demo" onClick={() => setOpen(false)}>Test demo</NavLink> :
            [['/dashboard', 'Dashboard'], ['/signals', 'Signals'], ['/api-guide', 'API guide']].map(([to, label]) =>
              <NavLink key={to} to={to} onClick={() => setOpen(false)}>{label}</NavLink>)) : <>
          <a href="/#how-it-works" onClick={() => setOpen(false)}>
            How it works
          </a>
          <a href="/#features" onClick={() => setOpen(false)}>
            Features
          </a>
          <a href="/#questions" onClick={() => setOpen(false)}>
            Questions
          </a>
          </>}
          </div>
          <div className="pulse-header-actions">
          {workspace && signedIn && onLogoutAll && <button type="button" className="pulse-nav-signin" aria-label="Sign out everywhere" title="Sign out everywhere" onClick={onLogoutAll}><LogOut size={17} /></button>}
          {workspace ? (signedIn ? <button type="button" onClick={onLogout} className="pulse-button pulse-nav-cta"><span className="pulse-cta-arrow"><LogOut size={15} /></span>Logout</button> : <Link to="/login" className="pulse-button pulse-nav-cta"><span className="pulse-cta-arrow"><ArrowRight size={15} /></span>Sign In</Link>) : <>
          <Link
            to={signedIn ? "/dashboard" : "/login"}
            className="pulse-nav-signin"
            aria-label={signedIn ? "Open Dashboard" : "Sign In"}
          >
            <UserRound size={17} aria-hidden="true" /><span>{signedIn ? "Dashboard" : "Sign In"}</span>
          </Link>
          <Link to="/signup" className="pulse-button pulse-nav-cta">
            <span className="pulse-cta-arrow"><ArrowRight size={15} /></span>Get started
          </Link>
          </>}
          </div>
        </nav>
      </div>
    </header>
    </>
  );
}

import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Wrench, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function SiteLayout() {
  const { user, waitlistEntry, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid var(--c-border)',
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--c-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Wrench size={20} color="#fff" strokeWidth={2.2} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 22, color: 'var(--c-primary)' }}>Yenza</span>
          </Link>

          <nav className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <Link to="/how-it-works" className="nav-link" style={{ fontWeight: 500, color: 'var(--c-text-secondary)', transition: 'color 0.15s' }}>
              How It Works
            </Link>
            <Link to="/about" style={{ fontWeight: 500, color: 'var(--c-text-secondary)' }}>
              About
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '8px 18px' }}>
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <button onClick={handleSignOut} className="btn btn-ghost" style={{ padding: '8px 12px' }}>
                  <LogOut size={16} /> Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={{ fontWeight: 500, color: 'var(--c-text-secondary)' }}>Sign in</Link>
                <Link to="/join/worker" className="btn btn-primary" style={{ padding: '8px 20px' }}>
                  Join Waitlist
                </Link>
              </>
            )}
          </nav>

          {/* Mobile toggle */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ borderTop: '1px solid var(--c-border)', background: 'var(--c-surface)', padding: '16px' }} className="mobile-menu">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link to="/how-it-works" onClick={() => setMenuOpen(false)} style={{ fontWeight: 500, color: 'var(--c-text-secondary)', padding: '8px 0' }}>
                How It Works
              </Link>
              <Link to="/about" onClick={() => setMenuOpen(false)} style={{ fontWeight: 500, color: 'var(--c-text-secondary)', padding: '8px 0' }}>
                About
              </Link>
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="btn btn-secondary btn-block">
                    Dashboard
                  </Link>
                  <button onClick={() => { setMenuOpen(false); handleSignOut(); }} className="btn btn-ghost btn-block">
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)} style={{ fontWeight: 500, color: 'var(--c-text-secondary)', padding: '8px 0' }}>
                    Sign in
                  </Link>
                  <Link to="/join/worker" onClick={() => setMenuOpen(false)} className="btn btn-primary btn-block">
                    Join Waitlist
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main */}
      <main style={{ flex: 1 }}>
        <Outlet context={waitlistEntry} />
      </main>

      {/* Footer */}
      <footer style={{ background: 'var(--c-text)', color: 'var(--c-text-muted)', padding: '48px 0 32px' }}>
        <div className="container">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48, justifyContent: 'space-between' }}>
            <div style={{ maxWidth: 320 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'var(--c-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Wrench size={18} color="#fff" strokeWidth={2.2} />
                </div>
                <span style={{ fontWeight: 700, fontSize: 20, color: '#fff' }}>Yenza</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6 }}>
                Connecting workers and employers across South Africa. Work. Earn. Grow.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 48 }}>
              <div>
                <h4 style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Platform</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link to="/how-it-works" style={{ fontSize: 14 }}>How It Works</Link>
                  <Link to="/about" style={{ fontSize: 14 }}>About Us</Link>
                </div>
              </div>
              <div>
                <h4 style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Get Started</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link to="/join/worker" style={{ fontSize: 14 }}>Join as Worker</Link>
                  <Link to="/join/employer" style={{ fontSize: 14 }}>Join as Employer</Link>
                  <Link to="/login" style={{ fontSize: 14 }}>Sign in</Link>
                </div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 32, paddingTop: 24, fontSize: 13, textAlign: 'center' }}>
            © 2026 Yenza. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

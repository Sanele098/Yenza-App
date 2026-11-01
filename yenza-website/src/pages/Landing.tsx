import { Link } from 'react-router-dom';
import {
  Wrench, Building2, ArrowRight, CheckCircle2, Sparkles, Shield,
  Wallet, Search, Clock, Star, TrendingUp, Hammer,
} from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero */}
      <section style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #0F766E 0%, #0B5A54 60%, #134E4A 100%)',
        color: '#fff',
        overflow: 'hidden',
        padding: '96px 0 80px',
      }}>
        {/* Decorative shapes */}
        <div style={{
          position: 'absolute', top: -100, right: -80, width: 400, height: 400,
          borderRadius: '50%', background: 'rgba(20,184,166,0.15)', filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', bottom: -120, left: -60, width: 300, height: 300,
          borderRadius: '50%', background: 'rgba(245,158,11,0.1)', filter: 'blur(40px)',
        }} />

        <div className="container" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 64, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 520px' }}>
            <div className="fade-up" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 999,
              background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
              fontSize: 13, fontWeight: 600, marginBottom: 24,
            }}>
              <Sparkles size={15} /> Now accepting early access sign-ups
            </div>
            <h1 className="fade-up" style={{
              fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 700,
              lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.02em',
            }}>
              Work. Earn. Grow.
              <br />
              <span style={{ color: '#5EEAD4' }}>The platform built</span> for South African workers.
            </h1>
            <p className="fade-up" style={{
              fontSize: 19, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)',
              maxWidth: 520, marginBottom: 32,
            }}>
              Yenza connects skilled and general workers with employers who need them —
              from plumbing and cleaning to electrical and carpentry. Join the waitlist today
              and be first in line when the app launches.
            </p>
            <div className="fade-up" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {user ? (
                <Link to="/dashboard" className="btn btn-lg" style={{ background: '#fff', color: 'var(--c-primary)' }}>
                  Go to Dashboard <ArrowRight size={20} />
                </Link>
              ) : (
                <>
                  <Link to="/join/worker" className="btn btn-lg" style={{ background: '#fff', color: 'var(--c-primary)' }}>
                    Join as Worker <ArrowRight size={20} />
                  </Link>
                  <Link to="/join/employer" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)' }}>
                    <Building2 size={20} /> Join as Employer
                  </Link>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 32, marginTop: 40, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 700 }}>500+</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>On the waitlist</div>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
              <div>
                <div style={{ fontSize: 32, fontWeight: 700 }}>17</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>Service categories</div>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
              <div>
                <div style={{ fontSize: 32, fontWeight: 700 }}>7</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>Areas covered</div>
              </div>
            </div>
          </div>

          {/* Hero visual card */}
          <div style={{ flex: '0 1 380px' }} className="hide-mobile">
            <div className="fade-up" style={{
              background: '#fff', borderRadius: 24, padding: 28, color: 'var(--c-text)',
              boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'var(--c-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Wrench size={24} color="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Yenza App</div>
                  <div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>Coming soon to iOS & Android</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: Search, text: 'Browse jobs near you', color: 'var(--c-accent)' },
                  { icon: Wallet, text: 'Track your earnings', color: 'var(--c-success)' },
                  { icon: Shield, text: 'Verified & trusted profiles', color: 'var(--c-primary)' },
                  { icon: TrendingUp, text: 'Grow your skills with AI', color: 'var(--c-secondary)' },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px', borderRadius: 12,
                    background: 'var(--c-bg)', border: '1px solid var(--c-border-light)',
                  }}>
                    <item.icon size={20} color={item.color} />
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{item.text}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <span className="badge badge-warning pulse" style={{ padding: '6px 16px' }}>
                  <Clock size={14} /> In development
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Workers / For Employers split */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>
              One platform. Two ways to win.
            </h2>
            <p style={{ fontSize: 18, color: 'var(--c-text-secondary)', maxWidth: 560, margin: '0 auto' }}>
              Whether you're looking for work or looking to hire, Yenza makes it simple.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
            {/* Workers card */}
            <div className="card card-hover" style={{ padding: 36 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: 'var(--c-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                <Hammer size={28} color="var(--c-primary)" />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>For Workers</h3>
              <p style={{ color: 'var(--c-text-secondary)', marginBottom: 20, fontSize: 15 }}>
                Find jobs that match your skills, build a reputation, and grow your income.
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {[
                  'Browse and accept jobs near you',
                  'Set your own availability and rates',
                  'Get paid via cash, EFT, or card',
                  'Build a verified profile employers trust',
                  'Learn new skills with Yenza-AI coaching',
                ].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <CheckCircle2 size={20} color="var(--c-success)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 15 }}>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/join/worker" className="btn btn-primary btn-block">
                Join the Waitlist <ArrowRight size={18} />
              </Link>
            </div>

            {/* Employers card */}
            <div className="card card-hover" style={{ padding: 36 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: 'var(--c-secondary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                <Building2 size={28} color="var(--c-secondary)" />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>For Employers</h3>
              <p style={{ color: 'var(--c-text-secondary)', marginBottom: 20, fontSize: 15 }}>
                Post jobs, find vetted workers, and get things done — from home repairs to staffing.
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {[
                  'Post a job in under 2 minutes',
                  'Choose instant-accept or application mode',
                  'See verified worker profiles and ratings',
                  'Pay workers via cash or card',
                  'Track every job from start to finish',
                ].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <CheckCircle2 size={20} color="var(--c-success)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 15 }}>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/join/employer" className="btn btn-primary btn-block">
                Join the Waitlist <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ padding: '64px 0' }}>
        <div className="container">
          <div style={{
            background: 'linear-gradient(135deg, var(--c-primary) 0%, var(--c-primary-dark) 100%)',
            borderRadius: 24, padding: '56px 48px', color: '#fff', textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -40, right: -40, width: 200, height: 200,
              borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
            }} />
            <div style={{ position: 'relative' }}>
              <Star size={40} color="#FCD34D" style={{ margin: '0 auto 16px' }} />
              <h2 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 700, marginBottom: 12 }}>
                Be first in line when Yenza launches
              </h2>
              <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.85)', maxWidth: 520, margin: '0 auto 28px' }}>
                Join the waitlist now and we'll notify you the moment the app is available for download.
              </p>
              {!user && (
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link to="/join/worker" className="btn btn-lg" style={{ background: '#fff', color: 'var(--c-primary)' }}>
                    Join as Worker
                  </Link>
                  <Link to="/join/employer" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)' }}>
                    Join as Employer
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

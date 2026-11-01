import { Link } from 'react-router-dom';
import {
  UserPlus, Search, ClipboardList, Wallet, Star, ArrowRight,
  Briefcase, Users, CheckCircle2, Shield, Sparkles,
} from 'lucide-react';

const workerSteps = [
  { icon: UserPlus, title: 'Create your profile', desc: 'Tell us your skills, location, and availability. It takes less than 5 minutes.' },
  { icon: Search, title: 'Browse available jobs', desc: 'See jobs near you that match your skills. Filter by distance, price, and category.' },
  { icon: ClipboardList, title: 'Accept or apply', desc: 'Claim instant jobs on the spot, or apply to ones that need a quote first.' },
  { icon: Wallet, title: 'Get paid', desc: 'Receive payment in cash, by EFT, or by card. Track everything in your earnings wallet.' },
  { icon: Star, title: 'Build your reputation', desc: 'Every completed job adds to your rating. Verified workers get hired first.' },
];

const employerSteps = [
  { icon: Briefcase, title: 'Post a job', desc: 'Describe what you need done, set your budget, and pick a payment method. Under 2 minutes.' },
  { icon: Users, title: 'Review workers', desc: 'See profiles, ratings, and verification status. Choose the right person for the job.' },
  { icon: CheckCircle2, title: 'Track progress', desc: 'Follow each job from accepted to completed. Add photos and confirm when done.' },
  { icon: Wallet, title: 'Pay securely', desc: 'Pay in cash or by card. Yenza handles the commission automatically.' },
];

export default function HowItWorks() {
  return (
    <div>
      {/* Header */}
      <section style={{
        background: 'linear-gradient(135deg, #0F766E 0%, #0B5A54 100%)',
        color: '#fff', padding: '80px 0 64px', textAlign: 'center',
      }}>
        <div className="container">
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700, marginBottom: 16, letterSpacing: '-0.02em' }}>
            How Yenza Works
          </h1>
          <p style={{ fontSize: 19, color: 'rgba(255,255,255,0.85)', maxWidth: 600, margin: '0 auto' }}>
            A simple, fair, and transparent way to find work or hire workers. Here's the whole process.
          </p>
        </div>
      </section>

      {/* Workers flow */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'var(--c-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <UserPlus size={22} color="var(--c-primary)" />
            </div>
            <h2 style={{ fontSize: 30, fontWeight: 700 }}>For Workers</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {workerSteps.map((step, i) => (
              <div key={i} className="card" style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 40, fontWeight: 800, color: 'var(--c-border-light)' }}>
                  {i + 1}
                </div>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'var(--c-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <step.icon size={24} color="var(--c-primary)" />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--c-text-secondary)', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Employers flow */}
      <section style={{ background: 'var(--c-bg)', padding: '64px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'var(--c-secondary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Briefcase size={22} color="var(--c-secondary)" />
            </div>
            <h2 style={{ fontSize: 30, fontWeight: 700 }}>For Employers</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {employerSteps.map((step, i) => (
              <div key={i} className="card" style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 40, fontWeight: 800, color: 'var(--c-border-light)' }}>
                  {i + 1}
                </div>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'var(--c-secondary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <step.icon size={24} color="var(--c-secondary)" />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--c-text-secondary)', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="section">
        <div className="container">
          <h2 style={{ fontSize: 30, fontWeight: 700, textAlign: 'center', marginBottom: 12 }}>
            Trust & Safety
          </h2>
          <p style={{ fontSize: 17, color: 'var(--c-text-secondary)', textAlign: 'center', maxWidth: 560, margin: '0 auto 40px' }}>
            We're building a platform where workers and employers can connect with confidence.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            <div className="card" style={{ textAlign: 'center', padding: 32 }}>
              <Shield size={36} color="var(--c-primary)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Identity Verification</h3>
              <p style={{ fontSize: 14, color: 'var(--c-text-secondary)' }}>
                Workers verify their identity so employers know exactly who they're hiring.
              </p>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: 32 }}>
              <Star size={36} color="var(--c-secondary)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Ratings & Reviews</h3>
              <p style={{ fontSize: 14, color: 'var(--c-text-secondary)' }}>
                After every job, both sides rate each other. Good work builds a strong reputation.
              </p>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: 32 }}>
              <Sparkles size={36} color="var(--c-accent)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Yenza-AI Coach</h3>
              <p style={{ fontSize: 14, color: 'var(--c-text-secondary)' }}>
                Workers get AI-powered guidance to learn new skills and close the gap to their next opportunity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '0 0 64px' }}>
        <div className="container text-center">
          <Link to="/join/worker" className="btn btn-primary btn-lg">
            Join the Waitlist <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}

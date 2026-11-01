import { Link } from 'react-router-dom';
import { Target, Heart, Users, MapPin, ArrowRight, Zap } from 'lucide-react';

export default function About() {
  return (
    <div>
      <section style={{
        background: 'linear-gradient(135deg, #0F766E 0%, #0B5A54 100%)',
        color: '#fff', padding: '80px 0 64px', textAlign: 'center',
      }}>
        <div className="container">
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700, marginBottom: 16, letterSpacing: '-0.02em' }}>
            About Yenza
          </h1>
          <p style={{ fontSize: 19, color: 'rgba(255,255,255,0.85)', maxWidth: 600, margin: '0 auto' }}>
            We're on a mission to connect South Africa's workers with the people who need them — fairly, transparently, and with dignity.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
            <div>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: 'var(--c-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                <Target size={28} color="var(--c-primary)" />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Our Mission</h2>
              <p style={{ fontSize: 16, color: 'var(--c-text-secondary)', lineHeight: 1.7 }}>
                Yenza — meaning "do it" in isiZulu — was created to give every worker in South Africa
                a fair shot at finding work, and every employer a reliable way to find help.
                We believe that honest work deserves fair pay, clear communication, and mutual respect.
              </p>
            </div>
            <div>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: 'var(--c-secondary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                <Heart size={28} color="var(--c-secondary)" />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Our Values</h2>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Dignity — every worker deserves respect',
                  'Transparency — fair pricing, no hidden fees',
                  'Community — building local economies',
                  'Growth — helping workers learn and advance',
                ].map((v, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15, color: 'var(--c-text-secondary)' }}>
                    <span style={{ color: 'var(--c-primary)', fontWeight: 700 }}>•</span> {v}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Coverage */}
      <section style={{ background: 'var(--c-bg)', padding: '64px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <MapPin size={24} color="var(--c-primary)" />
            <h2 style={{ fontSize: 26, fontWeight: 700 }}>Where We Operate</h2>
          </div>
          <p style={{ fontSize: 16, color: 'var(--c-text-secondary)', maxWidth: 640, marginBottom: 28 }}>
            Yenza is launching in Newcastle, KwaZulu-Natal and the surrounding areas. As we grow, we'll
            expand to more towns and cities across South Africa.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {['Newcastle CBD', 'Madadeni', 'Osizweni', 'Hutten Heights', 'Arbor Park', 'Charlestown', 'Fernwood'].map((area) => (
              <span key={area} className="badge badge-primary" style={{ padding: '8px 16px', fontSize: 14 }}>
                <MapPin size={14} /> {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24, textAlign: 'center' }}>
            {[
              { icon: Users, value: '500+', label: 'On the waitlist' },
              { icon: Zap, value: '17', label: 'Service categories' },
              { icon: MapPin, value: '7', label: 'Areas covered' },
              { icon: Target, value: '1', label: 'Mission: connect SA' },
            ].map((s, i) => (
              <div key={i} className="card" style={{ padding: 28 }}>
                <s.icon size={32} color="var(--c-primary)" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--c-text)' }}>{s.value}</div>
                <div style={{ fontSize: 14, color: 'var(--c-text-muted)' }}>{s.label}</div>
              </div>
            ))}
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

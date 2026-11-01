import { Link } from 'react-router-dom';
import {
  CheckCircle2, Clock, Shield, FileText, Award, Smartphone,
  PartyPopper, Wrench, Building2, MapPin, Phone, Mail, Calendar,
} from 'lucide-react';
import { useAuth } from '../lib/auth';

interface VerificationItem {
  label: string;
  description: string;
  done: boolean;
  icon: typeof Shield;
}

export default function Dashboard() {
  const { user, waitlistEntry } = useAuth();

  if (!waitlistEntry) {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div className="card" style={{ padding: 40 }}>
          <Clock size={40} color="var(--c-warning)" style={{ margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>No waitlist entry found</h1>
          <p style={{ color: 'var(--c-text-secondary)', marginBottom: 24 }}>
            You're signed in, but we couldn't find your waitlist registration. Join the waitlist to secure your spot.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/join/worker" className="btn btn-primary">Join as Worker</Link>
            <Link to="/join/employer" className="btn btn-secondary">Join as Employer</Link>
          </div>
        </div>
      </div>
    );
  }

  const isWorker = waitlistEntry.role === 'worker';

  const workerVerifications: VerificationItem[] = [
    {
      label: 'Identity verification',
      description: 'Confirm your identity so employers know who they are hiring. You\'ll need a valid SA ID or passport.',
      done: waitlistEntry.identity_verified,
      icon: Shield,
    },
    {
      label: 'Qualifications & certificates',
      description: 'Upload certificates or proof of training for skilled services (plumbing, electrical, etc.).',
      done: waitlistEntry.qualifications_verified,
      icon: Award,
    },
    {
      label: 'Professional registration',
      description: 'Add registration numbers for regulated trades (e.g. PIRB for plumbing, EC for electrical).',
      done: waitlistEntry.qualifications_verified,
      icon: FileText,
    },
  ];

  const employerVerifications: VerificationItem[] = [
    {
      label: 'Identity verification',
      description: 'Confirm your identity so workers know who they are working for.',
      done: waitlistEntry.identity_verified,
      icon: Shield,
    },
    {
      label: 'Business verification',
      description: 'If you\'re a business or organisation, verify your registration details.',
      done: waitlistEntry.qualifications_verified,
      icon: FileText,
    },
  ];

  const verifications = isWorker ? workerVerifications : employerVerifications;
  const completedCount = verifications.filter((v) => v.done).length;
  const allDone = completedCount === verifications.length;

  return (
    <div style={{ background: 'var(--c-bg)', minHeight: 'calc(100vh - 64px - 280px)' }}>
      {/* Welcome banner */}
      <section style={{
        background: 'linear-gradient(135deg, #0F766E 0%, #0B5A54 100%)',
        color: '#fff', padding: '48px 0 40px',
      }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isWorker ? <Wrench size={24} color="#fff" /> : <Building2 size={24} color="#fff" />}
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 700 }}>
                Welcome, {waitlistEntry.full_name.split(' ')[0]}!
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>
                You're #{waitlistEntry.waitlist_position} on the {isWorker ? 'worker' : 'employer'} waitlist
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container" style={{ padding: '40px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {/* Left: App status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* App availability card */}
            <div className="card" style={{
              padding: 32, textAlign: 'center',
              border: '2px solid var(--c-border-light)',
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: 18,
                background: 'var(--c-warning-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <Smartphone size={36} color="var(--c-warning)" />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                The Yenza app isn't available yet
              </h2>
              <p style={{ color: 'var(--c-text-secondary)', fontSize: 15, marginBottom: 20, lineHeight: 1.6 }}>
                We're putting the finishing touches on the mobile app. Once it's ready for download,
                you'll be notified by email and can start {isWorker ? 'finding jobs' : 'posting jobs'} right away.
              </p>
              <div className="badge badge-warning" style={{ padding: '8px 18px', fontSize: 14 }}>
                <Clock size={16} /> App in development
              </div>
              <p style={{ marginTop: 20, fontSize: 13, color: 'var(--c-text-muted)' }}>
                Expected launch: coming soon to iOS &amp; Android
              </p>
            </div>

            {/* Profile summary */}
            <div className="card" style={{ padding: 28 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Your details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <DetailRow icon={isWorker ? Wrench : Building2} label="Role" value={isWorker ? 'Worker' : 'Employer'} />
                <DetailRow icon={Mail} label="Email" value={waitlistEntry.email} />
                <DetailRow icon={Phone} label="Phone" value={waitlistEntry.phone} />
                <DetailRow icon={MapPin} label="Location" value={waitlistEntry.location} />
                <DetailRow icon={Calendar} label="Joined" value={new Date(waitlistEntry.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })} />
                {!isWorker && waitlistEntry.account_type && (
                  <DetailRow icon={Building2} label="Account type" value={waitlistEntry.account_type} />
                )}
              </div>
            </div>
          </div>

          {/* Right: Verification checklist */}
          <div>
            <div className="card" style={{ padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700 }}>Verification status</h3>
                <span className={`badge ${allDone ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 13 }}>
                  {completedCount}/{verifications.length} complete
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 20 }}>
                These items will be completed once the app launches. Here's what to expect.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {verifications.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 14, padding: 16, borderRadius: 12,
                    border: `1.5px solid ${item.done ? 'var(--c-success-soft)' : 'var(--c-border)'}`,
                    background: item.done ? 'var(--c-success-soft)' : 'var(--c-surface)',
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: item.done ? 'var(--c-success)' : 'var(--c-bg)',
                    }}>
                      <item.icon size={20} color={item.done ? '#fff' : 'var(--c-text-muted)'} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>{item.label}</span>
                        {item.done ? (
                          <CheckCircle2 size={16} color="var(--c-success)" />
                        ) : (
                          <Clock size={16} color="var(--c-warning)" />
                        )}
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--c-text-secondary)', lineHeight: 1.5 }}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Worker extra: services preview */}
              {isWorker && waitlistEntry.services.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Services you selected</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {waitlistEntry.services.map((svc) => (
                      <span key={svc} className="badge badge-primary" style={{ padding: '6px 14px', fontSize: 13 }}>
                        {svc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* What happens next */}
            <div className="card" style={{ padding: 28, marginTop: 24, background: 'var(--c-primary-soft)', borderColor: 'var(--c-primary-soft)' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <PartyPopper size={24} color="var(--c-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: 'var(--c-primary)' }}>
                    What happens next?
                  </h3>
                  <ol style={{ fontSize: 14, color: 'var(--c-text-secondary)', lineHeight: 1.8, paddingLeft: 18 }}>
                    <li>We'll email you when the Yenza app is ready to download.</li>
                    <li>Download the app and sign in with your email and password.</li>
                    <li>Complete your verification inside the app (ID, certificates, etc.).</li>
                    <li>{isWorker ? 'Start browsing and accepting jobs near you.' : 'Start posting jobs and finding workers.'}</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sign out */}
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <p style={{ fontSize: 14, color: 'var(--c-text-muted)' }}>
            Signed in as {user?.email}
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof Shield; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Icon size={18} color="var(--c-text-muted)" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--c-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value}
        </div>
      </div>
    </div>
  );
}

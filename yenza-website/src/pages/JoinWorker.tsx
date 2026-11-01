import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Wrench, ChevronLeft, ChevronRight, Check, MapPin, Clock, Mail, Lock, Phone, UserRound,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import {
  GENERAL_SERVICES, SKILLED_SERVICES, SERVICE_AREAS, EXPERIENCE_LEVELS, DAYS_OF_WEEK,
} from '../lib/constants';

const TOTAL_STEPS = 4;
interface WorkerForm {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  location: string;
  serviceAreas: string[];
  availabilityDays: string[];
  services: string[];
  experience: string;
  goals: string;
  bio: string;
}

const initialForm: WorkerForm = {
  fullName: '', email: '', phone: '', password: '',
  location: '', serviceAreas: [], availabilityDays: [],
  services: [], experience: EXPERIENCE_LEVELS[0], goals: '', bio: '',
};

export default function JoinWorker() {
  const navigate = useNavigate();
  const { refreshWaitlist } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WorkerForm>(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field: keyof WorkerForm, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const toggle = (arr: string[], item: string): string[] =>
    arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

  const validate = (): boolean => {
    if (step === 0) {
      if (!form.fullName.trim()) { setError('Please enter your full name.'); return false; }
      if (!form.email.includes('@')) { setError('Please enter a valid email address.'); return false; }
      if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return false; }
      if (!form.phone.trim()) { setError('Please enter your phone number.'); return false; }
    }
    if (step === 1) {
      if (!form.location.trim()) { setError('Please enter your area or suburb.'); return false; }
      if (form.serviceAreas.length === 0) { setError('Select at least one area where you can work.'); return false; }
      if (form.availabilityDays.length === 0) { setError('Select at least one day you are available.'); return false; }
    }
    if (step === 2) {
      if (form.services.length === 0) { setError('Select at least one service you can already do.'); return false; }
    }
    return true;
  };

  const next = () => {
    if (!validate()) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const back = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    if (!form.bio.trim()) { setError('Tell us a bit about yourself so employers can get to know you.'); return; }
    setLoading(true);
    setError('');

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
    });
    if (authError) { setLoading(false); setError(authError.message); return; }
    const userId = authData.user?.id;
    if (!userId) { setLoading(false); setError('Could not create account.'); return; }

    let session = authData.session;
    if (!session) {
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: form.email.trim(), password: form.password,
      });
      if (signInErr) { setLoading(false); setError('Account created but could not sign in.'); return; }
      session = signInData.session;
    }

    const { error: waitlistErr } = await supabase.from('waitlist_entries').insert({
      user_id: userId,
      email: form.email.trim(),
      full_name: form.fullName.trim(),
      phone: form.phone.trim(),
      role: 'worker',
      location: form.location,
      service_areas: form.serviceAreas,
      availability_days: form.availabilityDays,
      services: form.services,
      experience_level: form.experience,
      goals: form.goals,
      bio: form.bio,
    });

    setLoading(false);
    if (waitlistErr) { setError(waitlistErr.message); return; }

    await refreshWaitlist();
    navigate('/dashboard');
  };

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '48px 24px 64px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, background: 'var(--c-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
        }}>
          <Wrench size={28} color="#fff" strokeWidth={2.2} />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--c-primary)' }}>Yenza</h1>
        <p style={{ color: 'var(--c-text-muted)', marginTop: 4 }}>Join the waitlist as a worker</p>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} style={{
            width: 32, height: 32, borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: i === step ? '2.5px solid var(--c-primary-light)' : '1.5px solid var(--c-border)',
            background: i <= step ? 'var(--c-primary)' : 'var(--c-surface)',
            transition: 'all 0.2s ease',
          }}>
            {i < step ? <Check size={14} color="#fff" strokeWidth={3} /> :
              <span style={{ fontWeight: 600, fontSize: 13, color: i <= step ? '#fff' : 'var(--c-text-muted)' }}>{i + 1}</span>}
          </div>
        ))}
      </div>
      <p style={{ textAlign: 'center', color: 'var(--c-text-muted)', fontSize: 13, marginBottom: 28 }}>
        Step {step + 1} of {TOTAL_STEPS}
      </p>

      {/* Form card */}
      <div className="card" style={{ padding: 28 }}>
        {error && <div className="alert alert-error">{error}</div>}

        {/* Step 0: Account */}
        {step === 0 && (
          <div className="fade-up">
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Create your account</h2>
            <p style={{ color: 'var(--c-text-muted)', fontSize: 14, marginBottom: 24 }}>Start by setting up your login details.</p>

            <div className="field">
              <label className="label">Full name</label>
              <div style={{ position: 'relative' }}>
                <UserRound size={18} color="var(--c-text-muted)" style={{ position: 'absolute', left: 14, top: 14 }} />
                <input className="input" style={{ paddingLeft: 42 }} placeholder="e.g. Sanele Buthelezi"
                  value={form.fullName} onChange={(e) => update('fullName', e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label className="label">Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--c-text-muted)" style={{ position: 'absolute', left: 14, top: 14 }} />
                <input className="input" style={{ paddingLeft: 42 }} type="email" placeholder="you@example.co.za"
                  value={form.email} onChange={(e) => update('email', e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label className="label">Phone number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} color="var(--c-text-muted)" style={{ position: 'absolute', left: 14, top: 14 }} />
                <input className="input" style={{ paddingLeft: 42 }} placeholder="e.g. 082 555 0147"
                  value={form.phone} onChange={(e) => update('phone', e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--c-text-muted)" style={{ position: 'absolute', left: 14, top: 14 }} />
                <input className="input" style={{ paddingLeft: 42 }} type="password" placeholder="At least 6 characters"
                  value={form.password} onChange={(e) => update('password', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Location & Availability */}
        {step === 1 && (
          <div className="fade-up">
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Where and when you can work</h2>
            <p style={{ color: 'var(--c-text-muted)', fontSize: 14, marginBottom: 24 }}>Employers need to know where to find you.</p>

            <div className="field">
              <label className="label">Your area or suburb</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} color="var(--c-text-muted)" style={{ position: 'absolute', left: 14, top: 14 }} />
                <input className="input" style={{ paddingLeft: 42 }} placeholder="e.g. Newcastle, KwaZulu-Natal"
                  value={form.location} onChange={(e) => update('location', e.target.value)} />
              </div>
            </div>

            <label className="label">Areas where you can accept work</label>
            <p className="hint">Tap all that apply</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {SERVICE_AREAS.map((area) => (
                <button key={area}
                  className={`chip ${form.serviceAreas.includes(area) ? 'chip-selected' : ''}`}
                  onClick={() => update('serviceAreas', toggle(form.serviceAreas, area))}
                  type="button"
                >
                  {area}
                </button>
              ))}
            </div>

            <label className="label">Days you are available</label>
            <p className="hint">Tap all that apply</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {DAYS_OF_WEEK.map((day) => (
                <button key={day}
                  className={`chip ${form.availabilityDays.includes(day) ? 'chip-selected' : ''}`}
                  onClick={() => update('availabilityDays', toggle(form.availabilityDays, day))}
                  type="button"
                >
                  <Clock size={13} /> {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Skills */}
        {step === 2 && (
          <div className="fade-up">
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>What can you do?</h2>
            <p style={{ color: 'var(--c-text-muted)', fontSize: 14, marginBottom: 24 }}>Select the services you can already provide.</p>

            <label className="label">General work</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10, marginBottom: 20 }}>
              {GENERAL_SERVICES.map((svc) => {
                const selected = form.services.includes(svc);
                return (
                  <button key={svc} type="button"
                    onClick={() => update('services', toggle(form.services, svc))}
                    style={{
                      padding: 14, borderRadius: 12, border: selected ? '1.5px solid var(--c-primary)' : '1.5px solid var(--c-border)',
                      background: selected ? 'var(--c-primary-soft)' : 'var(--c-surface)',
                      textAlign: 'center', transition: 'all 0.15s ease', position: 'relative',
                    }}>
                    {selected && (
                      <div style={{ position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, background: 'var(--c-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={10} color="#fff" strokeWidth={3} />
                      </div>
                    )}
                    <span style={{ fontSize: 13, fontWeight: 500, color: selected ? 'var(--c-primary)' : 'var(--c-text)' }}>{svc}</span>
                  </button>
                );
              })}
            </div>

            <label className="label">Skilled services</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
              {SKILLED_SERVICES.map((svc) => {
                const selected = form.services.includes(svc);
                return (
                  <button key={svc} type="button"
                    onClick={() => update('services', toggle(form.services, svc))}
                    style={{
                      padding: 14, borderRadius: 12, border: selected ? '1.5px solid var(--c-primary)' : '1.5px solid var(--c-border)',
                      background: selected ? 'var(--c-primary-soft)' : 'var(--c-surface)',
                      textAlign: 'center', transition: 'all 0.15s ease', position: 'relative',
                    }}>
                    {selected && (
                      <div style={{ position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, background: 'var(--c-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={10} color="#fff" strokeWidth={3} />
                      </div>
                    )}
                    <span style={{ fontSize: 13, fontWeight: 500, color: selected ? 'var(--c-primary)' : 'var(--c-text)' }}>{svc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Experience & Bio */}
        {step === 3 && (
          <div className="fade-up">
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Your experience and goals</h2>
            <p style={{ color: 'var(--c-text-muted)', fontSize: 14, marginBottom: 24 }}>Tell employers what you bring and what you're aiming for.</p>

            <label className="label">Experience level</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {EXPERIENCE_LEVELS.map((level) => {
                const selected = form.experience === level;
                return (
                  <button key={level} type="button"
                    onClick={() => update('experience', level)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12,
                      border: selected ? '1.5px solid var(--c-primary)' : '1.5px solid var(--c-border)',
                      background: selected ? 'var(--c-primary-soft)' : 'var(--c-surface)', textAlign: 'left',
                    }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 10, border: '2px solid',
                      borderColor: selected ? 'var(--c-primary)' : 'var(--c-border)',
                      background: selected ? 'var(--c-primary)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {selected && <Check size={12} color="#fff" strokeWidth={3} />}
                    </div>
                    <span style={{ fontWeight: 500, fontSize: 15, color: selected ? 'var(--c-primary)' : 'var(--c-text)' }}>{level}</span>
                  </button>
                );
              })}
            </div>

            <div className="field">
              <label className="label">What are you working towards? <span style={{ color: 'var(--c-text-muted)', fontWeight: 400 }}>(optional)</span></label>
              <textarea className="input" placeholder="e.g. I want to build a career in plumbing"
                value={form.goals} onChange={(e) => update('goals', e.target.value)} />
            </div>
            <div className="field">
              <label className="label">About you</label>
              <textarea className="input" placeholder="A short introduction so employers can get to know you"
                value={form.bio} onChange={(e) => update('bio', e.target.value)} />
            </div>
          </div>
        )}

        {/* Nav buttons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          {step > 0 ? (
            <button className="btn btn-secondary" onClick={back} type="button">
              <ChevronLeft size={18} /> Back
            </button>
          ) : (
            <Link to="/" className="btn btn-secondary">
              <ChevronLeft size={18} /> Home
            </Link>
          )}
          {step < TOTAL_STEPS - 1 ? (
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={next} type="button">
              Continue <ChevronRight size={18} />
            </button>
          ) : (
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={loading} type="button">
              {loading ? 'Joining…' : <>Join Waitlist <Check size={18} /></>}
            </button>
          )}
        </div>

        {step === TOTAL_STEPS - 1 && (
          <p style={{ fontSize: 12, color: 'var(--c-text-muted)', textAlign: 'center', marginTop: 12, lineHeight: 1.6 }}>
            By joining the waitlist, you agree to Yenza's terms. We'll notify you when the app is available for download.
          </p>
        )}
      </div>

      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--c-text-muted)' }}>
        Already on the waitlist? <Link to="/login" style={{ color: 'var(--c-primary)', fontWeight: 600 }}>Sign in</Link>
      </p>
    </div>
  );
}

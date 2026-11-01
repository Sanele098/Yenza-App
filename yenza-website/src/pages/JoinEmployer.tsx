import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2, ChevronLeft, ChevronRight, Check, Mail, Lock, Phone, UserRound, MapPin,
  Home, Store, Landmark, Briefcase,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { EMPLOYER_TYPES } from '../lib/constants';

const TOTAL_STEPS = 3;
const TYPE_ICONS: Record<string, typeof Home> = {
  Household: Home, Landlord: Building2, 'Small business': Store, Organisation: Landmark,
};

interface EmployerForm {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  accountType: string;
  location: string;
  bio: string;
}

const initialForm: EmployerForm = {
  fullName: '', email: '', phone: '', password: '',
  accountType: 'Household', location: '', bio: '',
};

export default function JoinEmployer() {
  const navigate = useNavigate();
  const { refreshWaitlist } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<EmployerForm>(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field: keyof EmployerForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const validate = (): boolean => {
    if (step === 0) {
      if (!form.fullName.trim()) { setError('Please enter your name or business name.'); return false; }
      if (!form.email.includes('@')) { setError('Please enter a valid email address.'); return false; }
      if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return false; }
      if (!form.phone.trim()) { setError('Please enter your phone number.'); return false; }
    }
    if (step === 1) {
      if (!form.location.trim()) { setError('Please enter your area or suburb.'); return false; }
    }
    return true;
  };

  const next = () => { if (validate()) setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1)); };
  const back = () => { setError(''); setStep((s) => Math.max(s - 1, 0)); };

  const handleSubmit = async () => {
    if (!form.bio.trim()) { setError('Tell us a bit about yourself so workers know who they are working for.'); return; }
    setLoading(true);
    setError('');

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email.trim(), password: form.password,
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
      role: 'employer',
      location: form.location,
      account_type: form.accountType,
      bio: form.bio,
    });

    setLoading(false);
    if (waitlistErr) { setError(waitlistErr.message); return; }

    await refreshWaitlist();
    navigate('/dashboard');
  };

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '48px 24px 64px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, background: 'var(--c-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
        }}>
          <Building2 size={28} color="#fff" strokeWidth={2.2} />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--c-primary)' }}>Yenza</h1>
        <p style={{ color: 'var(--c-text-muted)', marginTop: 4 }}>Join the waitlist as an employer</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} style={{
            width: 32, height: 32, borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: i === step ? '2.5px solid var(--c-primary-light)' : '1.5px solid var(--c-border)',
            background: i <= step ? 'var(--c-primary)' : 'var(--c-surface)',
          }}>
            {i < step ? <Check size={14} color="#fff" strokeWidth={3} /> :
              <span style={{ fontWeight: 600, fontSize: 13, color: i <= step ? '#fff' : 'var(--c-text-muted)' }}>{i + 1}</span>}
          </div>
        ))}
      </div>
      <p style={{ textAlign: 'center', color: 'var(--c-text-muted)', fontSize: 13, marginBottom: 28 }}>
        Step {step + 1} of {TOTAL_STEPS}
      </p>

      <div className="card" style={{ padding: 28 }}>
        {error && <div className="alert alert-error">{error}</div>}

        {/* Step 0: Account */}
        {step === 0 && (
          <div className="fade-up">
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Create your account</h2>
            <p style={{ color: 'var(--c-text-muted)', fontSize: 14, marginBottom: 24 }}>Set up your login details to start posting jobs.</p>

            <div className="field">
              <label className="label">Name or business name</label>
              <div style={{ position: 'relative' }}>
                <UserRound size={18} color="var(--c-text-muted)" style={{ position: 'absolute', left: 14, top: 14 }} />
                <input className="input" style={{ paddingLeft: 42 }} placeholder="e.g. Thandi Mthembu or Mthembu Properties"
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

        {/* Step 1: Type & Location */}
        {step === 1 && (
          <div className="fade-up">
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Tell us about yourself</h2>
            <p style={{ color: 'var(--c-text-muted)', fontSize: 14, marginBottom: 24 }}>What best describes you and where are you based?</p>

            <label className="label">What type of account is this?</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {EMPLOYER_TYPES.map(({ value, desc }) => {
                const selected = form.accountType === value;
                const Icon = TYPE_ICONS[value] ?? Briefcase;
                return (
                  <button key={value} type="button"
                    onClick={() => update('accountType', value)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12,
                      border: selected ? '1.5px solid var(--c-primary)' : '1.5px solid var(--c-border)',
                      background: selected ? 'var(--c-primary-soft)' : 'var(--c-surface)', textAlign: 'left',
                    }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: selected ? 'var(--c-primary)' : 'var(--c-primary-soft)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon size={20} color={selected ? '#fff' : 'var(--c-primary)'} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: selected ? 'var(--c-primary)' : 'var(--c-text)' }}>{value}</div>
                      <div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>{desc}</div>
                    </div>
                    <div style={{
                      width: 20, height: 20, borderRadius: 10, border: '2px solid',
                      borderColor: selected ? 'var(--c-primary)' : 'var(--c-border)',
                      background: selected ? 'var(--c-primary)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {selected && <Check size={12} color="#fff" strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="field">
              <label className="label">Your area or suburb</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} color="var(--c-text-muted)" style={{ position: 'absolute', left: 14, top: 14 }} />
                <input className="input" style={{ paddingLeft: 42 }} placeholder="e.g. Sandton, Gauteng"
                  value={form.location} onChange={(e) => update('location', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Bio */}
        {step === 2 && (
          <div className="fade-up">
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>About you</h2>
            <p style={{ color: 'var(--c-text-muted)', fontSize: 14, marginBottom: 24 }}>A short introduction so workers know who they are working for.</p>

            <div className="field">
              <label className="label">About you or your business</label>
              <p className="hint">e.g. "I am a homeowner in Sandton looking for reliable help with cleaning and garden maintenance"</p>
              <textarea className="input" placeholder="Describe yourself or your business…"
                value={form.bio} onChange={(e) => update('bio', e.target.value)} />
            </div>
          </div>
        )}

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

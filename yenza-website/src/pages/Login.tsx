import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wrench, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await signIn(email.trim(), password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div style={{ maxWidth: 440, margin: '0 auto', padding: '64px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, background: 'var(--c-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
        }}>
          <Wrench size={28} color="#fff" strokeWidth={2.2} />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--c-primary)' }}>Yenza</h1>
        <p style={{ color: 'var(--c-text-muted)', marginTop: 4 }}>Sign in to check your waitlist status</p>
      </div>

      <div className="card" style={{ padding: 28 }}>
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">Email address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--c-text-muted)" style={{ position: 'absolute', left: 14, top: 14 }} />
              <input className="input" style={{ paddingLeft: 42 }} type="email" placeholder="you@example.co.za"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>
          <div className="field">
            <label className="label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--c-text-muted)" style={{ position: 'absolute', left: 14, top: 14 }} />
              <input className="input" style={{ paddingLeft: 42 }} type="password" placeholder="Your password"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </div>
          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : <>Sign In <ArrowRight size={18} /></>}
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <p style={{ fontSize: 14, color: 'var(--c-text-muted)', marginBottom: 12 }}>
          Not on the waitlist yet?
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/join/worker" className="btn btn-secondary">Join as Worker</Link>
          <Link to="/join/employer" className="btn btn-secondary">Join as Employer</Link>
        </div>
      </div>
    </div>
  );
}

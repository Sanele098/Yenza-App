import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, type WaitlistEntry } from './supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  waitlistEntry: WaitlistEntry | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshWaitlist: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [waitlistEntry, setWaitlistEntry] = useState<WaitlistEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const loadWaitlist = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('waitlist_entries')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();
    if (!error && data) {
      setWaitlistEntry(data as WaitlistEntry);
    } else {
      setWaitlistEntry(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadWaitlist(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        loadWaitlist(newSession.user.id);
      } else {
        setWaitlistEntry(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [loadWaitlist]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setWaitlistEntry(null);
  }, []);

  const refreshWaitlist = useCallback(async () => {
    if (user) await loadWaitlist(user.id);
  }, [user, loadWaitlist]);

  return (
    <AuthContext.Provider value={{ session, user, waitlistEntry, loading, signIn, signOut, refreshWaitlist }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

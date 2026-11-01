import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export interface WaitlistEntry {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string;
  role: 'worker' | 'employer';
  location: string;
  account_type: string | null;
  services: string[];
  service_areas: string[];
  availability_days: string[];
  experience_level: string | null;
  goals: string | null;
  bio: string | null;
  identity_verified: boolean;
  qualifications_verified: boolean;
  app_access_granted: boolean;
  waitlist_position: number;
  created_at: string;
  updated_at: string;
}

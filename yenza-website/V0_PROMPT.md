# Yenza Website — Complete Build Prompt for v0

## What is Yenza

Yenza is a South African local-services marketplace that connects skilled and general workers (plumbers, electricians, cleaners, gardeners, painters, etc.) with employers who need them. The mobile app is built in Expo and is in development. This website is the marketing site + waitlist registration portal. It shares the same Supabase backend as the mobile app.

---

## Tech Stack

- **React 18** + **Vite 5** (TypeScript)
- **react-router-dom v6** for routing
- **@supabase/supabase-js v2** for database + auth
- **lucide-react** for icons
- Plain inline styles (no Tailwind, no CSS framework) — CSS variables defined in index.css

---

## Environment Variables

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=https://owwatfoczciniljhqyeh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93d2F0Zm9jemNpbmlsamhxeWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyMDkxNjksImV4cCI6MjEwNzc4NTE2OX0.EC0_EatRHikzT_zzP-dhLl9-UwNYUCzncYqAKEgCfpY
```

---

## Supabase Client Setup

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
```

---

## Auth System

- **Email/password only** (no social login, no magic links)
- Email confirmation is OFF (users can sign in immediately after sign-up)
- Supabase manages sessions — use `supabase.auth.getSession()`, `supabase.auth.onAuthStateChange()`, `supabase.auth.signInWithPassword()`, `supabase.auth.signUp()`, `supabase.auth.signOut()`

### Auth Context Pattern

```typescript
// On mount: get session, load waitlist entry for the user
// On auth state change: update session, reload waitlist entry
// Waitlist entry is loaded from: supabase.from('waitlist_entries').select('*').eq('user_id', uid).maybeSingle()
```

---

## Database Schema (16 tables in `public` schema)

All tables have RLS enabled. The website primarily interacts with `waitlist_entries`, `profiles`, and `services`. The mobile app uses the full set.

### 1. `waitlist_entries` — the main table the website uses

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| user_id | uuid | nullable | | FK to auth.users |
| email | text | NOT NULL | | |
| full_name | text | NOT NULL | | |
| phone | text | NOT NULL | | |
| role | text | NOT NULL | | 'worker' or 'employer' |
| location | text | NOT NULL | | |
| account_type | text | nullable | | Employer only: 'Household', 'Landlord', 'Small business', 'Organisation' |
| services | jsonb | | '[]' | Worker only: array of service name strings |
| service_areas | jsonb | | '[]' | Worker only: array of area name strings |
| availability_days | jsonb | | '[]' | Worker only: array of day name strings |
| experience_level | text | nullable | | Worker only |
| goals | text | nullable | | Worker only |
| bio | text | nullable | | |
| identity_verified | boolean | NOT NULL | false | |
| qualifications_verified | boolean | NOT NULL | false | |
| app_access_granted | boolean | NOT NULL | false | |
| waitlist_position | integer | NOT NULL | | Auto-assigned |
| created_at | timestamptz | NOT NULL | now() | |
| updated_at | timestamptz | NOT NULL | now() | |

**RLS policies for waitlist_entries:**
- SELECT: `auth.uid() = user_id` (authenticated only)
- INSERT: `auth.uid() = user_id` (authenticated only)
- UPDATE: `auth.uid() = user_id` (authenticated only)

### 2. `profiles` — full user profiles (used by mobile app, readable by all authenticated users)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NOT NULL | | PK, matches auth.users.id |
| first_name | text | NOT NULL | '' | |
| surname | text | NOT NULL | '' | |
| display_name | text | NOT NULL | '' | |
| phone | text | nullable | | |
| email | text | nullable | | |
| preferred_language | text | | 'English' | |
| bio | text | | '' | |
| profile_photo | text | | '' | Storage URL |
| role | text | NOT NULL | 'worker' | 'worker' or 'employer' |
| account_type | text | nullable | | |
| primary_location | text | | '' | |
| service_areas | jsonb | | '[]' | |
| availability | jsonb | | '{}' | { days: string[] } |
| worker_status | text | | 'available' | |
| identity_verified | boolean | | false | |
| is_available | boolean | | true | |
| experience_level | text | | '' | |
| experience_detail | text | | '' | |
| qualifications_summary | jsonb | | '[]' | |
| profile_photo_set | boolean | | false | |
| created_at | timestamptz | | now() | |
| updated_at | timestamptz | | now() | |

**RLS policies:** SELECT = true (all authenticated), INSERT/UPDATE = `auth.uid() = id`

### 3. `services` — service catalogue (publicly readable)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | NOT NULL |
| category | text | NOT NULL |
| slug | text | NOT NULL |
| active | boolean | default true |
| created_at | timestamptz | default now() |

**RLS:** SELECT for `anon, authenticated` (publicly readable)

### 4. `jobs` — job postings

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| employer_id | uuid | NOT NULL, FK → profiles |
| assigned_worker_id | uuid | nullable, FK → profiles |
| service_id | uuid | nullable, FK → services |
| title | text | NOT NULL |
| description | text | default '' |
| job_location | text | NOT NULL |
| private_address | text | default '' |
| budget | numeric | NOT NULL, default 0 |
| agreed_price | numeric | nullable |
| pricing_type | text | default 'fixed' |
| requested_date | text | |
| requested_time | text | |
| confirmed_date | text | |
| confirmed_time | text | |
| estimated_duration | text | default '' |
| materials_required | text | default '' |
| latitude | double precision | default 0 |
| longitude | double precision | default 0 |
| status | text | NOT NULL, default 'Available' |
| completion_details | jsonb | default '{}' |
| fulfillment_mode | text | NOT NULL, default 'instant_accept' — 'instant_accept' or 'application' |
| budget_min | numeric | nullable |
| budget_max | numeric | nullable |
| currency | text | NOT NULL, default 'ZAR' |
| materials_provided | boolean | default false |
| application_deadline | timestamptz | nullable |
| scheduled_start_at | timestamptz | nullable |
| assigned_at | timestamptz | nullable |
| started_at | timestamptz | nullable |
| completed_at | timestamptz | nullable |
| cancelled_at | timestamptz | nullable |
| cancellation_reason | text | default '' |
| cancellation_by | text | nullable |
| preferred_payment_method | text | NOT NULL, default 'cash' |
| is_remote | boolean | NOT NULL, default false |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

**RLS:** SELECT = true (all authenticated), INSERT/UPDATE = `auth.uid() = employer_id`, DELETE = employer AND status not in assigned/in_progress/awaiting_confirmation

**Job statuses:** Available → assigned → in_progress → awaiting_confirmation → completed (or cancelled)

### 5. `job_applications`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| job_id | uuid | NOT NULL, FK → jobs |
| worker_id | uuid | NOT NULL, FK → profiles |
| message | text | default '' |
| proposed_price | numeric | nullable |
| estimated_duration | text | default '' |
| status | text | NOT NULL, default 'pending' |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

**RLS:** SELECT = worker OR job's employer, INSERT = worker, UPDATE = worker OR job's employer, DELETE = worker

### 6. `worker_services`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| worker_id | uuid | NOT NULL, FK → profiles |
| service_id | uuid | NOT NULL, FK → services |
| experience_level | text | default '' |
| years_experience | text | default '' |
| description | text | default '' |
| starting_price | numeric | default 0 |
| pricing_type | text | default 'fixed' |
| active | boolean | default true |
| created_at | timestamptz | default now() |

**RLS:** SELECT = true (all authenticated), INSERT/UPDATE/DELETE = `auth.uid() = worker_id`

### 7. `worker_credentials`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| worker_id | uuid | NOT NULL, FK → profiles |
| credential_name | text | NOT NULL |
| institution | text | default '' |
| type | text | default 'qualification' |
| field_of_study | text | default '' |
| issue_date | date | nullable |
| expiry_date | date | nullable |
| document_path | text | default '' |
| verification_status | text | NOT NULL, default 'not_verified' |
| reviewer_id | uuid | nullable |
| review_date | timestamptz | nullable |
| notes | text | default '' |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

**RLS:** All CRUD = `auth.uid() = worker_id`

### 8. `job_photos`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| job_id | uuid | NOT NULL, FK → jobs |
| worker_id | uuid | NOT NULL, default auth.uid() |
| storage_path | text | NOT NULL |
| public_url | text | NOT NULL |
| caption | text | default '' |
| created_at | timestamptz | NOT NULL, default now() |
| photo_type | text | NOT NULL, default 'work' — 'work' or 'listing' |

**RLS:** SELECT = listing photos are public, work photos visible to assigned worker + job employer. INSERT/DELETE restricted by role.

### 9. `job_files`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| job_id | uuid | NOT NULL, FK → jobs |
| uploader_id | uuid | nullable, FK → profiles |
| file_path | text | NOT NULL |
| file_type | text | default 'image' |
| purpose | text | default 'job_reference' |
| caption | text | default '' |
| created_at | timestamptz | default now() |

### 10. `earnings`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| worker_id | uuid | NOT NULL, FK → profiles |
| job_id | uuid | NOT NULL, FK → jobs |
| employer_id | uuid | NOT NULL, FK → profiles |
| amount | numeric | NOT NULL (net amount after commission) |
| currency | text | NOT NULL, default 'ZAR' |
| status | text | NOT NULL, default 'pending' |
| payment_id | uuid | nullable, FK → payments |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |
| cash_confirmed_at | timestamptz | nullable |
| gross_amount | numeric | NOT NULL, default 0 |
| commission_amount | numeric | NOT NULL, default 0 |

**RLS:** SELECT = worker OR employer, UPDATE = worker only

### 11. `payments`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| job_id | uuid | NOT NULL, FK → jobs |
| employer_id | uuid | NOT NULL, FK → profiles |
| worker_id | uuid | NOT NULL, FK → profiles |
| amount | numeric | NOT NULL |
| method | text | NOT NULL — 'cash', 'card', 'eft' |
| status | text | NOT NULL, default 'pending' |
| reference | text | default '' |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

**RLS:** SELECT = employer OR worker, INSERT/UPDATE = employer only

### 12. `withdrawals`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| worker_id | uuid | NOT NULL, FK → profiles |
| amount | numeric | NOT NULL |
| method | text | NOT NULL |
| status | text | NOT NULL, default 'requested' |
| bank_details | jsonb | default '{}' |
| processed_at | timestamptz | nullable |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

**RLS:** SELECT/INSERT = `auth.uid() = worker_id`

### 13. `reviews`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| job_id | uuid | NOT NULL, FK → jobs |
| reviewer_id | uuid | NOT NULL, FK → profiles |
| reviewed_id | uuid | NOT NULL, FK → profiles |
| rating | integer | NOT NULL (1-5) |
| written_review | text | default '' |
| is_visible | boolean | default true |
| created_at | timestamptz | default now() |

**RLS:** SELECT = visible OR reviewer OR reviewed, INSERT/UPDATE/DELETE = reviewer only

### 14. `ai_diagnoses`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| worker_id | uuid | NOT NULL, default auth.uid() |
| job_id | uuid | nullable, FK → jobs |
| mode | text | NOT NULL, default 'do' — 'do' or 'learn' |
| language | text | NOT NULL, default 'en' — 'en' or 'zu' |
| description | text | NOT NULL |
| photo_url | text | nullable |
| problem_title | text | NOT NULL |
| explanation | text | NOT NULL |
| safety_warning | text | NOT NULL |
| needs_professional | boolean | NOT NULL, default false |
| tools | jsonb | NOT NULL, default '[]' — [{name, essential}] |
| steps | jsonb | NOT NULL, default '[]' — [{title, instruction, safetyNote}] |
| estimated_time | text | NOT NULL, default '' |
| estimated_cost | text | NOT NULL, default '' |
| confidence | text | NOT NULL, default 'medium' — 'low'/'medium'/'high' |
| created_at | timestamptz | NOT NULL, default now() |

**RLS:** All CRUD = `auth.uid() = worker_id`

### 15. `ai_conversations`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| diagnosis_id | uuid | NOT NULL, FK → ai_diagnoses |
| worker_id | uuid | NOT NULL, default auth.uid() |
| role | text | NOT NULL — 'worker' or 'ai' |
| message | text | NOT NULL |
| created_at | timestamptz | NOT NULL, default now() |

**RLS:** All CRUD = `auth.uid() = worker_id`

### 16. `skill_gap_analyses`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| worker_id | uuid | NOT NULL, default auth.uid() |
| current_skills | jsonb | NOT NULL, default '[]' |
| experience_level | text | NOT NULL, default '' |
| location | text | NOT NULL, default '' |
| summary | text | NOT NULL, default '' |
| milestones | jsonb | NOT NULL, default '[]' |
| skill_snapshot_hash | text | NOT NULL, default '' |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, default now() |

**RLS:** All CRUD = `auth.uid() = worker_id`. Unique constraint on worker_id (one analysis per worker).

---

## Foreign Key Relationships

```
profiles (id) ←── jobs (employer_id, assigned_worker_id)
profiles (id) ←── job_applications (worker_id)
jobs (id) ←── job_applications (job_id)
profiles (id) ←── worker_services (worker_id)
services (id) ←── worker_services (service_id)
profiles (id) ←── worker_credentials (worker_id, reviewer_id)
profiles (id) ←── earnings (worker_id, employer_id)
jobs (id) ←── earnings (job_id)
payments (id) ←── earnings (payment_id)
profiles (id) ←── payments (employer_id, worker_id)
jobs (id) ←── payments (job_id)
profiles (id) ←── reviews (reviewer_id, reviewed_id)
jobs (id) ←── reviews (job_id)
profiles (id) ←── ai_diagnoses (worker_id)
jobs (id) ←── ai_diagnoses (job_id)
ai_diagnoses (id) ←── ai_conversations (diagnosis_id)
profiles (id) ←── ai_conversations (worker_id)
profiles (id) ←── withdrawals (worker_id)
profiles (id) ←── job_photos (worker_id)
jobs (id) ←── job_photos (job_id)
profiles (id) ←── job_files (uploader_id)
jobs (id) ←── job_files (job_id)
```

---

## RPC Functions (all SECURITY DEFINER, plpgsql)

These are server-side functions called via `supabase.rpc()`:

| Function | Arguments | Returns | Purpose |
|----------|-----------|---------|---------|
| `apply_for_job` | p_job_id uuid, p_message text, p_proposed_price numeric, p_estimated_duration text | jsonb | Worker applies to an application-mode job |
| `claim_job` | p_job_id uuid | jsonb | Worker instantly accepts an instant-accept job |
| `select_worker` | p_application_id uuid | jsonb | Employer selects a worker from applications |
| `start_job` | p_job_id uuid | jsonb | Worker starts an assigned job |
| `submit_completion` | p_job_id uuid, p_notes text | jsonb | Worker submits job as complete |
| `confirm_completion` | p_job_id uuid | jsonb | Employer confirms job is complete (creates earning) |
| `cancel_job` | p_job_id uuid, p_reason text | jsonb | Either party cancels a job |
| `reopen_job` | p_job_id uuid | jsonb | Reopen a cancelled or completed job |
| `record_payment` | p_job_id uuid, p_method text, p_reference text | jsonb | Employer records a payment (cash/card/eft) |
| `confirm_cash_received` | p_earning_id uuid | jsonb | Worker confirms they received cash |
| `request_withdrawal` | p_amount numeric, p_method text, p_bank_details jsonb | jsonb | Worker requests a payout |

---

## Storage Buckets

| Bucket | Public | Max Size | Allowed Types | Purpose |
|--------|--------|----------|---------------|---------|
| job-photos | yes | 10 MB | jpeg, png, webp | Job listing + work photos |
| profile-photos | yes | 5 MB | jpeg, png, webp | Worker/employer profile photos |

---

## Edge Functions

### `yenza-ai` (requires JWT auth)
Base URL: `https://owwatfoczciniljhqyeh.supabase.co/functions/v1/yenza-ai`

**Routes:**
1. **POST /** (main diagnosis) — sends description + optional photo to Gemini AI, returns structured diagnosis with steps, tools, safety warnings. Saves to `ai_diagnoses` table.
2. **POST /ask** (follow-up Q&A) — sends a question about a previous diagnosis, returns AI answer. Saves to `ai_conversations` table.
3. **POST /skill-gap** — generates a personalised skill learning path. Saves to `skill_gap_analyses` table.

**Request body for diagnosis:**
```json
{
  "description": "The tap is leaking",
  "imageData": "base64_string_or_null",
  "jobTitle": "optional",
  "jobCategory": "optional",
  "jobId": "optional_uuid",
  "mode": "do",  // or "learn"
  "language": "en"  // or "zu" for isiZulu
}
```

**Request body for /ask:**
```json
{
  "diagnosisId": "uuid",
  "question": "What wrench do I need?",
  "context": "previous diagnosis context",
  "language": "en"
}
```

**Request body for /skill-gap:**
```json
{
  "currentSkills": ["Plumbing", "Painting"],
  "experienceLevel": "3-5 years",
  "location": "Newcastle, KZN",
  "language": "en"
}
```

### `seed-demo-users` (public, no JWT)
Seeds demo accounts: `sanele.b@example.co.za` (worker) and `thandi.m@example.co.za` (employer). Password: `YenzaWorker2026!`

---

## Theme / Design System

```typescript
export const theme = {
  primary: '#0F766E',       // teal
  primaryDark: '#0B5A54',
  primaryLight: '#14B8A6',
  primarySoft: '#E6F4F2',
  secondary: '#F59E0B',     // amber
  secondarySoft: '#FEF3C7',
  accent: '#3B82F6',        // blue
  success: '#16A34A',
  successSoft: '#DCFCE7',
  warning: '#EAB308',
  warningSoft: '#FEF9C3',
  error: '#DC2626',
  errorSoft: '#FEE2E2',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  overlay: 'rgba(15, 23, 42, 0.6)',
};
```

CSS variables should be set as `--c-primary`, `--c-primary-dark`, `--c-primary-light`, `--c-primary-soft`, `--c-secondary`, `--c-secondary-soft`, `--c-accent`, `--c-success`, `--c-success-soft`, `--c-warning`, `--c-warning-soft`, `--c-error`, `--c-error-soft`, `--c-bg`, `--c-surface`, `--c-card`, `--c-text`, `--c-text-secondary`, `--c-text-muted`, `--c-border`, `--c-border-light`, `--c-overlay`.

---

## Constants

```typescript
const GENERAL_SERVICES = ['Cleaning', 'Gardening', 'Moving Assistance', 'Painting', 'Car Washing', 'Event Assistance', 'General Labour'];
const SKILLED_SERVICES = ['Plumbing', 'Electrical', 'Carpentry', 'Welding', 'Tiling', 'Mechanics', 'Solar Installation'];
const ALL_SERVICES = [...GENERAL_SERVICES, ...SKILLED_SERVICES]; // 14 total

const SERVICE_AREAS = ['Newcastle CBD', 'Madadeni', 'Osizweni', 'Hutten Heights', 'Arbor Park', 'Charlestown', 'Fernwood'];

const EXPERIENCE_LEVELS = ['New to the trade', '1–2 years', '3–5 years', '5+ years'];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const EMPLOYER_TYPES = [
  { value: 'Household', desc: 'Hiring for your home' },
  { value: 'Landlord', desc: 'Managing rental properties' },
  { value: 'Small business', desc: 'A local business or shop' },
  { value: 'Organisation', desc: 'NGO, church, or institution' },
];
```

---

## Pages & Routes

| Route | Page | Auth Required | Purpose |
|-------|------|---------------|---------|
| `/` | Landing | No | Hero, features, CTA to join waitlist |
| `/how-it-works` | HowItWorks | No | Explains the platform for workers and employers |
| `/about` | About | No | Company story, mission |
| `/join/worker` | JoinWorker | No | 4-step wizard: account → location → skills → experience/bio |
| `/join/employer` | JoinEmployer | No | 3-step wizard: account → type/location → bio |
| `/login` | Login | No | Email/password sign in |
| `/dashboard` | Dashboard | Yes | Shows waitlist position, verification status, profile details |

### Page Details

**Landing:** Teal gradient hero with "Work. Earn. Grow." headline. Split section for Workers vs Employers with feature lists. CTA banner at bottom. Stats: 500+ on waitlist, 17 service categories, 7 areas.

**JoinWorker (4 steps):**
1. Account: full name, email, phone, password
2. Location: area/suburb text input, service area chips (multi-select), availability day chips (multi-select)
3. Skills: general services grid (multi-select), skilled services grid (multi-select)
4. Experience: radio buttons for experience level, goals textarea (optional), bio textarea

On submit: `supabase.auth.signUp()` → if no session, `signInWithPassword()` → insert into `waitlist_entries` → navigate to `/dashboard`

**JoinEmployer (3 steps):**
1. Account: name/business name, email, phone, password
2. Type: employer type cards (Household/Landlord/Small business/Organisation), location
3. Bio: textarea

Same auth flow as JoinWorker.

**Dashboard:** Shows welcome banner with waitlist position, app status card ("app in development"), profile details (role, email, phone, location, join date), verification checklist (identity, qualifications, professional registration for workers; identity, business verification for employers), "what happens next" steps, selected services preview for workers.

**Login:** Email + password, calls `signInWithPassword()`, redirects to `/dashboard` on success.

---

## SiteLayout Component

A shared layout with a sticky header containing the Yenza logo, nav links (Home, How it Works, About), and auth-aware buttons (Sign In / Dashboard / Sign Out). Footer with company info, links, and social.

---

## Build Instructions for v0

1. Create a Vite + React + TypeScript project
2. Install: `@supabase/supabase-js`, `react-router-dom`, `lucide-react`
3. Set up the `.env` file with the two VITE_ variables above
4. Create the Supabase client, auth context, and constants as described
5. Build all 7 pages with the routes above
6. Use the teal/amber theme colors specified
7. Use inline styles matching the existing pattern (no Tailwind)
8. The waitlist sign-up flow creates a Supabase auth user, then inserts a row into `waitlist_entries` with `user_id` set to the new auth user's ID
9. The dashboard reads the `waitlist_entries` row for the signed-in user and displays their waitlist position and verification status
10. All pages should be responsive (mobile-first)

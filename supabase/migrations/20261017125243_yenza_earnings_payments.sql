/*
# Yenza earnings and payments system

## Summary
Creates the earnings ledger and payments tables so workers can track
income from completed jobs, employers can pay (cash or EFT/card), and
workers can request withdrawals of their available balance.

## 1. New Tables

### payments
Records how the employer paid the worker for a completed job.
- id (uuid PK)
- job_id (uuid FK → jobs.id)
- employer_id (uuid FK → profiles.id)
- worker_id (uuid FK → profiles.id)
- amount numeric NOT NULL
- method: 'cash' | 'eft' | 'card'
- status: 'pending' | 'completed' | 'failed'
- reference text (optional payment reference / transaction ID)
- created_at, updated_at

### earnings
One row per completed job — the money owed to the worker.
- id (uuid PK)
- worker_id (uuid FK → profiles.id)
- job_id (uuid FK → jobs.id, unique — one earning per job)
- employer_id (uuid FK → profiles.id)
- amount numeric NOT NULL
- currency text DEFAULT 'ZAR'
- status: 'pending' | 'available' | 'withdrawn'
  - pending: job completed but employer hasn't paid yet
  - available: employer confirmed payment (cash or EFT/card) → available for withdrawal
  - withdrawn: worker has withdrawn this amount
- payment_id (uuid FK → payments.id, nullable — links to employer payment)
- created_at, updated_at

### withdrawals
Worker requests to withdraw available balance.
- id (uuid PK)
- worker_id (uuid FK → profiles.id)
- amount numeric NOT NULL
- method: 'cash' | 'bank_transfer' | 'e_wallet'
- status: 'requested' | 'processing' | 'completed' | 'rejected'
- bank_details jsonb
- processed_at timestamptz
- created_at, updated_at

## 2. Security (RLS)
- earnings: worker can read own; employer can read for their jobs
- payments: employer and worker involved can read; employer can create/update
- withdrawals: worker can read own and create own; no direct updates

## 3. Lifecycle
1. Worker submits completion → job status = awaiting_confirmation
2. Employer confirms completion → job status = completed,
   a pending earning is created automatically
3. Employer records payment (cash/EFT/card) → earning moves to 'available'
4. Worker requests withdrawal of available balance
5. Withdrawal is processed (future: admin/support handles this)

## Important Notes
1. payments table created BEFORE earnings (FK dependency).
2. The unique constraint on job_id in earnings prevents duplicate earnings.
3. Balance calculations are done via SQL aggregation, not a stored balance column.
*/

-- ============================================================
-- PAYMENTS TABLE (created first — earnings references it)
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  employer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount >= 0),
  method text NOT NULL CHECK (method IN ('cash', 'eft', 'card')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  reference text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_participant_payments" ON payments;
CREATE POLICY "select_participant_payments" ON payments FOR SELECT
  TO authenticated USING (
    auth.uid() = employer_id OR auth.uid() = worker_id
  );

DROP POLICY IF EXISTS "insert_employer_payments" ON payments;
CREATE POLICY "insert_employer_payments" ON payments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = employer_id);

DROP POLICY IF EXISTS "update_employer_payments" ON payments;
CREATE POLICY "update_employer_payments" ON payments FOR UPDATE
  TO authenticated USING (auth.uid() = employer_id)
  WITH CHECK (auth.uid() = employer_id);

CREATE INDEX IF NOT EXISTS idx_payments_employer ON payments(employer_id);
CREATE INDEX IF NOT EXISTS idx_payments_worker ON payments(worker_id);
CREATE INDEX IF NOT EXISTS idx_payments_job ON payments(job_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ============================================================
-- EARNINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id uuid NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
  employer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'ZAR',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'withdrawn')),
  payment_id uuid REFERENCES payments(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_earnings" ON earnings;
CREATE POLICY "select_own_earnings" ON earnings FOR SELECT
  TO authenticated USING (
    auth.uid() = worker_id OR auth.uid() = employer_id
  );

-- Workers cannot directly insert/delete earnings — only RPC functions do that
DROP POLICY IF EXISTS "update_own_earnings" ON earnings;
CREATE POLICY "update_own_earnings" ON earnings FOR UPDATE
  TO authenticated USING (auth.uid() = worker_id)
  WITH CHECK (auth.uid() = worker_id);

CREATE INDEX IF NOT EXISTS idx_earnings_worker ON earnings(worker_id);
CREATE INDEX IF NOT EXISTS idx_earnings_status ON earnings(status);
CREATE INDEX IF NOT EXISTS idx_earnings_job ON earnings(job_id);

-- ============================================================
-- WITHDRAWALS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  method text NOT NULL CHECK (method IN ('cash', 'bank_transfer', 'e_wallet')),
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'processing', 'completed', 'rejected')),
  bank_details jsonb DEFAULT '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_withdrawals" ON withdrawals;
CREATE POLICY "select_own_withdrawals" ON withdrawals FOR SELECT
  TO authenticated USING (auth.uid() = worker_id);

DROP POLICY IF EXISTS "insert_own_withdrawals" ON withdrawals;
CREATE POLICY "insert_own_withdrawals" ON withdrawals FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = worker_id);

CREATE INDEX IF NOT EXISTS idx_withdrawals_worker ON withdrawals(worker_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
DROP TRIGGER IF EXISTS trigger_earnings_updated_at ON earnings;
CREATE TRIGGER trigger_earnings_updated_at BEFORE UPDATE ON earnings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_payments_updated_at ON payments;
CREATE TRIGGER trigger_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_withdrawals_updated_at ON withdrawals;
CREATE TRIGGER trigger_withdrawals_updated_at BEFORE UPDATE ON withdrawals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

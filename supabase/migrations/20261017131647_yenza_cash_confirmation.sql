/*
# Yenza cash confirmation + payment method flow

## Summary
1. Adds preferred_payment_method column to jobs (cash or card)
2. Adds 'cash_pending' earning status — when employer pays cash, the worker
   must confirm receipt before the earning becomes available
3. Adds confirm_cash_received RPC — worker confirms they got the cash
4. Updates record_payment: for cash, earning → cash_pending; for card/eft,
   earning → available immediately

## Payment flow
- Employer posts job with preferred_payment_method ('cash' | 'card')
- Worker completes job → employer confirms → pending earning created
- Employer records payment:
  - Card/EFT: earning immediately → 'available' (worker can withdraw)
  - Cash: earning → 'cash_pending' (waiting for worker to confirm receipt)
- Worker taps "Confirm cash received" → earning → 'available'

## Statuses
- pending: job completed, employer hasn't paid yet
- cash_pending: employer marked cash paid, waiting for worker confirmation
- available: worker can withdraw
- withdrawn: worker has withdrawn this amount
*/

-- Add preferred_payment_method to jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS preferred_payment_method text
  NOT NULL DEFAULT 'cash'
  CHECK (preferred_payment_method IN ('cash', 'card'));

-- Update earnings status constraint to include cash_pending
ALTER TABLE earnings DROP CONSTRAINT IF EXISTS earnings_status_check;
ALTER TABLE earnings ADD CONSTRAINT earnings_status_check
  CHECK (status IN ('pending', 'cash_pending', 'available', 'withdrawn'));

-- Add cash_confirmed_at timestamp to earnings
ALTER TABLE earnings ADD COLUMN IF NOT EXISTS cash_confirmed_at timestamptz;

-- ============================================================
-- confirm_completion (updated to capture preferred_payment_method)
-- ============================================================
CREATE OR REPLACE FUNCTION confirm_completion(p_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_employer_id uuid := auth.uid();
  v_result RECORD;
  v_amount numeric;
  v_worker_id uuid;
  v_existing_earning_id uuid;
BEGIN
  IF v_employer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  UPDATE jobs
  SET status = 'completed', completed_at = now(), updated_at = now()
  WHERE id = p_job_id
    AND status = 'awaiting_confirmation'
    AND employer_id = v_employer_id
  RETURNING id, title, status, assigned_worker_id,
    COALESCE(agreed_price, budget_max, budget_min, budget, 0) AS earn_amount
  INTO v_result;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Job is not awaiting confirmation or you are not the employer');
  END IF;

  v_amount := v_result.earn_amount;
  v_worker_id := v_result.assigned_worker_id;

  IF v_worker_id IS NOT NULL THEN
    SELECT id INTO v_existing_earning_id FROM earnings WHERE job_id = p_job_id;
    IF v_existing_earning_id IS NULL THEN
      INSERT INTO earnings (worker_id, job_id, employer_id, amount, currency, status)
      VALUES (v_worker_id, p_job_id, v_employer_id, v_amount, 'ZAR', 'pending');
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'job_id', v_result.id,
    'status', v_result.status,
    'earning_amount', v_amount
  );
END;
$$;

-- ============================================================
-- record_payment (updated: cash → cash_pending, card/eft → available)
-- ============================================================
CREATE OR REPLACE FUNCTION record_payment(
  p_job_id uuid,
  p_method text,
  p_reference text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_employer_id uuid := auth.uid();
  v_job RECORD;
  v_payment_id uuid;
  v_earning_id uuid;
  v_amount numeric;
  v_new_status text;
BEGIN
  IF v_employer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF p_method NOT IN ('cash', 'eft', 'card') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid payment method');
  END IF;

  SELECT status, employer_id, assigned_worker_id,
    COALESCE(agreed_price, budget_max, budget_min, budget, 0) AS earn_amount
  INTO v_job
  FROM jobs WHERE id = p_job_id;

  IF v_job.status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Job not found');
  END IF;
  IF v_job.employer_id != v_employer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only the job owner can record payment');
  END IF;
  IF v_job.status != 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Job must be completed before recording payment');
  END IF;
  IF v_job.assigned_worker_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No worker assigned to this job');
  END IF;

  v_amount := v_job.earn_amount;
  v_new_status := CASE WHEN p_method = 'cash' THEN 'cash_pending' ELSE 'available' END;

  INSERT INTO payments (job_id, employer_id, worker_id, amount, method, status, reference)
  VALUES (p_job_id, v_employer_id, v_job.assigned_worker_id, v_amount, p_method, 'completed', p_reference)
  RETURNING id INTO v_payment_id;

  UPDATE earnings
  SET status = v_new_status, payment_id = v_payment_id, updated_at = now()
  WHERE job_id = p_job_id AND status = 'pending'
  RETURNING id INTO v_earning_id;

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'earning_id', v_earning_id,
    'amount', v_amount,
    'method', p_method,
    'earning_status', v_new_status
  );
END;
$$;

-- ============================================================
-- confirm_cash_received: worker confirms they received cash
-- ============================================================
CREATE OR REPLACE FUNCTION confirm_cash_received(p_earning_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_worker_id uuid := auth.uid();
  v_earning RECORD;
BEGIN
  IF v_worker_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT id, worker_id, status, amount, job_id INTO v_earning
  FROM earnings WHERE id = p_earning_id;

  IF v_earning.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Earning not found');
  END IF;
  IF v_earning.worker_id != v_worker_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You can only confirm your own earnings');
  END IF;
  IF v_earning.status != 'cash_pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This earning is not waiting for cash confirmation');
  END IF;

  UPDATE earnings
  SET status = 'available', cash_confirmed_at = now(), updated_at = now()
  WHERE id = p_earning_id;

  RETURN jsonb_build_object(
    'success', true,
    'earning_id', p_earning_id,
    'amount', v_earning.amount,
    'status', 'available'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION confirm_completion(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION record_payment(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_cash_received(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION request_withdrawal(numeric, text, jsonb) TO authenticated;

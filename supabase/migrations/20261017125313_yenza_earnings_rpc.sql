/*
# Yenza earnings RPC functions

## Summary
Updates confirm_completion to auto-create a pending earning when a job
is completed, and adds functions for recording employer payments and
worker withdrawal requests.

## Functions

### confirm_completion (updated)
Now creates a pending earning row automatically when the employer
confirms job completion. The earning amount comes from the job's
agreed_price or budget_max or budget. The earning stays 'pending'
until the employer records a payment.

### record_payment
Employer records how they paid the worker (cash/EFT/card).
- Verifies employer owns the job
- Verifies job is completed
- Creates a payment record
- Marks the matching earning as 'available' (worker can now withdraw)
- Returns the payment and earning info

### request_withdrawal
Worker requests to withdraw available balance.
- Verifies the worker has enough available balance
- Creates a withdrawal record with status 'requested'
- Does NOT move earnings to 'withdrawn' yet — that happens when
  the withdrawal is processed (future admin function)

## Security
All functions are SECURITY DEFINER, verify auth.uid() internally.
*/

SET search_path = public, auth;

-- ============================================================
-- confirm_completion (updated to auto-create earning)
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

  -- Atomic completion + capture job details for earning
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

  -- Create a pending earning if a worker is assigned and not already created
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
-- record_payment: employer pays the worker for a completed job
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

  -- Create the payment record
  INSERT INTO payments (job_id, employer_id, worker_id, amount, method, status, reference)
  VALUES (p_job_id, v_employer_id, v_job.assigned_worker_id, v_amount, p_method, 'completed', p_reference)
  RETURNING id INTO v_payment_id;

  -- Move the earning to 'available' so the worker can withdraw
  UPDATE earnings
  SET status = 'available', payment_id = v_payment_id, updated_at = now()
  WHERE job_id = p_job_id AND status = 'pending'
  RETURNING id INTO v_earning_id;

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'earning_id', v_earning_id,
    'amount', v_amount,
    'method', p_method
  );
END;
$$;

-- ============================================================
-- request_withdrawal: worker withdraws available balance
-- ============================================================
CREATE OR REPLACE FUNCTION request_withdrawal(
  p_amount numeric,
  p_method text,
  p_bank_details jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_worker_id uuid := auth.uid();
  v_available numeric;
  v_pending_withdrawals numeric;
  v_withdrawable numeric;
  v_withdrawal_id uuid;
BEGIN
  IF v_worker_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF p_method NOT IN ('cash', 'bank_transfer', 'e_wallet') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid withdrawal method');
  END IF;

  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Withdrawal amount must be greater than zero');
  END IF;

  -- Calculate available balance (sum of 'available' earnings)
  SELECT COALESCE(SUM(amount), 0) INTO v_available
  FROM earnings WHERE worker_id = v_worker_id AND status = 'available';

  -- Subtract pending/processing withdrawals
  SELECT COALESCE(SUM(amount), 0) INTO v_pending_withdrawals
  FROM withdrawals
  WHERE worker_id = v_worker_id AND status IN ('requested', 'processing');

  v_withdrawable := v_available - v_pending_withdrawals;

  IF p_amount > v_withdrawable THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient available balance',
      'available', v_available,
      'pending_withdrawals', v_pending_withdrawals,
      'withdrawable', v_withdrawable
    );
  END IF;

  INSERT INTO withdrawals (worker_id, amount, method, status, bank_details)
  VALUES (v_worker_id, p_amount, p_method, 'requested', p_bank_details)
  RETURNING id INTO v_withdrawal_id;

  RETURN jsonb_build_object(
    'success', true,
    'withdrawal_id', v_withdrawal_id,
    'amount', p_amount,
    'method', p_method
  );
END;
$$;

-- ============================================================
-- Grant execute
-- ============================================================
GRANT EXECUTE ON FUNCTION confirm_completion(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION record_payment(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION request_withdrawal(numeric, text, jsonb) TO authenticated;

-- Fix: add missing auth.identities rows for the 14 seeded worker accounts.
-- The workers were inserted directly into auth.users, bypassing GoTrue's normal
-- signup flow, so auth.identities was empty. This causes signInWithPassword to
-- fail with "Database error querying schema". This inserts the missing identity
-- rows so password login works for every worker.

DO $$
DECLARE
  w_rec RECORD;
BEGIN
  FOR w_rec IN
    SELECT id, email, created_at
    FROM auth.users
    WHERE email IN (
      'thabomthembu412@gmail.com',
      'nomvulazulu887@gmail.com',
      'bonganikhumalo339@gmail.com',
      'siphandlovu651@gmail.com',
      'lindiwedlamini774@gmail.com',
      'ayandamhlambi228@gmail.com',
      'pietvandermerwe519@gmail.com',
      'nomsamahlangu643@gmail.com',
      'jabumthethwa156@gmail.com',
      'thandekankosi832@gmail.com',
      'sizwecele471@gmail.com',
      'refilwemogale918@gmail.com',
      'mandlazwide305@gmail.com',
      'karabosithole726@gmail.com'
    )
  LOOP
    INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
    SELECT
      w_rec.id::text,
      w_rec.id,
      jsonb_build_object('sub', w_rec.id::text, 'email', w_rec.email, 'email_verified', true),
      'email',
      w_rec.created_at,
      w_rec.created_at,
      w_rec.created_at
    WHERE NOT EXISTS (
      SELECT 1 FROM auth.identities WHERE user_id = w_rec.id AND provider = 'email'
    );
  END LOOP;
END $$;

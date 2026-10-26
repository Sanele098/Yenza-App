/*
# Fix: add missing auth.identities rows for demo users

The demo users were inserted directly into auth.users, bypassing the GoTrue
Auth service's normal signup flow. The auth.identities table was left empty,
which causes signInWithPassword to fail with "Database error querying schema".

This migration inserts the missing identity rows (excluding the generated
"email" column) so password login works.
*/

DO $$
DECLARE
  w_rec RECORD;
BEGIN
  FOR w_rec IN SELECT id, email, created_at FROM auth.users WHERE email IN ('sanele.b@example.co.za', 'thandi.m@example.co.za')
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

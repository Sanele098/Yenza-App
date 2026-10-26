-- Fix: repair the 14 manually-inserted auth.users so GoTrue can authenticate them.
--
-- Root cause: the seed migration inserted rows with raw_user_meta_data = {"role":"worker"}
-- and a partial auth.identities row. GoTrue's signInWithPassword expects
-- raw_user_meta_data and auth.identities.identity_data to carry the full identity
-- payload (sub, email, email_verified, phone_verified) that createUser normally
-- writes. Without it, the login query fails with "Database error querying schema".
--
-- This migration rewrites both fields to match the format GoTrue produces, mirroring
-- the working Sanele Buthelezi account. User IDs and profile links are preserved.

DO $$
DECLARE
  u_rec RECORD;
BEGIN
  FOR u_rec IN
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
    -- 1) Rewrite raw_user_meta_data to the GoTrue identity shape.
    UPDATE auth.users
      SET raw_user_meta_data = jsonb_build_object(
        'sub', u_rec.id::text,
        'email', u_rec.email,
        'email_verified', true,
        'phone_verified', false
      )
      WHERE id = u_rec.id;

    -- 2) Replace the partial auth.identities row with a correctly-shaped one.
    DELETE FROM auth.identities WHERE user_id = u_rec.id AND provider = 'email';
    INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
    VALUES (
      u_rec.id::text,
      u_rec.id,
      jsonb_build_object('sub', u_rec.id::text, 'email', u_rec.email, 'email_verified', true, 'phone_verified', false),
      'email',
      u_rec.created_at,
      u_rec.created_at,
      u_rec.created_at
    );
  END LOOP;
END $$;

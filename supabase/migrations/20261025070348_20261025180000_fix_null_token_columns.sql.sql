/*
# Fix NULL token columns on manually-inserted auth.users

Root cause: the seed migrations inserted auth.users rows with NULL for
recovery_token and email_change_token_new. GoTrue's createUser sets these
to empty strings (''). During signInWithPassword, GoTrue's internal query
references these token columns and a NULL value breaks the query,
surfacing as the generic "Database error querying schema" error.

This migration sets all token/text columns that should be '' to '' on every
affected user, matching the format GoTrue produces. User IDs and linked data
are untouched.
*/

UPDATE auth.users
SET
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
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
  'karabosithole726@gmail.com',
  'solutions@codegenai.tech',
  'support@buildware.co.za',
  'admin@foresightsecurity.co.za',
  'marieclarie.book@gmail.com',
  'info@aluswegroup.co.za'
);

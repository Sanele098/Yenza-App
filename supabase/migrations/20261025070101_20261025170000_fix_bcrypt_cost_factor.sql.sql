/*
# Fix bcrypt password cost for all manually-inserted users

Root cause: the seed migrations used `gen_salt('bf')`, which defaults to bcrypt
cost factor 6 (hash prefix `$2a$06$`). GoTrue expects cost factor 10
(`$2a$10$`) and rejects lower-cost hashes during signInWithPassword, surfacing
as the generic "Database error querying schema" error.

This migration rehashes every affected user's password (still "yenza123") with
`gen_salt('bf', 10)` so the hashes match what GoTrue's createUser produces.
User IDs and all linked data are untouched.
*/

UPDATE auth.users
SET encrypted_password = crypt('yenza123', gen_salt('bf', 10))
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

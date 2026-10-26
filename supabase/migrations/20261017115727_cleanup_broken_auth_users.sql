/*
# Clean up manually-inserted auth users

The demo users were inserted directly into auth.users with a hardcoded
instance_id of all-zeros, which doesn't match the GoTrue service's expected
configuration. This caused "Database error querying schema" on login attempts.

This migration deletes those broken users so they can be recreated properly
via the Auth Admin API (through the seed-demo-users edge function).

The profiles, worker_services, jobs, and reviews linked to these user IDs
will be cleaned up via CASCADE foreign keys.
*/

DELETE FROM auth.identities WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('sanele.b@example.co.za', 'thandi.m@example.co.za')
);

DELETE FROM auth.users WHERE email IN ('sanele.b@example.co.za', 'thandi.m@example.co.za');

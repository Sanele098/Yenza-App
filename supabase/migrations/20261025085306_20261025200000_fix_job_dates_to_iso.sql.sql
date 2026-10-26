/*
# Replace text date labels with real ISO dates

The seed migration used human-readable labels (Today, Tomorrow, Saturday,
This week) for requested_date. The calendar picker stores ISO dates
(YYYY-MM-DD), so the jobs screen showed inconsistent dates. This migration
replaces every text label with an actual date relative to the current week
of 2026-10-25 (Sunday).

Mapping:
  Today      -> 2026-10-25 (Sun)
  Tomorrow   -> 2026-10-26 (Mon)
  Saturday   -> 2026-11-01 (Sat)
  This week  -> spread across 2026-10-27 to 2026-10-30 (Tue–Fri)
*/

UPDATE jobs SET requested_date = '2026-10-25' WHERE requested_date = 'Today';
UPDATE jobs SET requested_date = '2026-10-26' WHERE requested_date = 'Tomorrow';
UPDATE jobs SET requested_date = '2026-11-01' WHERE requested_date = 'Saturday';

-- Spread "This week" jobs across the rest of the week
UPDATE jobs SET requested_date = '2026-10-27' WHERE title = 'Build a Company Website';
UPDATE jobs SET requested_date = '2026-10-28' WHERE title = 'Capture Stock Prices Into Spreadsheet';
UPDATE jobs SET requested_date = '2026-10-29' WHERE title = 'Manage Social Media Pages for Security Company';
UPDATE jobs SET requested_date = '2026-10-30' WHERE title = 'Setup Google Workspace & Email for Team';
UPDATE jobs SET requested_date = '2026-10-29' WHERE title = 'Repair Broken Cupboard Doors in Rental Unit';

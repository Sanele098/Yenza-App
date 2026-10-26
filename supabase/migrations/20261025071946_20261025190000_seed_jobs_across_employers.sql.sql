/*
# Seed a variety of jobs across all 5 employers

Creates 16 demo jobs spanning on-site trades, general labour, household work,
and remote/digital work. Each job is linked to the correct employer and
service category, with realistic budgets, locations, dates, and coordinates.

Employers:
- Codegenai Technologies (Osizweni) — construction & tech
- Buildware Hardware (Madadeni Section 2) — hardware store
- Foresight Security Service (Newcastle CBD) — security company
- Marie Clarie Book (Newcastle Town) — household owner
- Aluswe Group Holdings (Newcastle CBD) — BnB & rental housing

Jobs include remote roles (website build, data capture, social media, Google
Workspace setup) flagged with is_remote = true and the Remote/Digital service
categories. Status is 'open' (matches the jobs_status_check constraint).
*/

DO $$
DECLARE
  e_codegenai   uuid := 'a7a86e22-1ee4-431a-a797-40e14291ebfb';
  e_buildware   uuid := 'b797d82b-9c90-4c59-a3a9-6549a57d78d6';
  e_foresight   uuid := '74ce69bd-8a11-4f3d-a630-a60d988a5e98';
  e_marie       uuid := '95712970-3fd5-43e1-858b-dceb9a3dd3c5';
  e_aluswe      uuid := '884510ac-fcd3-48cd-a94e-871b53c26ff6';
  s_plumbing    uuid := '5a9710f1-1c04-4a82-a146-37b8e3950de6';
  s_electrical  uuid := '44bd441a-3b1f-4a1f-8cb5-ac10e3df8be4';
  s_carpentry   uuid := '65972e0f-b632-49d6-8833-b192ae876148';
  s_painting    uuid := '1b483915-2c45-4047-b34a-7ab0a825b930';
  s_welding     uuid := 'e983f8be-682d-48b7-bf9b-40e6a39246f2';
  s_solar       uuid := '41679326-7160-4ef9-8bda-5d7ded6e54e5';
  s_cleaning    uuid := 'fc980c43-076e-4abd-be46-3505c526d6d3';
  s_gardening   uuid := 'ddd44a13-7db4-4a2c-bc48-17dc1bcae51f';
  s_general     uuid := '376bfc13-dd95-4e1a-9bd7-35e5eee8fb24';
  s_moving      uuid := 'f5fbc84d-4fde-4661-9e77-a75f59c881ed';
  s_event       uuid := '124eb3f3-4fbd-4adc-acd2-a4c37b74d9d0';
  s_mechanics   uuid := '646f9505-8af4-45cd-9b13-a43d56f75f6b';
  s_digital     uuid := '04b5e7cb-c029-4fb7-beeb-2f8945473b2f';
  s_remote      uuid := '3b4f505f-d984-4c7a-90d9-d19eb2f31d8f';
  s_other       uuid := 'ccd10d60-2484-4dcf-ae73-140a0bea2b58';
BEGIN
  -- CODEGENAI TECHNOLOGIES (Construction & Tech) — 4 jobs
  INSERT INTO jobs (employer_id, service_id, title, description, job_location, budget, pricing_type, requested_date, requested_time, estimated_duration, latitude, longitude, status, is_remote, materials_provided, preferred_payment_method)
  VALUES (e_codegenai, s_welding, 'Weld Steel Gate for Construction Site',
    'We need a welder to fabricate and install a steel gate at our construction site in Osizweni. The gate is approximately 3.5 metres wide. Materials will be provided on site.',
    'Osizweni', 2200, 'fixed', 'Tomorrow', '08:00', '1 day', -27.731, 29.985, 'open', false, true, 'cash');

  INSERT INTO jobs (employer_id, service_id, title, description, job_location, budget, pricing_type, requested_date, requested_time, estimated_duration, latitude, longitude, status, is_remote, materials_provided, preferred_payment_method)
  VALUES (e_codegenai, s_remote, 'Build a Company Website',
    'We need a freelancer to build a modern 5-page company website for Codegenai Technologies. Pages: Home, About, Services, Projects, Contact. Must be mobile-responsive and SEO-friendly. We will provide branding and content. Work is fully remote.',
    'Remote', 8500, 'fixed', 'This week', '09:00', '5–7 days', 0, 0, 'open', true, false, 'card');

  INSERT INTO jobs (employer_id, service_id, title, description, job_location, budget, pricing_type, requested_date, requested_time, estimated_duration, latitude, longitude, status, is_remote, materials_provided, preferred_payment_method)
  VALUES (e_codegenai, s_general, 'Site Cleanup After Construction',
    'General labour needed to clear rubble, packaging, and offcuts from a completed construction site in Osizweni. Tools and wheelbarrows provided. Heavy lifting involved.',
    'Osizweni', 600, 'fixed', 'Tomorrow', '13:00', '4–5 hours', -27.731, 29.985, 'open', false, true, 'cash');

  INSERT INTO jobs (employer_id, service_id, title, description, job_location, budget, pricing_type, requested_date, requested_time, estimated_duration, latitude, longitude, status, is_remote, materials_provided, preferred_payment_method)
  VALUES (e_codegenai, s_remote, 'Setup Google Workspace & Email for Team',
    'Configure Google Workspace for a small team of 6. Set up custom domain email, shared drives, and basic security policies. Fully remote work with a brief onboarding call.',
    'Remote', 1800, 'fixed', 'This week', '10:00', '1–2 days', 0, 0, 'open', true, false, 'card');

  -- BUILDWARE HARDWARE (Hardware store) — 3 jobs
  INSERT INTO jobs (employer_id, service_id, title, description, job_location, budget, pricing_type, requested_date, requested_time, estimated_duration, latitude, longitude, status, is_remote, materials_provided, preferred_payment_method)
  VALUES (e_buildware, s_general, 'Offload Cement Delivery & Stock Count',
    'We have a delivery of 200 cement bags arriving at our Madadeni Section 2 store. Need 2 strong general workers to offload, stack, and do a stock count. Gloves provided.',
    'Madadeni Section 2', 350, 'fixed', 'Today', '14:00', '3 hours', -27.731, 29.985, 'open', false, true, 'cash');

  INSERT INTO jobs (employer_id, service_id, title, description, job_location, budget, pricing_type, requested_date, requested_time, estimated_duration, latitude, longitude, status, is_remote, materials_provided, preferred_payment_method)
  VALUES (e_buildware, s_painting, 'Paint Store Front & Signage Board',
    'Our shopfront and signage board need a fresh coat of paint. Current paint is peeling. Surface prep and two coats required. Paint and brushes provided by the store.',
    'Madadeni Section 2', 1200, 'fixed', 'Tomorrow', '08:30', '6 hours', -27.731, 29.985, 'open', false, true, 'cash');

  INSERT INTO jobs (employer_id, service_id, title, description, job_location, budget, pricing_type, requested_date, requested_time, estimated_duration, latitude, longitude, status, is_remote, materials_provided, preferred_payment_method)
  VALUES (e_buildware, s_digital, 'Capture Stock Prices Into Spreadsheet',
    'We need someone to capture approximately 400 product prices from our printed price list into an Excel spreadsheet. Template provided. Remote work, must be accurate and delivered within 2 days.',
    'Remote', 450, 'fixed', 'This week', '09:00', '2 days', 0, 0, 'open', true, false, 'card');

  -- FORESIGHT SECURITY SERVICE (Security company) — 3 jobs
  INSERT INTO jobs (employer_id, service_id, title, description, job_location, budget, pricing_type, requested_date, requested_time, estimated_duration, latitude, longitude, status, is_remote, materials_provided, preferred_payment_method)
  VALUES (e_foresight, s_general, 'Setup Event Security Barriers & Tents',
    'We need 4 general workers to set up crowd barriers, signage, and a small marquee tent for an event in Newcastle CBD. All equipment provided. Heavy lifting involved.',
    'Newcastle CBD', 500, 'fixed', 'Saturday', '06:00', '4 hours', -27.759, 29.932, 'open', false, true, 'cash');

  INSERT INTO jobs (employer_id, service_id, title, description, job_location, budget, pricing_type, requested_date, requested_time, estimated_duration, latitude, longitude, status, is_remote, materials_provided, preferred_payment_method)
  VALUES (e_foresight, s_electrical, 'Install CCTV Cameras at Security Office',
    'Install 6 CCTV cameras and run cabling at our Newcastle CBD office. Cameras and cabling provided. Must have electrical experience and be comfortable working at height on a ladder.',
    'Newcastle CBD', 1800, 'fixed', 'Tomorrow', '09:00', '1 day', -27.759, 29.932, 'open', false, true, 'card');

  INSERT INTO jobs (employer_id, service_id, title, description, job_location, budget, pricing_type, requested_date, requested_time, estimated_duration, latitude, longitude, status, is_remote, materials_provided, preferred_payment_method)
  VALUES (e_foresight, s_remote, 'Manage Social Media Pages for Security Company',
    'We need a remote social media manager to run our Facebook and Instagram pages — 3 posts per week, respond to messages, and grow our following. Monthly retainer, reviewed monthly.',
    'Remote', 2500, 'fixed', 'This week', '10:00', 'Ongoing', 0, 0, 'open', true, false, 'card');

  -- MARIE CLARIE BOOK (Household owner) — 3 jobs
  INSERT INTO jobs (employer_id, service_id, title, description, job_location, budget, pricing_type, requested_date, requested_time, estimated_duration, latitude, longitude, status, is_remote, materials_provided, preferred_payment_method)
  VALUES (e_marie, s_cleaning, 'Deep House Cleaning — 3 Bedroom Home',
    'I need a thorough deep clean of my 3 bedroom house in Newcastle Town. Includes bathrooms, kitchen, floors, windows, and inside cupboards. Cleaning materials provided.',
    'Newcastle Town', 450, 'fixed', 'Today', '09:00', '5 hours', -27.759, 29.932, 'open', false, true, 'cash');

  INSERT INTO jobs (employer_id, service_id, title, description, job_location, budget, pricing_type, requested_date, requested_time, estimated_duration, latitude, longitude, status, is_remote, materials_provided, preferred_payment_method)
  VALUES (e_marie, s_gardening, 'Garden Cleanup & Hedge Trimming',
    'Front and back garden needs attention — hedge trimming, weeding, lawn mowing, and removing garden refuse. I have a mower and trimmer. Refuse bags provided.',
    'Newcastle Town', 300, 'fixed', 'Tomorrow', '08:00', '3 hours', -27.759, 29.932, 'open', false, true, 'cash');

  INSERT INTO jobs (employer_id, service_id, title, description, job_location, budget, pricing_type, requested_date, requested_time, estimated_duration, latitude, longitude, status, is_remote, materials_provided, preferred_payment_method)
  VALUES (e_marie, s_plumbing, 'Fix Leaking Bathroom Tap',
    'The bathroom basin tap has been dripping for a week and is getting worse. Likely needs a new washer or cartridge. Please inspect and repair.',
    'Newcastle Town', 250, 'fixed', 'Today', '15:00', '1–2 hours', -27.759, 29.932, 'open', false, false, 'cash');

  -- ALUSWE GROUP HOLDINGS (BnB & rental housing) — 3 jobs
  INSERT INTO jobs (employer_id, service_id, title, description, job_location, budget, pricing_type, requested_date, requested_time, estimated_duration, latitude, longitude, status, is_remote, materials_provided, preferred_payment_method)
  VALUES (e_aluswe, s_cleaning, 'Turnover Clean for 2 BnB Units',
    'Two BnB units in Newcastle CBD need a turnover clean between guests. Both are 1-bedroom units. Includes linen change, bathroom, kitchen, and floors. Linen and cleaning products provided.',
    'Newcastle CBD', 600, 'fixed', 'Today', '11:00', '4 hours', -27.759, 29.932, 'open', false, true, 'card');

  INSERT INTO jobs (employer_id, service_id, title, description, job_location, budget, pricing_type, requested_date, requested_time, estimated_duration, latitude, longitude, status, is_remote, materials_provided, preferred_payment_method)
  VALUES (e_aluswe, s_painting, 'Repaint Walls in Rental Unit',
    'A 2-bedroom rental unit needs the walls repainted after a tenant moved out. Light surface prep and two coats. Paint provided. Unit is empty and ready.',
    'Newcastle CBD', 1500, 'fixed', 'Tomorrow', '08:00', '1 day', -27.759, 29.932, 'open', false, true, 'card');

  INSERT INTO jobs (employer_id, service_id, title, description, job_location, budget, pricing_type, requested_date, requested_time, estimated_duration, latitude, longitude, status, is_remote, materials_provided, preferred_payment_method)
  VALUES (e_aluswe, s_carpentry, 'Repair Broken Cupboard Doors in Rental Unit',
    'Three cupboard doors in the kitchen of a rental unit have come off their hinges and one is cracked. Need a carpenter to rehang and repair or replace the damaged door.',
    'Newcastle CBD', 700, 'fixed', 'This week', '10:00', '3–4 hours', -27.759, 29.932, 'open', false, false, 'card');
END $$;

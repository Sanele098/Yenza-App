/*
# Yenza seed data — services catalogue and demo accounts

1. Services catalogue: all 14 services (7 General Work + 7 Skilled Services)
2. Demo auth users: Sanele Buthelezi (worker) and Thandi Mthembu (employer)
3. Demo profiles linked to those auth users
4. Worker services for Sanele (Plumbing, General Labour, Painting)
5. Demo jobs posted by Thandi
6. A sample review

Note: auth.users entries are created via direct insert with crypt() hashing.
Email confirmation is OFF so login works immediately.
*/

-- ============================================================
-- 1. SERVICES CATALOGUE
-- ============================================================
INSERT INTO services (name, category, slug) VALUES
  ('Cleaning', 'General Work', 'cleaning'),
  ('Gardening', 'General Work', 'gardening'),
  ('Moving Assistance', 'General Work', 'moving-assistance'),
  ('Painting', 'General Work', 'painting'),
  ('Car Washing', 'General Work', 'car-washing'),
  ('Event Assistance', 'General Work', 'event-assistance'),
  ('General Labour', 'General Work', 'general-labour'),
  ('Plumbing', 'Skilled Services', 'plumbing'),
  ('Electrical', 'Skilled Services', 'electrical'),
  ('Carpentry', 'Skilled Services', 'carpentry'),
  ('Welding', 'Skilled Services', 'welding'),
  ('Tiling', 'Skilled Services', 'tiling'),
  ('Mechanics', 'Skilled Services', 'mechanics'),
  ('Solar Installation', 'Skilled Services', 'solar-installation')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. DEMO AUTH USERS, PROFILES, WORKER_SERVICES, JOBS, REVIEWS
-- ============================================================
DO $$
DECLARE
  v_worker_id uuid;
  v_employer_id uuid;
  v_plumbing_id uuid;
  v_general_labour_id uuid;
  v_painting_id uuid;
  v_job1_id uuid;
BEGIN
  -- Create worker auth user
  SELECT id INTO v_worker_id FROM auth.users WHERE email = 'sanele.b@example.co.za';
  IF v_worker_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, email_change, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(), 'authenticated', 'authenticated', 'sanele.b@example.co.za',
      crypt('yenza123', gen_salt('bf')), now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{"role":"worker"}', '', '', false
    ) RETURNING id INTO v_worker_id;
  END IF;

  -- Create employer auth user
  SELECT id INTO v_employer_id FROM auth.users WHERE email = 'thandi.m@example.co.za';
  IF v_employer_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, email_change, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(), 'authenticated', 'authenticated', 'thandi.m@example.co.za',
      crypt('yenza123', gen_salt('bf')), now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{"role":"employer"}', '', '', false
    ) RETURNING id INTO v_employer_id;
  END IF;

  -- ============================================================
  -- 3. PROFILES
  -- ============================================================
  INSERT INTO profiles (
    id, first_name, surname, display_name, phone, email, preferred_language, bio,
    role, account_type, primary_location, service_areas, availability, worker_status,
    identity_verified, is_available, experience_level, experience_detail,
    qualifications_summary, profile_photo_set
  ) VALUES (
    v_worker_id, 'Sanele', 'Buthelezi', 'Sanele Buthelezi', '082 555 0147', 'sanele.b@example.co.za',
    'English',
    'I provide plumbing and general maintenance services around Newcastle. I focus on household repairs, installations and maintenance work.',
    'worker', NULL, 'Newcastle, KwaZulu-Natal',
    '["Newcastle CBD", "Arbor Park", "Hutten Heights"]'::jsonb,
    '{"days":["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]}'::jsonb,
    'available', false, true,
    '3–5 years',
    'Started as a plumber apprentice in 2020. Worked on residential installations and repairs, water systems and geysers. Also take on general maintenance and painting jobs around the Newcastle area.',
    '[{"label":"Identity verification","status":"not_verified","description":"Confirm your identity so customers know who they are hiring."},{"label":"Qualification","status":"not_provided","description":"Add certificates or proof of training for skilled services."},{"label":"Professional registration","status":"not_provided","description":"Add registration numbers for regulated trades (e.g. plumbing, electrical)."}]'::jsonb,
    false
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO profiles (
    id, first_name, surname, display_name, phone, email, preferred_language,
    role, account_type, primary_location, worker_status, identity_verified, is_available
  ) VALUES (
    v_employer_id, 'Thandi', 'Mthembu', 'Thandi Mthembu', '083 222 1045', 'thandi.m@example.co.za',
    'English',
    'employer', 'Household', 'Newcastle CBD', 'available', false, true
  ) ON CONFLICT (id) DO NOTHING;

  -- ============================================================
  -- 4. WORKER_SERVICES
  -- ============================================================
  SELECT id INTO v_plumbing_id FROM services WHERE name = 'Plumbing';
  SELECT id INTO v_general_labour_id FROM services WHERE name = 'General Labour';
  SELECT id INTO v_painting_id FROM services WHERE name = 'Painting';

  INSERT INTO worker_services (worker_id, service_id, experience_level, years_experience, description, starting_price, pricing_type, active)
  VALUES
    (v_worker_id, v_plumbing_id, '3–5 years', '3–5 years', 'Residential plumbing repairs, installations, water systems and geyser maintenance.', 450, 'fixed', true),
    (v_worker_id, v_general_labour_id, '3–5 years', '3–5 years', 'General maintenance and labour around the Newcastle area.', 300, 'fixed', true),
    (v_worker_id, v_painting_id, '3–5 years', '3–5 years', 'Interior and exterior wall painting with surface preparation.', 350, 'fixed', true)
  ON CONFLICT (worker_id, service_id) DO NOTHING;

  -- ============================================================
  -- 5. JOBS (posted by employer)
  -- ============================================================
  INSERT INTO jobs (employer_id, service_id, title, description, job_location, budget, pricing_type,
    requested_date, requested_time, estimated_duration, latitude, longitude, status, created_at)
  VALUES
    (v_employer_id, v_plumbing_id, 'Leaking Kitchen Tap',
     'The kitchen tap has been leaking continuously. Please inspect the tap and repair or replace the faulty part.',
     'Newcastle CBD', 450, 'fixed', 'Today', '14:00', '1–2 hours', -27.759, 29.932, 'Available', '2025-10-07T06:00:00Z')
  RETURNING id INTO v_job1_id;

  INSERT INTO jobs (employer_id, title, description, job_location, budget, pricing_type,
    requested_date, requested_time, estimated_duration, latitude, longitude, status, created_at)
  VALUES
    (v_employer_id, 'Garden Cleanup',
     'Front and back garden needs a general clean-up — hedge trimming, weeding, and removing garden refuse.',
     'Hutten Heights', 350, 'fixed', 'Today', '15:30', '2–3 hours', -27.715, 29.948, 'Available', '2025-10-07T05:30:00Z'),
    (v_employer_id, 'Paint Two Bedroom Walls',
     'Two bedroom walls need to be painted. Customer will provide paint. Surfaces need light preparation first.',
     'Madadeni', 850, 'fixed', 'Tomorrow', '09:00', '3–4 hours', -27.731, 29.985, 'Available', '2025-10-07T05:00:00Z'),
    (v_employer_id, 'Move Furniture',
     'Need help moving furniture from one room to another and loading a few pieces onto a bakkie.',
     'Arbor Park', 600, 'fixed', 'Tomorrow', '11:00', '2 hours', -27.771, 29.921, 'Available', '2025-10-07T04:30:00Z');

  -- ============================================================
  -- 6. REVIEW (sample, linked to the plumbing job)
  -- ============================================================
  IF v_job1_id IS NOT NULL THEN
    INSERT INTO reviews (job_id, reviewer_id, reviewed_id, rating, written_review, is_visible)
    VALUES (v_job1_id, v_employer_id, v_worker_id, 5,
            'Sanele was punctual, professional and fixed the tap quickly. Highly recommended.',
            true)
    ON CONFLICT (job_id, reviewer_id) DO NOTHING;
  END IF;

END $$;

-- Seed 14 additional worker profiles (15 total with existing Sanele Buthelezi).
-- Diverse trades, experience levels, locations, and statuses for realistic skill-gap analysis.
-- Each worker gets: auth.users login, profile row, and worker_services rows.

DO $$
DECLARE
  v_id uuid;
  v_svc uuid;
BEGIN
  -- ============================================================
  -- WORKER 2: Thabo Mthembu — Established electrical pro (verified)
  -- ============================================================
  v_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, email_change, is_sso_user)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', 'thabomthembu412@gmail.com', crypt('yenza123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"worker"}', '', '', false);
  INSERT INTO profiles (id, first_name, surname, display_name, phone, email, preferred_language, bio, role, primary_location, service_areas, availability, worker_status, identity_verified, is_available, experience_level, experience_detail, qualifications_summary, profile_photo_set)
  VALUES (v_id, 'Thabo', 'Mthembu', 'Thabo Mthembu', '0712345601', 'thabomthembu412@gmail.com', 'English',
    'Qualified electrician with over six years experience in residential and commercial wiring. I also install solar systems for homes and businesses around Newcastle.',
    'worker', 'Newcastle Town', '["Newcastle CBD","Hutten Heights","Arbor Park"]'::jsonb, '{"days":["Monday","Tuesday","Wednesday","Thursday","Friday"]}'::jsonb,
    'available', true, true, '5+ years',
    'Completed electrical apprenticeship in 2019. Worked on new builds, fault finding, COCs, and solar installations. Registered with Department of Labour.',
    '[{"label":"Identity verification","status":"verified","description":"ID confirmed"},{"label":"Qualification","status":"provided","description":"Wireman''s License"},{"label":"Professional registration","status":"provided","description":"DOL registered"}]'::jsonb, false);
  SELECT id INTO v_svc FROM services WHERE name='Electrical'; INSERT INTO worker_services (worker_id, service_id, experience_level, years_experience, description, starting_price, pricing_type, active) VALUES (v_id, v_svc, '5+ years', '5+ years', 'Residential and commercial wiring, fault finding, COCs, and DB upgrades.', 650, 'fixed', true);
  SELECT id INTO v_svc FROM services WHERE name='Solar Installation'; INSERT INTO worker_services (worker_id, service_id, experience_level, years_experience, description, starting_price, pricing_type, active) VALUES (v_id, v_svc, '5+ years', '5+ years', 'Solar panel and inverter installation for homes and small businesses.', 1200, 'fixed', true);

  -- ============================================================
  -- WORKER 3: Nomvula Zulu — General worker all-rounder
  -- ============================================================
  v_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, email_change, is_sso_user)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', 'nomvulazulu887@gmail.com', crypt('yenza123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"worker"}', '', '', false);
  INSERT INTO profiles (id, first_name, surname, display_name, phone, email, preferred_language, bio, role, primary_location, service_areas, availability, worker_status, identity_verified, is_available, experience_level, experience_detail, qualifications_summary, profile_photo_set)
  VALUES (v_id, 'Nomvula', 'Zulu', 'Nomvula Zulu', '0712345602', 'nomvulazulu887@gmail.com', 'isiZulu',
    'I do cleaning, gardening and general house work. Available every day and happy to take on any general work in the Madadeni area.',
    'worker', 'Madadeni Section 3', '["Madadeni Section 1","Madadeni Section 2","Madadeni Section 3","Madadeni Section 4"]'::jsonb, '{"days":["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]}'::jsonb,
    'available', false, true, '1–2 years',
    'Started doing domestic work in 2024. I am reliable and hardworking. Looking to learn more skills to earn better.',
    '[]'::jsonb, false);
  SELECT id INTO v_svc FROM services WHERE name='Cleaning'; INSERT INTO worker_services (worker_id, service_id, experience_level, years_experience, description, starting_price, pricing_type, active) VALUES (v_id, v_svc, '1–2 years', '1–2 years', 'House cleaning, yard cleaning, and general domestic work.', 150, 'hourly', true);
  SELECT id INTO v_svc FROM services WHERE name='Gardening'; INSERT INTO worker_services (worker_id, service_id, experience_level, years_experience, description, starting_price, pricing_type, active) VALUES (v_id, v_svc, '1–2 years', '1–2 years', 'Garden maintenance, weeding, hedge trimming, and refuse removal.', 180, 'hourly', true);
  SELECT id INTO v_svc FROM services WHERE name='General Labour'; INSERT INTO worker_services (worker_id, service_id, experience_level, years_experience, description, starting_price, pricing_type, active) VALUES (v_id, v_svc, '1–2 years', '1–2 years', 'General labour and domestic assistance.', 120, 'hourly', true);
  SELECT id INTO v_svc FROM services WHERE name='Car Washing'; INSERT INTO worker_services (worker_id, service_id, experience_level, years_experience, description, starting_price, pricing_type, active) VALUES (v_id, v_svc, '1–2 years', '1–2 years', 'Car washing at your home or office.', 80, 'fixed', true);

  -- ============================================================
  -- WORKER 4: Bongani Khumalo — Newcomer painter
  -- ============================================================
  v_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, email_change, is_sso_user)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', 'bonganikhumalo339@gmail.com', crypt('yenza123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"worker"}', '', '', false);
  INSERT INTO profiles (id, first_name, surname, display_name, phone, email, preferred_language, bio, role, primary_location, service_areas, availability, worker_status, identity_verified, is_available, experience_level, experience_detail, qualifications_summary, profile_photo_set)
  VALUES (v_id, 'Bongani', 'Khumalo', 'Bongani Khumalo', '0712345603', 'bonganikhumalo339@gmail.com', 'English',
    'I am new to painting but I learn fast. I have helped with two painting jobs and I want to build my experience. Available weekends.',
    'worker', 'Osizweni', '["Osizweni","Madadeni Section 5"]'::jsonb, '{"days":["Saturday","Sunday"]}'::jsonb,
    'available', false, true, 'New to the trade',
    'Helped a family friend with painting a house in 2025. I want to learn carpentry as well so I can do more skilled work.',
    '[]'::jsonb, false);
  SELECT id INTO v_svc FROM services WHERE name='Painting'; INSERT INTO worker_services (worker_id, service_id, experience_level, years_experience, description, starting_price, pricing_type, active) VALUES (v_id, v_svc, 'New to the trade', 'New to the trade', 'Interior and exterior wall painting. Surface preparation included.', 250, 'fixed', true);
  SELECT id INTO v_svc FROM services WHERE name='General Labour'; INSERT INTO worker_services (worker_id, service_id, experience_level, years_experience, description, starting_price, pricing_type, active) VALUES (v_id, v_svc, 'New to the trade', 'New to the trade', 'General labour assistance on weekends.', 100, 'hourly', true);

  -- ============================================================
  -- WORKER 5: Sipho Ndlovu — Skilled tiling & welding specialist
  -- ============================================================
  v_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, email_change, is_sso_user)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', 'siphandlovu651@gmail.com', crypt('yenza123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"worker"}', '', '', false);
  INSERT INTO profiles (id, first_name, surname, display_name, phone, email, preferred_language, bio, role, primary_location, service_areas, availability, worker_status, identity_verified, is_available, experience_level, experience_detail, qualifications_summary, profile_photo_set)
  VALUES (v_id, 'Sipho', 'Ndlovu', 'Sipho Ndlovu', '0712345604', 'siphandlovu651@gmail.com', 'English',
    'Tiler and welder with four years experience. I do floor and wall tiling, plus light steel welding for gates and burglar bars.',
    'worker', 'Hutten Heights', '["Hutten Heights","Newcastle CBD","Fernwood"]'::jsonb, '{"days":["Monday","Tuesday","Wednesday","Thursday","Friday"]}'::jsonb,
    'available', true, true, '3–5 years',
    'Learned tiling on the job in 2021. Picked up welding in 2023. I take pride in neat, precise work.',
    '[{"label":"Identity verification","status":"verified","description":"ID confirmed"},{"label":"Qualification","status":"not_provided","description":""},{"label":"Professional registration","status":"not_provided","description":""}]'::jsonb, false);
  SELECT id INTO v_svc FROM services WHERE name='Tiling'; INSERT INTO worker_services (worker_id, service_id, experience_level, years_experience, description, starting_price, pricing_type, active) VALUES (v_id, v_svc, '3–5 years', '3–5 years', 'Floor and wall tiling for bathrooms, kitchens, and living areas.', 500, 'fixed', true);
  SELECT id INTO v_svc FROM services WHERE name='Welding'; INSERT INTO worker_services (worker_id, service_id, experience_level, years_experience, description, starting_price, pricing_type, active) VALUES (v_id, v_svc, '3–5 years', '1–2 years', 'Light steel welding — gates, burglar bars, and small repairs.', 700, 'fixed', true);

  -- ============================================================
  -- WORKER 6: Lindiwe Dlamini — Part-time mover (currently busy)
  -- ============================================================
  v_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, email_change, is_sso_user)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', 'lindiwedlamini774@gmail.com', crypt('yenza123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"worker"}', '', '', false);
  INSERT INTO profiles (id, first_name, surname, display_name, phone, email, preferred_language, bio, role, primary_location, service_areas, availability, worker_status, identity_verified, is_available, experience_level, experience_detail, qualifications_summary, profile_photo_set)
  VALUES (v_id, 'Lindiwe', 'Dlamini', 'Lindiwe Dlamini', '0712345605', 'lindiwedlamini774@gmail.com', 'English',
    'I help with moving furniture and event setup on weekends. Currently busy with a few jobs but will be available again soon.',
    'worker', 'Arbor Park', '["Arbor Park","Newcastle CBD","Charlestown"]'::jsonb, '{"days":["Saturday","Sunday"]}'::jsonb,
    'busy', false, false, '3–5 years',
    'Been doing moving and event work for about four years. Reliable and careful with furniture and equipment.',
    '[]'::jsonb, false);
  SELECT id INTO v_svc FROM services WHERE name='Moving Assistance'; INSERT INTO worker_services (worker_id, service_id, experience_level, years_experience, description, starting_price, pricing_type, active) VALUES (v_id, v_svc, '3–5 years', '3–5 years', 'Furniture moving, loading, and transport assistance.', 350, 'fixed', true);
  SELECT id INTO v_svc FROM services WHERE name='Event Assistance'; INSERT INTO worker_services (worker_id, service_id, experience_level, years_experience, description, starting_price, pricing_type, active) VALUES (v_id, v_svc, '3–5 years', '3–5 years', 'Event setup, packing, and general assistance.', 200, 'hourly', true);

  -- ============================================================
  -- WORKER 7: Ayanda Mhlambi — Remote/digital worker
  -- ============================================================
  v_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, email_change, is_sso_user)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', 'ayandamhlambi228@gmail.com', crypt('yenza123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"worker"}', '', '', false);
  INSERT INTO profiles (id, first_name, surname, display_name, phone, email, preferred_language, bio, role, primary_location, service_areas, availability, worker_status, identity_verified, is_available, experience_level, experience_detail, qualifications_summary, profile_photo_set)
  VALUES (v_id, 'Ayanda', 'Mhlambi', 'Ayanda Mhlambi', '0712345606', 'ayandamhlambi228@gmail.com', 'English',
    'I do digital work — data capture, spreadsheets, and basic graphic design. I work remotely from Charlestown and can help anyone across Newcastle.',
    'worker', 'Charlestown', '["Charlestown","Newcastle CBD"]'::jsonb, '{"days":["Monday","Tuesday","Wednesday","Thursday","Friday"]}'::jsonb,
    'available', false, true, '1–2 years',
    'Studied IT basics at a local college. Started freelancing in 2024 doing data capture and spreadsheet formatting.',
    '[]'::jsonb, false);
  SELECT id INTO v_svc FROM services WHERE name='Digital'; INSERT INTO worker_services (worker_id, service_id, experience_level, years_experience, description, starting_price, pricing_type, active) VALUES (v_id, v_svc, '1–2 years', '1–2 years', 'Data capture, spreadsheet formatting, and basic document work.', 120, 'hourly', true);
  SELECT id INTO v_svc FROM services WHERE name='Remote'; INSERT INTO worker_services (worker_id, service_id, experience_level, years_experience, description, starting_price, pricing_type, active) VALUES (v_id, v_svc, '1–2 years', '1–2 years', 'Remote admin and digital assistance.', 100, 'hourly', true);

  -- ============================================================
  -- WORKER 8: Piet van der Merwe — Carpentry veteran
  -- ============================================================
  v_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, email_change, is_sso_user)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', 'pietvandermerwe519@gmail.com', crypt('yenza123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"worker"}', '', '', false);
  INSERT INTO profiles (id, first_name, surname, display_name, phone, email, preferred_language, bio, role, primary_location, service_areas, availability, worker_status, identity_verified, is_available, experience_level, experience_detail, qualifications_summary, profile_photo_set)
  VALUES (v_id, 'Piet', 'van der Merwe', 'Piet van der Merwe', '0712345607', 'pietvandermerwe519@gmail.com', 'English',
    'Carpenter with over seven years experience. I build and install cupboards, doors, ceilings, and wooden furniture. Quality work guaranteed.',
    'worker', 'Utrecht', '["Charlestown","Fernwood","Newcastle CBD"]'::jsonb, '{"days":["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]}'::jsonb,
    'available', true, true, '5+ years',
    'Qualified carpenter since 2018. Specialise in built-in cupboards, kitchen installations, and custom furniture.',
    '[{"label":"Identity verification","status":"verified","description":"ID confirmed"},{"label":"Qualification","status":"provided","description":"Carpentry Certificate"},{"label":"Professional registration","status":"not_provided","description":""}]'::jsonb, false);
  SELECT id INTO v_svc FROM services WHERE name='Carpentry'; INSERT INTO worker_services (worker_id, service_id, experience_level, years_experience, description, starting_price, pricing_type, active) VALUES (v_id, v_svc, '5+ years', '5+ years', 'Built-in cupboards, doors, ceilings, kitchen fittings, and custom furniture.', 800, 'fixed', true);

  -- ============================================================
  -- WORKER 9: Nomsa Mahlangu — Cleaning & event worker (unavailable)
  -- ============================================================
  v_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, email_change, is_sso_user)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', 'nomsamahlangu643@gmail.com', crypt('yenza123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"worker"}', '', '', false);
  INSERT INTO profiles (id, first_name, surname, display_name, phone, email, preferred_language, bio, role, primary_location, service_areas, availability, worker_status, identity_verified, is_available, experience_level, experience_detail, qualifications_summary, profile_photo_set)
  VALUES (v_id, 'Nomsa', 'Mahlangu', 'Nomsa Mahlangu', '0712345608', 'nomsamahlangu643@gmail.com', 'isiZulu',
    'I do cleaning and event work. Currently not available due to family commitments but will return soon.',
    'worker', 'Madadeni Section 1', '["Madadeni Section 1","Madadeni Section 2","Madadeni Section 3"]'::jsonb, '{"days":["Monday","Tuesday","Wednesday"]}'::jsonb,
    'unavailable', false, false, '3–5 years',
    'Been cleaning and helping at events for about three years. Hoping to learn tiling when I come back.',
    '[]'::jsonb, false);
  SELECT id INTO v_svc FROM services WHERE name='Cleaning'; INSERT INTO worker_services (worker_id, service_id, experience_level, years_experience, description, starting_price, pricing_type, active) VALUES (v_id, v_svc, '3–5 years', '3–5 years', 'Deep cleaning, regular house cleaning, and post-event cleanup.', 200, 'hourly', true);
  SELECT id INTO v_svc FROM services WHERE name='Event Assistance'; INSERT INTO worker_services (worker_id, service_id, experience_level, years_experience, description, starting_price, pricing_type, active) VALUES (v_id, v_svc, '3–5 years', '3–5 years', 'Event setup, serving, and cleanup assistance.', 180, 'hourly', true);

  -- ============================================================
  -- WORKER 10: Jabu Mthethwa — Plumbing specialist (verified)
  -- ============================================================
  v_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, email_change, is_sso_user)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', 'jabumthethwa156@gmail.com', crypt('yenza123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"worker"}', '', '', false);
  INSERT INTO profiles (id, first_name, surname, display_name, phone, email, preferred_language, bio, role, primary_location, service_areas, availability, worker_status, identity_verified, is_available, experience_level, experience_detail, qualifications_summary, profile_photo_set)
  VALUES (v_id, 'Jabu', 'Mthethwa', 'Jabu Mthethwa', '0712345609', 'jabumthethwa156@gmail.com', 'English',
    'Qualified plumber specialising in residential repairs, geyser installations, and bathroom renovations. Serving Newcastle and surrounding areas.',
    'worker', 'Newcastle Town', '["Newcastle CBD","Hutten Heights","Arbor Park","Fernwood"]'::jsonb, '{"days":["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]}'::jsonb,
    'available', true, true, '5+ years',
    'Qualified plumber since 2017. Experienced in leak detection, geyser installation, bathroom renovations, and drainage.',
    '[{"label":"Identity verification","status":"verified","description":"ID confirmed"},{"label":"Qualification","status":"provided","description":"Plumbing Certificate"},{"label":"Professional registration","status":"provided","description":"Registered plumber"}]'::jsonb, false);
  SELECT id INTO v_svc FROM services WHERE name='Plumbing'; INSERT INTO worker_services (worker_id, service_id, experience_level, years_experience, description, starting_price, pricing_type, active) VALUES (v_id, v_svc, '5+ years', '5+ years', 'Leak repairs, geyser installation, bathroom renovations, and drainage.', 550, 'fixed', true);

  -- ============================================================
  -- WORKER 11: Thandeka Nkosi — Multi-skilled general worker
  -- ============================================================
  v_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, email_change, is_sso_user)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', 'thandekankosi832@gmail.com', crypt('yenza123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"worker"}', '', '', false);
  INSERT INTO profiles (id, first_name, surname, display_name, phone, email, preferred_language, bio, role, primary_location, service_areas, availability, worker_status, identity_verified, is_available, experience_level, experience_detail, qualifications_summary, profile_photo_set)
  VALUES (v_id, 'Thandeka', 'Nkosi', 'Thandeka Nkosi', '0712345610', 'thandekankosi832@gmail.com', 'isiZulu',
    'I do gardening, car washing, and general labour. I am hardworking and always on time. Looking to learn a skilled trade.',
    'worker', 'Madadeni Section 5', '["Madadeni Section 4","Madadeni Section 5","Madadeni Section 6","Osizweni"]'::jsonb, '{"days":["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]}'::jsonb,
    'available', false, true, '1–2 years',
    'Started working in 2024 doing garden maintenance. I want to learn plumbing or electrical so I can earn more and support my family.',
    '[]'::jsonb, false);
  SELECT id INTO v_svc FROM services WHERE name='Gardening'; INSERT INTO worker_services (worker_id, service_id, experience_level, years_experience, description, starting_price, pricing_type, active) VALUES (v_id, v_svc, '1–2 years', '1–2 years', 'Garden maintenance, hedge trimming, lawn care, and refuse removal.', 150, 'hourly', true);
  SELECT id INTO v_svc FROM services WHERE name='Car Washing'; INSERT INTO worker_services (worker_id, service_id, experience_level, years_experience, description, starting_price, pricing_type, active) VALUES (v_id, v_svc, '1–2 years', '1–2 years', 'Car washing and valet at your location.', 80, 'fixed', true);
  SELECT id INTO v_svc FROM services WHERE name='General Labour'; INSERT INTO worker_services (worker_id, service_id, experience_level, years_experience, description, starting_price, pricing_type, active) VALUES (v_id, v_svc, '1–2 years', '1–2 years', 'General labour for construction sites, yards, and homes.', 130, 'hourly', true);

  -- ============================================================
  -- WORKER 12: Sizwe Cele — Mechanic (mid-experience)
  -- ============================================================
  v_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, email_change, is_sso_user)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', 'sizwecele471@gmail.com', crypt('yenza123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"worker"}', '', '', false);
  INSERT INTO profiles (id, first_name, surname, display_name, phone, email, preferred_language, bio, role, primary_location, service_areas, availability, worker_status, identity_verified, is_available, experience_level, experience_detail, qualifications_summary, profile_photo_set)
  VALUES (v_id, 'Sizwe', 'Cele', 'Sizwe Cele', '0712345611', 'sizwecele471@gmail.com', 'English',
    'Mechanic specialising in minor vehicle repairs and servicing. I come to you for basic diagnostics and roadside assistance.',
    'worker', 'Mndozo', '["Madadeni Section 7","Osizweni","Mndozo"]'::jsonb, '{"days":["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]}'::jsonb,
    'available', false, true, '3–5 years',
    'Worked at a garage in Newcastle for three years. Now doing mobile mechanic work. I want to add welding to my skills.',
    '[]'::jsonb, false);
  SELECT id INTO v_svc FROM services WHERE name='Mechanics'; INSERT INTO worker_services (worker_id, service_id, experience_level, years_experience, description, starting_price, pricing_type, active) VALUES (v_id, v_svc, '3–5 years', '3–5 years', 'Minor vehicle repairs, servicing, and basic diagnostics.', 400, 'fixed', true);

  -- ============================================================
  -- WORKER 13: Refilwe Mogale — Cleaning specialist (beginner)
  -- ============================================================
  v_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, email_change, is_sso_user)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', 'refilwemogale918@gmail.com', crypt('yenza123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"worker"}', '', '', false);
  INSERT INTO profiles (id, first_name, surname, display_name, phone, email, preferred_language, bio, role, primary_location, service_areas, availability, worker_status, identity_verified, is_available, experience_level, experience_detail, qualifications_summary, profile_photo_set)
  VALUES (v_id, 'Refilwe', 'Mogale', 'Refilwe Mogale', '0712345612', 'refilwemogale918@gmail.com', 'English',
    'I am new to professional cleaning but I take pride in my work. I do thorough house cleaning and laundry. Available Mondays to Saturdays.',
    'worker', 'Madadeni Section 2', '["Madadeni Section 1","Madadeni Section 2","Madadeni Section 3"]'::jsonb, '{"days":["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]}'::jsonb,
    'available', false, true, 'New to the trade',
    'Started cleaning houses in 2025. I want to learn event management and catering assistance to expand my income.',
    '[]'::jsonb, false);
  SELECT id INTO v_svc FROM services WHERE name='Cleaning'; INSERT INTO worker_services (worker_id, service_id, experience_level, years_experience, description, starting_price, pricing_type, active) VALUES (v_id, v_svc, 'New to the trade', 'New to the trade', 'House cleaning, laundry, and general domestic work.', 130, 'hourly', true);

  -- ============================================================
  -- WORKER 14: Mandla Zwide — Solar & electrical (junior)
  -- ============================================================
  v_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, email_change, is_sso_user)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', 'mandlazwide305@gmail.com', crypt('yenza123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"worker"}', '', '', false);
  INSERT INTO profiles (id, first_name, surname, display_name, phone, email, preferred_language, bio, role, primary_location, service_areas, availability, worker_status, identity_verified, is_available, experience_level, experience_detail, qualifications_summary, profile_photo_set)
  VALUES (v_id, 'Mandla', 'Zwide', 'Mandla Zwide', '0712345613', 'mandlazwide305@gmail.com', 'isiZulu',
    'I install solar panels and do basic electrical work. I have been working under a qualified electrician for two years.',
    'worker', 'Madadeni Section 6', '["Madadeni Section 6","Madadeni Section 7","Osizweni","Mndozo"]'::jsonb, '{"days":["Monday","Tuesday","Wednesday","Thursday","Friday"]}'::jsonb,
    'available', false, true, '1–2 years',
    'Working as an assistant electrician since 2024. I want to get my wireman''s license and start my own business.',
    '[]'::jsonb, false);
  SELECT id INTO v_svc FROM services WHERE name='Solar Installation'; INSERT INTO worker_services (worker_id, service_id, experience_level, years_experience, description, starting_price, pricing_type, active) VALUES (v_id, v_svc, '1–2 years', '1–2 years', 'Solar panel installation assistant. Basic system setup and maintenance.', 600, 'fixed', true);
  SELECT id INTO v_svc FROM services WHERE name='Electrical'; INSERT INTO worker_services (worker_id, service_id, experience_level, years_experience, description, starting_price, pricing_type, active) VALUES (v_id, v_svc, '1–2 years', '1–2 years', 'Basic electrical repairs, plug replacement, and light installations under supervision.', 300, 'fixed', true);

  -- ============================================================
  -- WORKER 15: Karabo Sithole — Welding & carpentry (experienced, busy)
  -- ============================================================
  v_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, email_change, is_sso_user)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', 'karabosithole726@gmail.com', crypt('yenza123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"worker"}', '', '', false);
  INSERT INTO profiles (id, first_name, surname, display_name, phone, email, preferred_language, bio, role, primary_location, service_areas, availability, worker_status, identity_verified, is_available, experience_level, experience_detail, qualifications_summary, profile_photo_set)
  VALUES (v_id, 'Karabo', 'Sithole', 'Karabo Sithole', '0712345614', 'karabosithole726@gmail.com', 'English',
    'Welder and carpenter with five years experience. I make gates, burglar bars, and wooden furniture. Currently busy with a big contract.',
    'worker', 'Utrecht', '["Charlestown","Fernwood","Utrecht"]'::jsonb, '{"days":["Monday","Tuesday","Wednesday","Thursday","Friday"]}'::jsonb,
    'busy', true, false, '5+ years',
    'Started welding in 2020 and added carpentry in 2022. I want to learn solar installation to offer off-grid solutions to my clients.',
    '[{"label":"Identity verification","status":"verified","description":"ID confirmed"},{"label":"Qualification","status":"not_provided","description":""},{"label":"Professional registration","status":"not_provided","description":""}]'::jsonb, false);
  SELECT id INTO v_svc FROM services WHERE name='Welding'; INSERT INTO worker_services (worker_id, service_id, experience_level, years_experience, description, starting_price, pricing_type, active) VALUES (v_id, v_svc, '5+ years', '5+ years', 'Gates, burglar bars, steel frames, and structural welding.', 900, 'fixed', true);
  SELECT id INTO v_svc FROM services WHERE name='Carpentry'; INSERT INTO worker_services (worker_id, service_id, experience_level, years_experience, description, starting_price, pricing_type, active) VALUES (v_id, v_svc, '3–5 years', '3–5 years', 'Wooden furniture, door frames, and basic carpentry repairs.', 700, 'fixed', true);

END $$;

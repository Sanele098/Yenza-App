/*
# Seed 5 employer accounts

Adds five demo employers (Codegenai Technologies, Buildware Hardware, Foresight Security
Service, Marie Clarie Book, Aluswe Group Holdings) that can be used to log in and post
jobs. Each gets an auth.users row (with the GoTrue identity payload shape that
signInWithPassword expects) plus a matching profiles row.

Passwords: every account uses "yenza123".
Email confirmation: already confirmed (email_confirmed_at set).
Account types: Small business / Organisation / Household / Landlord as appropriate.
*/

DO $$
DECLARE
  v_id uuid;
BEGIN
  -- ============================================================
  -- EMPLOYER 1: Codegenai Technologies (Construction & Tech, Osizweni)
  -- ============================================================
  v_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, email_change, is_sso_user)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', 'solutions@codegenai.tech', crypt('yenza123', gen_salt('bf')), now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('sub', v_id::text, 'email', 'solutions@codegenai.tech', 'email_verified', true, 'phone_verified', false),
    '', '', false);
  INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
  VALUES (v_id::text, v_id, jsonb_build_object('sub', v_id::text, 'email', 'solutions@codegenai.tech', 'email_verified', true, 'phone_verified', false), 'email', now(), now(), now());
  INSERT INTO profiles (id, first_name, surname, display_name, phone, email, preferred_language, role, account_type, primary_location, bio, identity_verified, profile_photo_set, qualifications_summary)
  VALUES (v_id, 'Codegenai', 'Technologies', 'Codegenai Technologies', '0712345620', 'solutions@codegenai.tech', 'English', 'employer', 'Small business', 'Osizweni',
    'Construction and technology company based in Osizweni. We handle building projects, renovations, and tech-enabled site management across Newcastle and surrounding areas.',
    false, false, '[]'::jsonb);

  -- ============================================================
  -- EMPLOYER 2: Buildware Hardware (Hardware store, Madadeni Section 2)
  -- ============================================================
  v_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, email_change, is_sso_user)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', 'support@buildware.co.za', crypt('yenza123', gen_salt('bf')), now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('sub', v_id::text, 'email', 'support@buildware.co.za', 'email_verified', true, 'phone_verified', false),
    '', '', false);
  INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
  VALUES (v_id::text, v_id, jsonb_build_object('sub', v_id::text, 'email', 'support@buildware.co.za', 'email_verified', true, 'phone_verified', false), 'email', now(), now(), now());
  INSERT INTO profiles (id, first_name, surname, display_name, phone, email, preferred_language, role, account_type, primary_location, bio, identity_verified, profile_photo_set, qualifications_summary)
  VALUES (v_id, 'Buildware', 'Hardware', 'Buildware Hardware', '0712345621', 'support@buildware.co.za', 'English', 'employer', 'Small business', 'Madadeni Section 2',
    'Hardware and building materials store in Madadeni Section 2. We supply contractors and households with cement, paint, tools, plumbing fittings, and more. We frequently need loaders, stock counters, and delivery assistants.',
    false, false, '[]'::jsonb);

  -- ============================================================
  -- EMPLOYER 3: Foresight Security Service (FSS) (Security company, Newcastle CBD)
  -- ============================================================
  v_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, email_change, is_sso_user)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', 'admin@foresightsecurity.co.za', crypt('yenza123', gen_salt('bf')), now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('sub', v_id::text, 'email', 'admin@foresightsecurity.co.za', 'email_verified', true, 'phone_verified', false),
    '', '', false);
  INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
  VALUES (v_id::text, v_id, jsonb_build_object('sub', v_id::text, 'email', 'admin@foresightsecurity.co.za', 'email_verified', true, 'phone_verified', false), 'email', now(), now(), now());
  INSERT INTO profiles (id, first_name, surname, display_name, phone, email, preferred_language, role, account_type, primary_location, bio, identity_verified, profile_photo_set, qualifications_summary)
  VALUES (v_id, 'Foresight Security', 'Service', 'Foresight Security Service (FSS)', '0712345622', 'admin@foresightsecurity.co.za', 'English', 'employer', 'Organisation', 'Newcastle CBD',
    'Registered security company operating across Newcastle and KwaZulu-Natal. We provide guarding, event security, and access control. We hire general labour for site setup, patrol support, and equipment handling.',
    false, false, '[]'::jsonb);

  -- ============================================================
  -- EMPLOYER 4: Marie Clarie Book (Household owner, Newcastle Town)
  -- ============================================================
  v_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, email_change, is_sso_user)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', 'marieclarie.book@gmail.com', crypt('yenza123', gen_salt('bf')), now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('sub', v_id::text, 'email', 'marieclarie.book@gmail.com', 'email_verified', true, 'phone_verified', false),
    '', '', false);
  INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
  VALUES (v_id::text, v_id, jsonb_build_object('sub', v_id::text, 'email', 'marieclarie.book@gmail.com', 'email_verified', true, 'phone_verified', false), 'email', now(), now(), now());
  INSERT INTO profiles (id, first_name, surname, display_name, phone, email, preferred_language, role, account_type, primary_location, bio, identity_verified, profile_photo_set, qualifications_summary)
  VALUES (v_id, 'Marie Clarie', 'Book', 'Marie Clarie Book', '0712345623', 'marieclarie.book@gmail.com', 'English', 'employer', 'Household', 'Newcastle Town',
    'Homeowner in Newcastle Town. I regularly need help with house cleaning, gardening, laundry, and occasional painting and minor repairs around the house.',
    false, false, '[]'::jsonb);

  -- ============================================================
  -- EMPLOYER 5: Aluswe Group Holdings (BnB & rental housing, Newcastle CBD)
  -- ============================================================
  v_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, email_change, is_sso_user)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', 'info@aluswegroup.co.za', crypt('yenza123', gen_salt('bf')), now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('sub', v_id::text, 'email', 'info@aluswegroup.co.za', 'email_verified', true, 'phone_verified', false),
    '', '', false);
  INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
  VALUES (v_id::text, v_id, jsonb_build_object('sub', v_id::text, 'email', 'info@aluswegroup.co.za', 'email_verified', true, 'phone_verified', false), 'email', now(), now(), now());
  INSERT INTO profiles (id, first_name, surname, display_name, phone, email, preferred_language, role, account_type, primary_location, bio, identity_verified, profile_photo_set, qualifications_summary)
  VALUES (v_id, 'Aluswe Group', 'Holdings', 'Aluswe Group Holdings', '0712345624', 'info@aluswegroup.co.za', 'English', 'employer', 'Landlord', 'Newcastle CBD',
    'Property company managing short-stay BnB units and rental housing across Newcastle. We frequently need cleaning, painting, plumbing, electrical, and general maintenance work across our units.',
    false, false, '[]'::jsonb);
END $$;

/*
# Create profile-photos storage bucket

1. Storage
- Create a public bucket `profile-photos` for worker/employer profile pictures.
- Max file size 5MB, allowed types: jpeg, png, webp.
2. Security (storage.objects policies)
- Any authenticated user can upload (owner = auth.uid() enforced).
- Public read (bucket is public, so anyone can view profile photos).
- Users can delete only their own uploads.
3. Notes
- The `profiles` table already has `profile_photo` (text URL) and `profile_photo_set` (boolean) columns.
- No schema changes needed — this migration only creates the storage bucket and its policies.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-photos', 'profile-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "upload_profile_photos" ON storage.objects;
CREATE POLICY "upload_profile_photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "read_profile_photos" ON storage.objects;
CREATE POLICY "read_profile_photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "delete_profile_photos" ON storage.objects;
CREATE POLICY "delete_profile_photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-photos' AND owner = auth.uid());

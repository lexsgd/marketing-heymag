-- FoodSnap AI - Storage Bucket Policies
-- Run this AFTER creating the buckets in Supabase Dashboard

-- ============================================
-- CREATE STORAGE BUCKETS
-- Run these first in SQL Editor:
-- ============================================

-- Images bucket (private - authenticated users only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  FALSE,
  52428800, -- 50MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Templates bucket (public - for template thumbnails)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'templates',
  'templates',
  TRUE,
  10485760, -- 10MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- STORAGE POLICIES FOR IMAGES BUCKET
-- ============================================

-- Users can upload images to their own folder
CREATE POLICY "Users can upload images" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'images'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM businesses WHERE auth_user_id = auth.uid()
    )
  );

-- Users can view their own images
CREATE POLICY "Users can view own images" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'images'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM businesses WHERE auth_user_id = auth.uid()
    )
  );

-- Users can update their own images
CREATE POLICY "Users can update own images" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'images'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM businesses WHERE auth_user_id = auth.uid()
    )
  );

-- Users can delete their own images
CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'images'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM businesses WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================
-- STORAGE POLICIES FOR TEMPLATES BUCKET
-- ============================================

-- Anyone can view template assets (public bucket)
CREATE POLICY "Anyone can view templates" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'templates');

-- Only service role can manage templates
-- (No INSERT/UPDATE/DELETE policies = service role only)

-- ============================================
-- NOTES FOR FILE STRUCTURE
-- ============================================
-- Images should be stored as:
--   images/{business_id}/original/{filename}
--   images/{business_id}/enhanced/{filename}
--   images/{business_id}/thumbnails/{filename}
--
-- Templates should be stored as:
--   templates/{template_id}/thumbnail.{ext}
--   templates/{template_id}/preview.{ext}
--   templates/{template_id}/assets/{filename}

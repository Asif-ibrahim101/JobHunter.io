-- Run this in Supabase SQL Editor to allow server-side access to user_profiles
-- This creates a policy that allows reading profiles by user_id directly

-- Option 1: Add a policy for service role access (bypasses RLS)
-- If you add SUPABASE_SERVICE_ROLE_KEY to your .env.local, you don't need this

-- Option 2: Add a policy that allows read access when user_id is provided
-- This is less secure but works for development

CREATE POLICY "Allow server-side profile read by user_id"
  ON user_profiles FOR SELECT
  USING (true);

-- Note: This makes all profiles readable. For production, you should:
-- 1. Use the SUPABASE_SERVICE_ROLE_KEY in your .env.local instead
-- 2. Get it from Supabase Dashboard > Project Settings > API > service_role key

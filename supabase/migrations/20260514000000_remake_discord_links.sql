-- Drop old linking table and recreate with a cleaner schema.
-- clerk_user_id is stored as TEXT directly — no more UUID hash conversion.
-- Codes expire after 10 minutes. Both bot and dashboard use service_role key
-- so RLS is not needed here (no auth.uid() available for Clerk users).

DROP TABLE IF EXISTS public.discord_links CASCADE;

CREATE TABLE public.discord_links (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id    TEXT        NOT NULL UNIQUE,
  verification_code TEXT       UNIQUE,
  expires_at       TIMESTAMPTZ,
  verified         BOOLEAN     NOT NULL DEFAULT false,
  discord_user_id  TEXT        UNIQUE,
  discord_username TEXT,
  linked_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.discord_links ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER discord_links_touch
  BEFORE UPDATE ON public.discord_links
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

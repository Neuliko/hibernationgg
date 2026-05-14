-- Make clerk_user_id nullable so the bot can create the row first
-- (discord_user_id is known at bot time; clerk_user_id is filled when dashboard claims it).
-- Drop and recreate cleanly since this is a fresh project.

DROP TABLE IF EXISTS public.discord_links CASCADE;

CREATE TABLE public.discord_links (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id    TEXT        UNIQUE,
  discord_user_id  TEXT        UNIQUE,
  discord_username TEXT,
  verification_code TEXT       UNIQUE,
  expires_at       TIMESTAMPTZ,
  verified         BOOLEAN     NOT NULL DEFAULT false,
  linked_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.discord_links ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER discord_links_touch
  BEFORE UPDATE ON public.discord_links
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

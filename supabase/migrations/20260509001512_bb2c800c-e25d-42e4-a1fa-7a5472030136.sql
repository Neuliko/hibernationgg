
ALTER TABLE public.discord_links
  ALTER COLUMN discord_user_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS discord_links_user_id_key ON public.discord_links(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS discord_links_verification_code_key
  ON public.discord_links(verification_code) WHERE verification_code IS NOT NULL;

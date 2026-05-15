ALTER TABLE public.discord_servers
  ADD COLUMN IF NOT EXISTS discord_owner_id TEXT;

CREATE INDEX IF NOT EXISTS idx_discord_servers_owner_id
  ON public.discord_servers(discord_owner_id);

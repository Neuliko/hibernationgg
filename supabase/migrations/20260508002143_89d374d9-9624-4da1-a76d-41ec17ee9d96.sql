
-- ROLES (separate table for security)
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- TIMESTAMP TRIGGER
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- DISCORD LINKS (Clerk/auth user ↔ Discord identity)
CREATE TABLE public.discord_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  discord_user_id TEXT NOT NULL,
  discord_username TEXT,
  verification_code TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (discord_user_id)
);
ALTER TABLE public.discord_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own links" ON public.discord_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own links" ON public.discord_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own links" ON public.discord_links FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own links" ON public.discord_links FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER discord_links_touch BEFORE UPDATE ON public.discord_links FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- DISCORD SERVERS
CREATE TABLE public.discord_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  owner_user_id UUID,
  inactivity_threshold_minutes INTEGER NOT NULL DEFAULT 60,
  hibernation_enabled BOOLEAN NOT NULL DEFAULT true,
  nickname_automation BOOLEAN NOT NULL DEFAULT true,
  light_sleep_minutes INTEGER NOT NULL DEFAULT 60,
  deep_sleep_minutes INTEGER NOT NULL DEFAULT 360,
  frozen_minutes INTEGER NOT NULL DEFAULT 1440,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.discord_servers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner view server" ON public.discord_servers FOR SELECT USING (auth.uid() = owner_user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner update server" ON public.discord_servers FOR UPDATE USING (auth.uid() = owner_user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated insert server" ON public.discord_servers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE TRIGGER discord_servers_touch BEFORE UPDATE ON public.discord_servers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- HIBERNATION TARGETS (channels + users in hibernation tracking)
CREATE TYPE public.target_kind AS ENUM ('channel', 'user');
CREATE TYPE public.sleep_state AS ENUM ('awake', 'light', 'deep', 'frozen');

CREATE TABLE public.hibernation_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES public.discord_servers(id) ON DELETE CASCADE,
  guild_id TEXT NOT NULL,
  kind target_kind NOT NULL,
  target_id TEXT NOT NULL,
  display_name TEXT,
  original_nickname TEXT,
  state sleep_state NOT NULL DEFAULT 'awake',
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  hibernation_started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (server_id, kind, target_id)
);
ALTER TABLE public.hibernation_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View targets via server" ON public.hibernation_targets FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.discord_servers s WHERE s.id = server_id AND (s.owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE TRIGGER hibernation_targets_touch BEFORE UPDATE ON public.hibernation_targets FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX idx_targets_server_state ON public.hibernation_targets(server_id, state);

-- HIBERNATION EVENTS (history)
CREATE TYPE public.event_type AS ENUM ('hibernate', 'wake', 'state_change', 'nickname_change', 'config_change');

CREATE TABLE public.hibernation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES public.discord_servers(id) ON DELETE CASCADE,
  target_id UUID REFERENCES public.hibernation_targets(id) ON DELETE SET NULL,
  type event_type NOT NULL,
  from_state sleep_state,
  to_state sleep_state,
  duration_seconds INTEGER,
  trigger TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hibernation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View events via server" ON public.hibernation_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.discord_servers s WHERE s.id = server_id AND (s.owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE INDEX idx_events_server_created ON public.hibernation_events(server_id, created_at DESC);

-- BOT TOKENS (used by the Discord bot to authenticate to the API)
CREATE TABLE public.bot_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES public.discord_servers(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  label TEXT,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE public.bot_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner view bot tokens" ON public.bot_tokens FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.discord_servers s WHERE s.id = server_id AND s.owner_user_id = auth.uid())
);
CREATE POLICY "Owner manage bot tokens" ON public.bot_tokens FOR ALL USING (
  EXISTS (SELECT 1 FROM public.discord_servers s WHERE s.id = server_id AND s.owner_user_id = auth.uid())
);

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.hibernation_targets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hibernation_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.discord_servers;

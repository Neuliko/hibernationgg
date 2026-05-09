
ALTER TABLE public.hibernation_targets REPLICA IDENTITY FULL;
ALTER TABLE public.hibernation_events REPLICA IDENTITY FULL;
ALTER TABLE public.discord_servers REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.hibernation_targets;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.hibernation_events;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.discord_servers;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

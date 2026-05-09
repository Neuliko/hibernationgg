
ALTER TABLE public.discord_servers
  ALTER COLUMN light_sleep_minutes SET DEFAULT 180,
  ALTER COLUMN deep_sleep_minutes SET DEFAULT 1440,
  ALTER COLUMN frozen_minutes SET DEFAULT 10080,
  ALTER COLUMN nickname_automation SET DEFAULT true,
  ALTER COLUMN hibernation_enabled SET DEFAULT true;

UPDATE public.discord_servers
  SET light_sleep_minutes = 180,
      deep_sleep_minutes = 1440,
      frozen_minutes = 10080,
      nickname_automation = true;

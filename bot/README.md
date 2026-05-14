# 🌙 Hibernation Portal — Discord Bot

Long-running Node worker. Watches your Discord server, hibernates idle channels & members through Light → Deep → Frozen, and wakes them on activity.

## Commands

Slash:
- `/ping` — latency, shard, cluster, servers, language, version

Prefix (default `h!`, configurable via `COMMAND_PREFIX`):
- `h!help` — list every command
- `h!ping` — quick latency snapshot
- `h!hibernate status` — sleep counts
- `h!hibernate toggle on|off` — master switch (Manage Guild)
- `h!hibernate wake` — wake everything (Manage Guild)
- `h!link CODE` — link Discord to your dashboard account

> Prefix commands need the **Message Content Intent** enabled in Discord Developer Portal → Bot.

## Quick start
```bash
cd bot
npm install
cp .env.example .env  # fill in DISCORD_TOKEN + SUPABASE creds
npm start
```

## Hosting (Render)
1. New → **Background Worker** (not web service).
2. Connect repo, **Root Directory** = `bot`.
3. Build: `npm install`. Start: `npm start`.
4. Add env vars from `.env.example`.

`render.yaml` blueprint included.

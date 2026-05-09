# 🌙 Hibernation Portal — Discord Bot

The bot half of Hibernation Portal. A long-running Node.js process that watches your Discord server for inactivity, transitions channels and members through sleep states (Light → Deep → Frozen), and wakes them on activity.

## Quick start

```bash
cd bot
npm install
cp .env.example .env
# fill in DISCORD_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
npm run dev
```

The bot needs these Discord permissions when invited:
- View Channels
- Send Messages
- Read Message History
- Manage Nicknames
- Use Application Commands

Invite scopes: `bot`, `applications.commands`.

## Slash commands

- `/ping` — latency, shard, cluster, server count, language, version
- `/hibernate status` — current sleep counts
- `/hibernate toggle enabled:true|false` — master switch
- `/hibernate wake` — wake everything in this server
- `/link CODE` — link your Discord identity to your dashboard account

> Commands register **globally** on every boot. Global propagation can take up to 1 hour the first time. For instant updates in one test server, set `GUILD_ID=<your-server-id>` — the bot will *also* register guild-scoped commands which appear immediately.
> If commands still don't show: re-invite the bot using a URL that includes the **`applications.commands`** scope (not just `bot`).
> You can also force-refresh without restarting the gateway: `npm run register`.

## Environment

| Var | Required | Description |
|-----|----------|-------------|
| `DISCORD_TOKEN` | ✓ | Bot token from the Discord Developer Portal |
| `SUPABASE_URL` | ✓ | Lovable Cloud URL (from project `.env`) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | Service role key — get from Lovable Cloud → Settings → API |
| `GUILD_ID` | optional | Register commands to one guild for instant updates |
| `SCAN_INTERVAL_MS` | optional | How often to scan for inactivity (default 60000) |

## Hosting

The bot keeps a persistent Discord gateway connection, so serverless platforms (Vercel, Cloudflare Workers, Netlify) **won't** work. Pick one of:

### Railway (easiest)
1. New project → Deploy from GitHub → pick this repo, root `/bot`
2. Add the env vars from `.env.example`
3. Done. The bot stays online 24/7. (`railway.json` included.)

### Render (recommended for this project)

1. Push this repo to GitHub.
2. In Render → **New → Background Worker** (a worker, **not** a web service — the bot has no HTTP port).
3. **Connect repository**, then set **Root Directory** to `bot`.
4. Runtime: `Node`. Build command: `npm install`. Start command: `npm start`.
5. Add environment variables (Settings → Environment):
   - `DISCORD_TOKEN` — bot token from the Discord Developer Portal
   - `SUPABASE_URL` — value from this project's `.env` (`VITE_SUPABASE_URL`)
   - `SUPABASE_SERVICE_ROLE_KEY` — Lovable Cloud → Settings → API
   - *(optional)* `GUILD_ID` — your test server id for instant slash-command updates
6. Click **Create Worker**. Render will install, start, and keep the bot online 24/7.
7. After the first boot, run `/ping` in your server. If it doesn't appear, wait ~1 minute and re-invite with the `applications.commands` scope.

A `render.yaml` blueprint is included — you can also do **New → Blueprint** and point at this repo to skip the form.

### VPS / Docker
```bash
docker build -t hibernation-bot bot/
docker run -d --env-file bot/.env --restart=always hibernation-bot
```
Or with PM2: `pm2 start bot/ecosystem.config.cjs`.

## How it talks to the dashboard

The bot uses the **service role** Supabase key to write directly into the same database the dashboard reads. Realtime is enabled on `hibernation_events`, `hibernation_targets`, and `discord_servers` — so any state change in the bot streams to every open dashboard tab instantly. No separate WebSocket server required.

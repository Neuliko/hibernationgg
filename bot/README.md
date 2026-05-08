# 🌙 HibernationOS — Discord Bot

The bot half of HibernationOS. A long-running Node.js process that watches your Discord server for inactivity, transitions channels and members through sleep states (Light → Deep → Frozen), and wakes them on activity.

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

- `/hibernate status` — current sleep counts
- `/hibernate toggle enabled:true|false` — master switch
- `/hibernate wake` — wake everything in this server
- `/link CODE` — link your Discord identity to your dashboard account

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

### Render
1. New → Background Worker
2. Root directory: `bot`
3. Build: `npm install` · Start: `npm start`
4. Add env vars. (`render.yaml` included.)

### VPS / Docker
```bash
docker build -t hibernation-bot bot/
docker run -d --env-file bot/.env --restart=always hibernation-bot
```
Or with PM2: `pm2 start bot/ecosystem.config.cjs`.

## How it talks to the dashboard

The bot uses the **service role** Supabase key to write directly into the same database the dashboard reads. Realtime is enabled on `hibernation_events`, `hibernation_targets`, and `discord_servers` — so any state change in the bot streams to every open dashboard tab instantly. No separate WebSocket server required.

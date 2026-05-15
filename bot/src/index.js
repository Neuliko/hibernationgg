// Discord client + Supabase wiring. Robust for long-running deploys:
//  - HTTP health server bound to PORT (required by Railway/Render web services)
//  - no realtime websocket (bot is write-only into Supabase)
//  - every event handler is wrapped in a safe boundary
//  - presence updates are debounced per user
//  - uncaughtException exits cleanly so the platform can restart
import "dotenv/config";
import { createServer } from "node:http";
import { Client, GatewayIntentBits, Partials, Events, ActivityType } from "discord.js";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { registerSlashCommands, handleSlash, handlePrefix, PREFIX } from "./commands.js";
import { ensureServer, recordActivity, scanAndHibernate, wakeTarget } from "./hibernation.js";

const {
  DISCORD_TOKEN,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SCAN_INTERVAL_MS = 60000,
  PORT = 3000,
} = process.env;

if (!DISCORD_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing env vars. See .env.example");
  process.exit(1);
}

// ─── Health check HTTP server ─────────────────────────────────────────────────
// Railway and Render web-service deployments require something listening on PORT.
// This tiny server also exposes a /health endpoint for uptime monitors.
let botReady = false;
const healthServer = createServer((req, res) => {
  if (req.url === "/health" || req.url === "/") {
    const status = botReady ? 200 : 503;
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: botReady, uptime: process.uptime() }));
  } else {
    res.writeHead(404);
    res.end();
  }
});
healthServer.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`🩺 Health server listening on port ${PORT}`);
});
healthServer.on("error", (e) => console.error("[health server]", e.message));

// ─── Supabase ─────────────────────────────────────────────────────────────────
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws },
});

// ─── Discord client ───────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [Partials.Channel, Partials.Message],
});

const safe = (label, fn) => async (...args) => {
  try { await fn(...args); } catch (err) {
    console.error(`[${label}]`, err?.message || err);
  }
};

// Debounce presence writes — Discord fires these constantly.
const PRESENCE_DEBOUNCE_MS = 60_000;
const lastPresence = new Map();
setInterval(() => {
  const cutoff = Date.now() - PRESENCE_DEBOUNCE_MS * 5;
  for (const [k, v] of lastPresence) if (v < cutoff) lastPresence.delete(k);
}, 5 * 60_000).unref();

let scanTimer = null;

function setPresence(c) {
  const count = c.guilds.cache.size;
  c.user.setPresence({
    status: "online",
    activities: [{ name: `${count} server${count !== 1 ? "s" : ""}`, type: ActivityType.Watching }],
  });
}

client.once(Events.ClientReady, safe("ready", async (c) => {
  botReady = true;
  console.log(`🌙 Hibernation Portal online · ${c.user.tag} · guilds=${c.guilds.cache.size} · prefix="${PREFIX}"`);
  setPresence(c);

  for (const guild of c.guilds.cache.values()) {
    await ensureServer(supabase, guild).catch((e) =>
      console.error("ensureServer", guild.id, e?.message)
    );
  }

  await registerSlashCommands(c).catch((e) => console.error("registerSlash", e?.message));

  if (scanTimer) clearInterval(scanTimer);
  scanTimer = setInterval(() => {
    for (const guild of client.guilds.cache.values()) {
      scanAndHibernate(supabase, client, guild).catch((err) =>
        console.error("scan", guild.id, err?.message)
      );
    }
  }, Number(SCAN_INTERVAL_MS));
  scanTimer.unref?.();
}));

client.on(Events.GuildCreate, safe("guildCreate", async (guild) => {
  await ensureServer(supabase, guild);
  setPresence(client);
}));

client.on(Events.MessageCreate, safe("messageCreate", async (msg) => {
  if (msg.author.bot || !msg.guild) return;

  const wasCommand = await handlePrefix(supabase, client, msg).catch((err) => {
    console.error("prefix", err?.message);
    return false;
  });

  await recordActivity(supabase, msg.guild, {
    channelId: msg.channelId,
    userId: msg.author.id,
    username: msg.author.username,
  }).catch((e) => console.error("recordActivity", e?.message));

  await wakeTarget(supabase, client, msg.guild, "channel", msg.channelId, "message")
    .catch((e) => console.error("wake channel", e?.message));
  await wakeTarget(supabase, client, msg.guild, "user", msg.author.id, "message")
    .catch((e) => console.error("wake user", e?.message));

  void wasCommand;
}));

client.on(Events.PresenceUpdate, safe("presenceUpdate", async (_old, presence) => {
  if (!presence?.guild || !presence.user || presence.user.bot) return;
  if (!presence.status || presence.status === "offline") return;

  const key = `${presence.guild.id}:${presence.user.id}`;
  const now = Date.now();
  if (now - (lastPresence.get(key) || 0) < PRESENCE_DEBOUNCE_MS) return;
  lastPresence.set(key, now);

  await recordActivity(supabase, presence.guild, {
    userId: presence.user.id,
    username: presence.user.username,
  });
  await wakeTarget(supabase, client, presence.guild, "user", presence.user.id, "presence");
}));

client.on(Events.InteractionCreate, safe("interaction", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  await handleSlash(supabase, client, interaction);
}));

// ─── Gateway resilience ───────────────────────────────────────────────────────
client.on(Events.Error, (e) => console.error("[client.error]", e?.message || e));
client.on(Events.Warn, (w) => console.warn("[client.warn]", w));
client.on(Events.ShardError, (e, id) => console.error(`[shard ${id} error]`, e?.message || e));
client.on(Events.ShardDisconnect, (ev, id) => console.warn(`[shard ${id} disconnect]`, ev?.code));
client.on(Events.ShardReconnecting, (id) => console.log(`[shard ${id}] reconnecting…`));
client.on(Events.ShardResume, (id, replayed) => console.log(`[shard ${id}] resumed (${replayed} events)`));

// ─── Process error handlers ───────────────────────────────────────────────────
process.on("unhandledRejection", (e) => console.error("[unhandledRejection]", e?.message || e));

// Exit on uncaught exceptions so the platform (Render/Railway) auto-restarts the process.
process.on("uncaughtException", (e) => {
  console.error("[uncaughtException] fatal — restarting:", e?.message || e, e?.stack || "");
  process.exit(1);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
const shutdown = async (sig) => {
  console.log(`\n${sig} received, shutting down…`);
  botReady = false;
  if (scanTimer) clearInterval(scanTimer);
  try { await client.destroy(); } catch {}
  healthServer.close();
  process.exit(0);
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// ─── Login ────────────────────────────────────────────────────────────────────
client.login(DISCORD_TOKEN).catch((e) => {
  console.error("❌ login failed:", e?.message || e);
  process.exit(1);
});

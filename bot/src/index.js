import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
} from "discord.js";
import { createClient } from "@supabase/supabase-js";
import { registerCommands, handleSlashCommand, handlePrefixCommand } from "./commands.js";
import {
  ensureServer,
  recordActivity,
  scanAndHibernate,
  wakeTarget,
} from "./hibernation.js";

const {
  DISCORD_TOKEN,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SCAN_INTERVAL_MS = 60000,
} = process.env;

if (!DISCORD_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing required env vars. Check .env.example");
  process.exit(1);
}

// IMPORTANT: do NOT pass `realtime: { transport: ws }`. The bot is a writer
// only — it does not subscribe to channels — and that option has been a
// source of mid-flight crashes on Render. Plain HTTP fetch is enough.
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

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

// ---------------------------------------------------------------------------
// Safety: never let a thrown promise inside an event handler kill the process.
// ---------------------------------------------------------------------------
const safe = (label, fn) => async (...args) => {
  try {
    await fn(...args);
  } catch (err) {
    console.error(`[${label}]`, err?.message || err);
  }
};

// Per-user presence debounce → avoid hammering the DB when 1k members are
// flipping online/offline/idle every few seconds.
const PRESENCE_DEBOUNCE_MS = 60_000;
const lastPresenceWrite = new Map();
setInterval(() => {
  const cutoff = Date.now() - PRESENCE_DEBOUNCE_MS * 5;
  for (const [k, v] of lastPresenceWrite) if (v < cutoff) lastPresenceWrite.delete(k);
}, 5 * 60_000).unref();

let scanTimer = null;

client.once(Events.ClientReady, safe("ready", async (c) => {
  console.log(`🌙 Hibernation Portal online as ${c.user.tag} · guilds=${c.guilds.cache.size}`);

  for (const guild of c.guilds.cache.values()) {
    await ensureServer(supabase, guild).catch((e) => console.error("ensureServer", guild.id, e?.message));
  }

  await registerCommands(c).catch((e) => console.error("registerCommands", e?.message));

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
}));

client.on(Events.MessageCreate, safe("messageCreate", async (msg) => {
  if (msg.author.bot || !msg.guild) return;

  // Prefix commands first — if it's a command, we still also record activity.
  await handlePrefixCommand(supabase, client, msg).catch((err) =>
    console.error("prefix", err?.message)
  );

  await recordActivity(supabase, msg.guild, {
    channelId: msg.channelId,
    userId: msg.author.id,
    username: msg.author.username,
  }).catch((err) => console.error("recordActivity", err?.message));

  await wakeTarget(supabase, client, msg.guild, "channel", msg.channelId, "message")
    .catch((err) => console.error("wake channel", err?.message));
  await wakeTarget(supabase, client, msg.guild, "user", msg.author.id, "message")
    .catch((err) => console.error("wake user", err?.message));
}));

client.on(Events.PresenceUpdate, safe("presenceUpdate", async (_old, presence) => {
  if (!presence?.guild || !presence.user || presence.user.bot) return;
  if (!presence.status || presence.status === "offline") return;

  // Debounce per user/guild — presence events fire constantly.
  const key = `${presence.guild.id}:${presence.user.id}`;
  const now = Date.now();
  const last = lastPresenceWrite.get(key) || 0;
  if (now - last < PRESENCE_DEBOUNCE_MS) return;
  lastPresenceWrite.set(key, now);

  await recordActivity(supabase, presence.guild, {
    userId: presence.user.id,
    username: presence.user.username,
  });
  await wakeTarget(supabase, client, presence.guild, "user", presence.user.id, "presence");
}));

client.on(Events.InteractionCreate, safe("interaction", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  await handleSlashCommand(supabase, client, interaction);
}));

// ---------------------------------------------------------------------------
// Discord gateway resilience
// ---------------------------------------------------------------------------
client.on(Events.Error, (e) => console.error("[client.error]", e?.message || e));
client.on(Events.Warn, (w) => console.warn("[client.warn]", w));
client.on(Events.ShardError, (e, id) => console.error(`[shard ${id} error]`, e?.message || e));
client.on(Events.ShardDisconnect, (ev, id) => console.warn(`[shard ${id} disconnect]`, ev?.code));
client.on(Events.ShardReconnecting, (id) => console.log(`[shard ${id}] reconnecting…`));
client.on(Events.ShardResume, (id, replayed) => console.log(`[shard ${id}] resumed (${replayed} events)`));

// Process-level safety nets — log, never exit.
process.on("unhandledRejection", (e) => console.error("[unhandledRejection]", e?.message || e));
process.on("uncaughtException", (e) => console.error("[uncaughtException]", e?.message || e));

const shutdown = async (sig) => {
  console.log(`\n${sig} received, shutting down…`);
  if (scanTimer) clearInterval(scanTimer);
  try { await client.destroy(); } catch {}
  process.exit(0);
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

client.login(DISCORD_TOKEN).catch((e) => {
  console.error("❌ login failed:", e?.message || e);
  process.exit(1);
});

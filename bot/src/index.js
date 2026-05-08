import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  EmbedBuilder,
} from "discord.js";
import { createClient } from "@supabase/supabase-js";
import { registerCommands, handleSlashCommand } from "./commands.js";
import {
  ensureServer,
  recordActivity,
  scanAndHibernate,
  wakeTarget,
  applyNickname,
  restoreNickname,
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

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
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

client.once(Events.ClientReady, async (c) => {
  console.log(`🌙 Hibernation Portal online as ${c.user.tag}`);
  console.log(`   guilds: ${c.guilds.cache.size}`);

  // Register guilds in DB
  for (const guild of c.guilds.cache.values()) {
    await ensureServer(supabase, guild);
  }

  await registerCommands(c);

  // Periodic scan for inactivity
  setInterval(() => {
    for (const guild of client.guilds.cache.values()) {
      scanAndHibernate(supabase, client, guild).catch((err) =>
        console.error("scan error", err.message)
      );
    }
  }, Number(SCAN_INTERVAL_MS));
});

client.on(Events.GuildCreate, async (guild) => {
  await ensureServer(supabase, guild);
});

client.on(Events.MessageCreate, async (msg) => {
  if (msg.author.bot || !msg.guild) return;
  await recordActivity(supabase, msg.guild, {
    channelId: msg.channelId,
    userId: msg.author.id,
    username: msg.author.username,
  });
  // Wake channel + user if hibernating
  await wakeTarget(supabase, client, msg.guild, "channel", msg.channelId, "message");
  await wakeTarget(supabase, client, msg.guild, "user", msg.author.id, "message");
});

client.on(Events.PresenceUpdate, async (_old, presence) => {
  if (!presence.guild || !presence.user || presence.user.bot) return;
  if (presence.status && presence.status !== "offline") {
    await recordActivity(supabase, presence.guild, {
      userId: presence.user.id,
      username: presence.user.username,
    });
    await wakeTarget(
      supabase,
      client,
      presence.guild,
      "user",
      presence.user.id,
      "presence"
    );
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  await handleSlashCommand(supabase, client, interaction);
});

process.on("unhandledRejection", (e) => console.error("unhandledRejection", e));
process.on("uncaughtException", (e) => console.error("uncaughtException", e));

client.login(DISCORD_TOKEN);

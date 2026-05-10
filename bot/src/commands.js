import {
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  version as djsVersion,
} from "discord.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8"));

const BOT_VERSION = pkg.version || "1.0.0";
const LAST_UPDATE = process.env.BOT_LAST_UPDATE || new Date().toISOString().slice(0, 10);

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Show bot latency, shard, cluster, and version info"),
].map((c) => c.toJSON());

export async function registerCommands(client) {
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  const appId = client.user.id;
  const guildId = process.env.GUILD_ID;
  try {
    // Always register globally so the bot works in every guild.
    const globalRes = await rest.put(Routes.applicationCommands(appId), { body: commands });
    console.log(`✓ registered ${globalRes.length} GLOBAL commands (may take up to 1h to appear)`);

    // If GUILD_ID is set, ALSO register to that guild for instant updates while testing.
    if (guildId) {
      const guildRes = await rest.put(Routes.applicationGuildCommands(appId, guildId), { body: commands });
      console.log(`✓ registered ${guildRes.length} GUILD commands → ${guildId} (instant)`);
    }
  } catch (e) {
    console.error("❌ registerCommands failed:", e?.rawError || e?.message || e);
    console.error("   Make sure the bot was invited with the `applications.commands` scope.");
  }
}

export async function handleSlashCommand(supabase, client, interaction) {
  const { commandName } = interaction;
  if (commandName === "ping") return handlePing(client, interaction);
  if (commandName === "hibernate") return handleHibernate(supabase, interaction);
  if (commandName === "link") return handleLink(supabase, interaction);
}

async function handlePing(client, interaction) {
  const sent = Date.now();
  await interaction.deferReply();
  const roundTrip = Date.now() - sent;
  const ws = Math.round(client.ws.ping);
  const shardId = interaction.guild?.shardId ?? 0;
  const totalShards = client.ws.shards.size;
  const clusterId = process.env.CLUSTER_ID || "0";
  const guildCount = client.guilds.cache.size;
  const userCount = client.guilds.cache.reduce((a, g) => a + (g.memberCount || 0), 0);
  const uptimeSec = Math.floor((client.uptime || 0) / 1000);
  const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);

  const embed = new EmbedBuilder()
    .setColor(0x4f46e5)
    .setTitle("🛰️ Hibernation Portal · Ping")
    .addFields(
      { name: "📡 WebSocket", value: `${ws} ms`, inline: true },
      { name: "🔁 Round-trip", value: `${roundTrip} ms`, inline: true },
      { name: "💾 Memory", value: `${mem} MB`, inline: true },
      { name: "🧩 Shard", value: `${shardId} / ${totalShards}`, inline: true },
      { name: "🗂️ Cluster", value: `#${clusterId}`, inline: true },
      { name: "🌐 Servers", value: `${guildCount.toLocaleString()}`, inline: true },
      { name: "👥 Users", value: `${userCount.toLocaleString()}`, inline: true },
      { name: "⏱️ Uptime", value: `${formatUptime(uptimeSec)}`, inline: true },
      { name: "🛠️ Language", value: `Node.js ${process.version} · discord.js ${djsVersion}`, inline: false },
      { name: "🚀 Version", value: `\`v${BOT_VERSION}\` · last update \`${LAST_UPDATE}\``, inline: false }
    )
    .setFooter({ text: "Hibernation Portal · live telemetry" })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

function formatUptime(s) {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d) return `${d}d ${h}h ${m}m`;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export async function handlePrefixCommand(supabase, client, message) {
  const PREFIX = process.env.COMMAND_PREFIX || "!";
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase();

  if (command === "ping") {
    return handlePingPrefix(client, message);
  }

  if (command === "hibernate") {
    const subcommand = args[0]?.toLowerCase();
    const { data: server } = await supabase
      .from("discord_servers")
      .select("*")
      .eq("guild_id", message.guildId)
      .maybeSingle();

    if (!server) {
      return message.reply({ content: "Server not registered yet." });
    }

    if (subcommand === "status") {
      const { data: targets } = await supabase
        .from("hibernation_targets")
        .select("state")
        .eq("server_id", server.id);
      const counts = { awake: 0, light: 0, deep: 0, frozen: 0 };
      for (const t of targets || []) counts[t.state]++;
      const embed = new EmbedBuilder()
        .setColor(0x4f46e5)
        .setTitle("🌙 Hibernation Portal Status")
        .setDescription(`Engine: ${server.hibernation_enabled ? "✅ enabled" : "⛔ disabled"}`)
        .addFields(
          { name: "☀️ Awake", value: String(counts.awake), inline: true },
          { name: "💠 Light", value: String(counts.light), inline: true },
          { name: "🌙 Deep", value: String(counts.deep), inline: true },
          { name: "❄️ Frozen", value: String(counts.frozen), inline: true }
        );
      return message.reply({ embeds: [embed] });
    }

    if (subcommand === "toggle") {
      if (!args[1]) return message.reply({ content: "Usage: `!hibernate toggle <on|off>`" });
      const enabled = args[1]?.toLowerCase() === "on" || args[1] === "true";
      await supabase
        .from("discord_servers")
        .update({ hibernation_enabled: enabled })
        .eq("id", server.id);
      return message.reply({ content: `Hibernation engine ${enabled ? "✅ enabled" : "⛔ disabled"}.` });
    }

    if (subcommand === "wake") {
      if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return message.reply({ content: "❌ You need Manage Guild permissions." });
      }
      await supabase
        .from("hibernation_targets")
        .update({ state: "awake", hibernation_started_at: null, last_active_at: new Date().toISOString() })
        .eq("server_id", server.id)
        .neq("state", "awake");
      return message.reply({ content: "☀️ Woke all hibernating targets." });
    }

    if (!subcommand) return message.reply({ content: "Usage: `!hibernate <status|toggle|wake>`" });
  }

  if (command === "link") {
    const code = args[0];
    if (!code) return message.reply({ content: "Usage: `!link <verification-code>`" });
    return claimLinkCode(supabase, message, code);
  }
}

async function handlePingPrefix(client, message) {
  const sent = Date.now();
  const reply = await message.reply({ content: "🏓 Pinging…" });
  const roundTrip = Date.now() - sent;
  const ws = Math.round(client.ws.ping);
  const shardId = message.guild?.shardId ?? 0;
  const embed = new EmbedBuilder()
    .setColor(0x4f46e5)
    .setTitle("🛰️ Pong")
    .addFields(
      { name: "📡 WS", value: `${ws} ms`, inline: true },
      { name: "🔁 RT", value: `${roundTrip} ms`, inline: true },
      { name: "🧩 Shard", value: `${shardId}/${client.ws.shards.size}`, inline: true },
      { name: "🌐 Servers", value: `${client.guilds.cache.size}`, inline: true },
      { name: "🛠️", value: `Node ${process.version} · djs ${djsVersion}`, inline: false }
    );
  await reply.edit({ content: " ", embeds: [embed] });
}

async function handleHibernate(supabase, interaction) {
  const sub = interaction.options.getSubcommand();
  const { data: server } = await supabase
    .from("discord_servers")
    .select("*")
    .eq("guild_id", interaction.guildId)
    .maybeSingle();
  if (!server) {
    return interaction.reply({ content: "Server not registered yet.", ephemeral: true });
  }

  if (sub === "status") {
    const { data: targets } = await supabase
      .from("hibernation_targets")
      .select("state")
      .eq("server_id", server.id);
    const counts = { awake: 0, light: 0, deep: 0, frozen: 0 };
    for (const t of targets || []) counts[t.state]++;
    const embed = new EmbedBuilder()
      .setColor(0x4f46e5)
      .setTitle("🌙 Hibernation Portal Status")
      .setDescription(`Engine: ${server.hibernation_enabled ? "✅ enabled" : "⛔ disabled"}`)
      .addFields(
        { name: "☀️ Awake", value: String(counts.awake), inline: true },
        { name: "💠 Light", value: String(counts.light), inline: true },
        { name: "🌙 Deep", value: String(counts.deep), inline: true },
        { name: "❄️ Frozen", value: String(counts.frozen), inline: true }
      );
    return interaction.reply({ embeds: [embed] });
  }

  if (sub === "toggle") {
    const enabled = interaction.options.getBoolean("enabled", true);
    await supabase
      .from("discord_servers")
      .update({ hibernation_enabled: enabled })
      .eq("id", server.id);
    return interaction.reply({
      content: `Hibernation engine ${enabled ? "✅ enabled" : "⛔ disabled"}.`,
      ephemeral: true,
    });
  }

  if (sub === "wake") {
    await supabase
      .from("hibernation_targets")
      .update({ state: "awake", hibernation_started_at: null, last_active_at: new Date().toISOString() })
      .eq("server_id", server.id)
      .neq("state", "awake");
    return interaction.reply({ content: "☀️ Woke all hibernating targets.", ephemeral: true });
  }
}

async function handleLink(supabase, interaction) {
  const code = interaction.options.getString("code", true);
  return claimLinkCode(supabase, interaction, code);
}

async function claimLinkCode(supabase, ctx, code) {
  const isInteraction = typeof ctx.reply === "function" && "user" in ctx;
  const user = isInteraction ? ctx.user : ctx.author;
  const replyOpts = isInteraction ? { ephemeral: true } : {};

  const normalized = code.trim().toUpperCase();
  const { data: link } = await supabase
    .from("discord_links")
    .select("*")
    .eq("verification_code", normalized)
    .eq("verified", false)
    .maybeSingle();

  if (!link) {
    return ctx.reply({ content: "❌ Invalid or expired code. Generate a new one in the dashboard.", ...replyOpts });
  }

  await supabase
    .from("discord_links")
    .update({
      discord_user_id: user.id,
      discord_username: user.username,
      verified: true,
      verification_code: null,
    })
    .eq("id", link.id);

  return ctx.reply({ content: `🔗 Linked **${user.username}** to your dashboard account.`, ...replyOpts });
}

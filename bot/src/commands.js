import {
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  version as djsVersion,
} from "discord.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8"));

export const PREFIX = process.env.COMMAND_PREFIX || "h!";
const BOT_VERSION = pkg.version || "1.0.0";
const LAST_UPDATE = process.env.BOT_LAST_UPDATE || new Date().toISOString().slice(0, 10);
const BRAND = 0x4f46e5;

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "";
const DASHBOARD_URL = (process.env.DASHBOARD_URL || "").replace(/\/$/, "");

const BOT_INVITE_URL = DISCORD_CLIENT_ID
  ? `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&scope=bot+applications.commands&permissions=397284557824`
  : "https://discord.com/oauth2/authorize";

// ─── Slash commands ────────────────────────────────────────────────────────
const slash = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Bot latency, shard, cluster, language, version"),
  new SlashCommandBuilder()
    .setName("link")
    .setDescription("Link your Discord account to the Hibernation Portal dashboard"),
].map((c) => c.toJSON());

export async function registerSlashCommands(client) {
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  const appId = client.user.id;
  const guildId = process.env.GUILD_ID;
  try {
    const g = await rest.put(Routes.applicationCommands(appId), { body: slash });
    console.log(`✓ registered ${g.length} GLOBAL slash command(s)`);
    if (guildId) {
      const r = await rest.put(Routes.applicationGuildCommands(appId, guildId), { body: slash });
      console.log(`✓ registered ${r.length} GUILD command(s) → ${guildId}`);
    }
  } catch (e) {
    console.error("registerSlash failed:", e?.rawError || e?.message || e);
  }
}

export async function handleSlash(supabase, client, interaction) {
  if (interaction.commandName === "ping") return slashPing(client, interaction);
  if (interaction.commandName === "link") return handleLink(supabase, interaction.guild, interaction.user, {
    reply: (opts) => interaction.reply({ ...opts, ephemeral: true }),
  });
}

// ─── Prefix dispatcher ─────────────────────────────────────────────────────
export async function handlePrefix(supabase, client, message) {
  if (!message.content.startsWith(PREFIX)) return false;
  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const cmd = args.shift()?.toLowerCase();
  if (!cmd) return false;

  switch (cmd) {
    case "help":      await prefixHelp(message); return true;
    case "ping":      await prefixPing(client, message); return true;
    case "hibernate": await prefixHibernate(supabase, message, args); return true;
    case "link":      await handleLink(supabase, message.guild, message.author, {
      reply: (opts) => message.reply(opts),
    }); return true;
    default: return false;
  }
}

// ─── Shared link flow ──────────────────────────────────────────────────────
async function handleLink(supabase, guild, user, ctx) {
  if (!guild) {
    return ctx.reply({ content: "❌ This command can only be used inside a server." });
  }

  const isOwner = guild.ownerId === user.id;

  if (!isOwner) {
    const embed = new EmbedBuilder()
      .setColor(0xef4444)
      .setTitle("❌ Server owner only")
      .setDescription(
        "Only the **server owner** can link their account to the Hibernation Portal dashboard.\n\n" +
        "If you want to use Hibernation Portal on your own server, add the bot below."
      )
      .setFooter({ text: "Hibernation Portal · idle, beautifully" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Add Bot to Your Server")
        .setStyle(ButtonStyle.Link)
        .setURL(BOT_INVITE_URL)
        .setEmoji("🤖")
    );

    return ctx.reply({ embeds: [embed], components: [row] });
  }

  // User is the guild owner — generate a link token
  if (!DASHBOARD_URL) {
    return ctx.reply({ content: "❌ Bot is missing `DASHBOARD_URL` configuration. Contact the bot owner." });
  }

  const token = await createLinkToken(supabase, user.id, user.username);
  if (!token) {
    return ctx.reply({ content: "❌ Failed to generate a link token. Please try again in a moment." });
  }

  const linkUrl = `${DASHBOARD_URL}/dashboard/linking?token=${token}`;

  const embed = new EmbedBuilder()
    .setColor(BRAND)
    .setTitle("🔗 Link your account")
    .setDescription(
      "Click the button below to open the Hibernation Portal dashboard and link your Discord identity.\n\n" +
      "The link is **one-time use** and expires in **10 minutes**."
    )
    .addFields(
      { name: "👤 Discord", value: `@${user.username}`, inline: true },
      { name: "🌐 Server", value: guild.name, inline: true }
    )
    .setFooter({ text: "Hibernation Portal · expires in 10 minutes" })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Authorize with Hibernation Portal")
      .setStyle(ButtonStyle.Link)
      .setURL(linkUrl)
      .setEmoji("🌙")
  );

  return ctx.reply({ embeds: [embed], components: [row] });
}

// ─── Token generation ──────────────────────────────────────────────────────
function genToken() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let t = "HIB-";
  for (let i = 0; i < 8; i++) t += chars[Math.floor(Math.random() * chars.length)];
  return t;
}

async function createLinkToken(supabase, discordUserId, discordUsername) {
  const token = genToken();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("discord_links")
    .upsert(
      {
        discord_user_id: discordUserId,
        discord_username: discordUsername,
        verification_code: token,
        expires_at: expiresAt,
        verified: false,
        clerk_user_id: null,
        linked_at: null,
      },
      { onConflict: "discord_user_id" }
    );

  if (error) {
    console.error("createLinkToken:", error.message);
    return null;
  }
  return token;
}

// ─── /ping ─────────────────────────────────────────────────────────────────
async function slashPing(client, interaction) {
  const sent = Date.now();
  await interaction.deferReply();
  const rt = Date.now() - sent;
  const ws = Math.round(client.ws.ping);
  const shard = interaction.guild?.shardId ?? 0;
  const totalShards = client.ws.shards.size;
  const cluster = process.env.CLUSTER_ID || "0";
  const guilds = client.guilds.cache.size;
  const users = client.guilds.cache.reduce((a, g) => a + (g.memberCount || 0), 0);
  const up = Math.floor((client.uptime || 0) / 1000);
  const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);

  const embed = new EmbedBuilder()
    .setColor(BRAND)
    .setTitle("🛰️ Hibernation Portal · Ping")
    .addFields(
      { name: "📡 WebSocket", value: `${ws} ms`, inline: true },
      { name: "🔁 Round-trip", value: `${rt} ms`, inline: true },
      { name: "💾 Memory", value: `${mem} MB`, inline: true },
      { name: "🧩 Shard", value: `${shard} / ${totalShards}`, inline: true },
      { name: "🗂️ Cluster", value: `#${cluster}`, inline: true },
      { name: "🌐 Servers", value: `${guilds.toLocaleString()}`, inline: true },
      { name: "👥 Users", value: `${users.toLocaleString()}`, inline: true },
      { name: "⏱️ Uptime", value: fmtUptime(up), inline: true },
      { name: "🛠️ Language", value: `Node.js ${process.version} · discord.js ${djsVersion}`, inline: false },
      { name: "🚀 Version", value: `\`v${BOT_VERSION}\` · last update \`${LAST_UPDATE}\``, inline: false }
    )
    .setFooter({ text: "Hibernation Portal · live telemetry" })
    .setTimestamp();
  await interaction.editReply({ embeds: [embed] });
}

// ─── h!help ────────────────────────────────────────────────────────────────
async function prefixHelp(message) {
  const embed = new EmbedBuilder()
    .setColor(BRAND)
    .setTitle("🌙 Hibernation Portal · Commands")
    .setDescription(`Prefix: \`${PREFIX}\` · Slash: \`/\``)
    .addFields(
      {
        name: "Slash",
        value: [
          "`/ping` — latency, shard, cluster, language, version",
          "`/link` — link your Discord account to the dashboard",
        ].join("\n"),
      },
      {
        name: "General",
        value: [
          `\`${PREFIX}help\` — show this menu`,
          `\`${PREFIX}ping\` — quick latency check`,
          `\`${PREFIX}link\` — link your account to the dashboard`,
        ].join("\n"),
      },
      {
        name: "Hibernation",
        value: [
          `\`${PREFIX}hibernate status\` — current sleep counts`,
          `\`${PREFIX}hibernate toggle on|off\` — master switch *(Manage Guild)*`,
          `\`${PREFIX}hibernate wake\` — wake every target *(Manage Guild)*`,
        ].join("\n"),
      }
    )
    .setFooter({ text: "Hibernation Portal · idle, beautifully" });
  await message.reply({ embeds: [embed] });
}

// ─── h!ping ────────────────────────────────────────────────────────────────
async function prefixPing(client, message) {
  const sent = Date.now();
  const reply = await message.reply({ content: "🏓 Pinging…" });
  const rt = Date.now() - sent;
  const embed = new EmbedBuilder()
    .setColor(BRAND)
    .setTitle("🛰️ Pong")
    .addFields(
      { name: "📡 WS", value: `${Math.round(client.ws.ping)} ms`, inline: true },
      { name: "🔁 RT", value: `${rt} ms`, inline: true },
      { name: "🧩 Shard", value: `${message.guild?.shardId ?? 0}/${client.ws.shards.size}`, inline: true },
      { name: "🌐 Servers", value: `${client.guilds.cache.size}`, inline: true },
      { name: "🛠️", value: `Node ${process.version} · djs ${djsVersion}`, inline: false }
    );
  await reply.edit({ content: " ", embeds: [embed] });
}

// ─── h!hibernate ───────────────────────────────────────────────────────────
async function prefixHibernate(supabase, message, args) {
  const sub = args[0]?.toLowerCase();
  const { data: server } = await supabase
    .from("discord_servers").select("*").eq("guild_id", message.guildId).maybeSingle();
  if (!server) return message.reply({ content: "Server not registered yet." });

  if (sub === "status") {
    const { data: targets } = await supabase
      .from("hibernation_targets").select("state").eq("server_id", server.id);
    const c = { awake: 0, light: 0, deep: 0, frozen: 0 };
    for (const t of targets || []) c[t.state]++;
    const embed = new EmbedBuilder()
      .setColor(BRAND)
      .setTitle("🌙 Hibernation Status")
      .setDescription(`Engine: ${server.hibernation_enabled ? "✅ enabled" : "⛔ disabled"}`)
      .addFields(
        { name: "☀️ Awake", value: `${c.awake}`, inline: true },
        { name: "💠 Light", value: `${c.light}`, inline: true },
        { name: "🌙 Deep", value: `${c.deep}`, inline: true },
        { name: "❄️ Frozen", value: `${c.frozen}`, inline: true }
      );
    return message.reply({ embeds: [embed] });
  }

  if (sub === "toggle") {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild))
      return message.reply({ content: "❌ Manage Guild required." });
    if (!args[1]) return message.reply({ content: `Usage: \`${PREFIX}hibernate toggle <on|off>\`` });
    const enabled = ["on", "true", "1"].includes(args[1].toLowerCase());
    await supabase.from("discord_servers").update({ hibernation_enabled: enabled }).eq("id", server.id);
    return message.reply({ content: `Hibernation ${enabled ? "✅ enabled" : "⛔ disabled"}.` });
  }

  if (sub === "wake") {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild))
      return message.reply({ content: "❌ Manage Guild required." });
    await supabase
      .from("hibernation_targets")
      .update({ state: "awake", hibernation_started_at: null, last_active_at: new Date().toISOString() })
      .eq("server_id", server.id).neq("state", "awake");
    return message.reply({ content: "☀️ Woke all hibernating targets." });
  }

  return message.reply({ content: `Usage: \`${PREFIX}hibernate <status|toggle|wake>\`` });
}

function fmtUptime(s) {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d) return `${d}d ${h}h ${m}m`;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${sec}s`;
  return `${sec}s`;
}

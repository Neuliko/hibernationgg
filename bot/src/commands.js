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

export const PREFIX = process.env.COMMAND_PREFIX || "h!";
const BOT_VERSION = pkg.version || "1.0.0";
const LAST_UPDATE = process.env.BOT_LAST_UPDATE || new Date().toISOString().slice(0, 10);
const BRAND = 0x4f46e5;

// ─── Slash commands ────────────────────────────────────────────────────────
const slash = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Bot latency, shard, cluster, language, version"),
  new SlashCommandBuilder()
    .setName("link")
    .setDescription("Link your Discord account to the Hibernation Portal dashboard")
    .addStringOption((opt) =>
      opt.setName("code").setDescription("Verification code from the dashboard (e.g. HIB-ABC123)").setRequired(true)
    ),
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
  if (interaction.commandName === "link") return slashLink(supabase, interaction);
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
    case "link":      await prefixLink(supabase, message, args); return true;
    default:          return false;
  }
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

// ─── /link ─────────────────────────────────────────────────────────────────
async function slashLink(supabase, interaction) {
  await interaction.deferReply({ ephemeral: true });
  const raw = interaction.options.getString("code", true);
  const result = await claimLinkCode(supabase, raw, interaction.user.id, interaction.user.username);
  const embed = buildLinkEmbed(result, interaction.user.username);
  await interaction.editReply({ embeds: [embed] });
}

// ─── h!link ────────────────────────────────────────────────────────────────
async function prefixLink(supabase, message, args) {
  const raw = args[0];
  if (!raw) {
    return message.reply({
      content: `Usage: \`${PREFIX}link <CODE>\`\nGet your code from the dashboard → **Discord Link**.`,
    });
  }
  const result = await claimLinkCode(supabase, raw, message.author.id, message.author.username);
  const embed = buildLinkEmbed(result, message.author.username);
  return message.reply({ embeds: [embed] });
}

// ─── Shared linking logic ──────────────────────────────────────────────────
async function claimLinkCode(supabase, rawCode, discordUserId, discordUsername) {
  const code = normalizeCode(rawCode);

  const { data: row, error: fetchErr } = await supabase
    .from("discord_links")
    .select("*")
    .eq("verification_code", code)
    .maybeSingle();

  if (fetchErr) return { ok: false, reason: "db_error", detail: fetchErr.message };
  if (!row) return { ok: false, reason: "not_found", code };
  if (row.verified) return { ok: false, reason: "already_used", code };
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: "expired", code };
  }

  const { error: updateErr } = await supabase
    .from("discord_links")
    .update({
      verified: true,
      verification_code: null,
      expires_at: null,
      discord_user_id: discordUserId,
      discord_username: discordUsername,
      linked_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  if (updateErr) return { ok: false, reason: "db_error", detail: updateErr.message };
  return { ok: true, username: discordUsername };
}

function normalizeCode(raw) {
  const cleaned = raw.replace(/[\s-]/g, "").toUpperCase();
  return cleaned.startsWith("HIB") ? `HIB-${cleaned.slice(3)}` : `HIB-${cleaned}`;
}

function buildLinkEmbed(result, username) {
  if (result.ok) {
    return new EmbedBuilder()
      .setColor(0x22c55e)
      .setTitle("🔗 Account linked")
      .setDescription(`**@${username}** is now connected to your Hibernation Portal dashboard.`)
      .setFooter({ text: "Hibernation Portal · you're all set" });
  }

  const reasons = {
    not_found: `Code \`${result.code}\` not found. Generate a fresh one from **Dashboard → Discord Link**.`,
    already_used: `Code \`${result.code}\` has already been used. Generate a new one from the dashboard.`,
    expired: `Code \`${result.code}\` expired (codes last 10 minutes). Generate a fresh one from the dashboard.`,
    db_error: `Database error: ${result.detail || "unknown"}. Please try again.`,
  };

  return new EmbedBuilder()
    .setColor(0xef4444)
    .setTitle("❌ Linking failed")
    .setDescription(reasons[result.reason] || "Something went wrong. Please try again.")
    .setFooter({ text: "Hibernation Portal · dashboard.hibernationportal.app" });
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
          "`/link CODE` — link your Discord to the dashboard",
        ].join("\n"),
      },
      {
        name: "General",
        value: [
          `\`${PREFIX}help\` — show this menu`,
          `\`${PREFIX}ping\` — quick latency check`,
        ].join("\n"),
      },
      {
        name: "Hibernation",
        value: [
          `\`${PREFIX}hibernate status\` — current sleep counts`,
          `\`${PREFIX}hibernate toggle on|off\` — master switch *(Manage Guild)*`,
          `\`${PREFIX}hibernate wake\` — wake every target *(Manage Guild)*`,
        ].join("\n"),
      },
      {
        name: "Account",
        value: `\`${PREFIX}link CODE\` — link your Discord to the dashboard`,
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

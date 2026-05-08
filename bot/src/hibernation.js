import { EmbedBuilder } from "discord.js";

const SLEEP_EMOJIS = ["💤", "🌙", "❄️", "💠", "☀️"];

const stripSleepEmojis = (name = "") => {
  let n = name;
  for (const e of SLEEP_EMOJIS) {
    n = n.split(e).join("");
  }
  return n.trim();
};

const stateEmoji = (state) =>
  ({ light: "💠", deep: "🌙", frozen: "❄️", awake: "☀️" }[state] || "");

const stateLabel = (state) =>
  ({ light: "Light Sleep", deep: "Deep Sleep", frozen: "Frozen", awake: "Awake" }[state]);

export async function ensureServer(supabase, guild) {
  const { data: existing } = await supabase
    .from("discord_servers")
    .select("id")
    .eq("guild_id", guild.id)
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("discord_servers")
    .insert({ guild_id: guild.id, name: guild.name })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function getServer(supabase, guild) {
  const { data } = await supabase
    .from("discord_servers")
    .select("*")
    .eq("guild_id", guild.id)
    .maybeSingle();
  return data;
}

async function upsertTarget(supabase, server, kind, targetId, displayName) {
  const { data, error } = await supabase
    .from("hibernation_targets")
    .upsert(
      {
        server_id: server.id,
        guild_id: server.guild_id,
        kind,
        target_id: targetId,
        display_name: displayName,
        last_active_at: new Date().toISOString(),
      },
      { onConflict: "server_id,kind,target_id" }
    )
    .select("*")
    .single();
  if (error) console.error("upsertTarget", error);
  return data;
}

export async function recordActivity(supabase, guild, { channelId, userId, username }) {
  const server = await getServer(supabase, guild);
  if (!server) return;

  if (channelId) {
    const ch = guild.channels.cache.get(channelId);
    await upsertTarget(supabase, server, "channel", channelId, ch?.name || channelId);
  }
  if (userId) {
    await upsertTarget(supabase, server, "user", userId, username || userId);
  }
}

async function logEvent(supabase, server, target, type, fromState, toState, trigger, durationSec) {
  await supabase.from("hibernation_events").insert({
    server_id: server.id,
    target_id: target?.id,
    type,
    from_state: fromState,
    to_state: toState,
    trigger,
    duration_seconds: durationSec,
  });
}

export async function scanAndHibernate(supabase, client, guild) {
  const server = await getServer(supabase, guild);
  if (!server || !server.hibernation_enabled) return;

  const now = Date.now();
  const { data: targets } = await supabase
    .from("hibernation_targets")
    .select("*")
    .eq("server_id", server.id);

  for (const t of targets || []) {
    const idleMin = (now - new Date(t.last_active_at).getTime()) / 60000;
    let nextState = t.state;
    if (idleMin >= server.frozen_minutes) nextState = "frozen";
    else if (idleMin >= server.deep_sleep_minutes) nextState = "deep";
    else if (idleMin >= server.light_sleep_minutes) nextState = "light";
    else nextState = "awake";

    if (nextState === t.state) continue;

    const wasAwake = t.state === "awake";
    const startedAt = wasAwake ? new Date().toISOString() : t.hibernation_started_at;

    await supabase
      .from("hibernation_targets")
      .update({
        state: nextState,
        hibernation_started_at: nextState === "awake" ? null : startedAt,
      })
      .eq("id", t.id);

    await logEvent(
      supabase,
      server,
      t,
      wasAwake ? "hibernate" : "state_change",
      t.state,
      nextState,
      `idle ${Math.round(idleMin)}m`
    );

    // Side effects
    if (t.kind === "user" && server.nickname_automation && nextState !== "awake") {
      await applyNickname(client, guild, t, nextState);
    }
    if (t.kind === "channel" && wasAwake) {
      await postHibernateEmbed(client, guild, t, nextState, startedAt);
    }
  }
}

export async function wakeTarget(supabase, client, guild, kind, targetId, trigger) {
  const server = await getServer(supabase, guild);
  if (!server) return;

  const { data: t } = await supabase
    .from("hibernation_targets")
    .select("*")
    .eq("server_id", server.id)
    .eq("kind", kind)
    .eq("target_id", targetId)
    .maybeSingle();
  if (!t || t.state === "awake") return;

  const startedAt = t.hibernation_started_at ? new Date(t.hibernation_started_at).getTime() : Date.now();
  const durationSec = Math.round((Date.now() - startedAt) / 1000);

  await supabase
    .from("hibernation_targets")
    .update({
      state: "awake",
      hibernation_started_at: null,
      last_active_at: new Date().toISOString(),
    })
    .eq("id", t.id);

  await logEvent(supabase, server, t, "wake", t.state, "awake", trigger, durationSec);

  if (t.kind === "user" && server.nickname_automation) {
    await restoreNickname(client, guild, t);
  }
  if (t.kind === "channel") {
    await postWakeEmbed(client, guild, t, durationSec, trigger);
  }
}

export async function applyNickname(client, guild, target, state) {
  try {
    const member = await guild.members.fetch(target.target_id);
    if (!member.manageable) return;
    const original = target.original_nickname || member.nickname || member.user.username;
    const cleanBase = stripSleepEmojis(original);
    const tag = stateEmoji(state);
    const next = `${tag} ${cleanBase}`.slice(0, 32);
    if (member.nickname !== next) {
      await member.setNickname(next, "Hibernation Portal state change");
    }
    if (!target.original_nickname) {
      // Save original via service-role client; need supabase here — re-fetch in caller
    }
  } catch (e) {
    // Ignore: missing perms or unknown member
  }
}

export async function restoreNickname(client, guild, target) {
  try {
    const member = await guild.members.fetch(target.target_id);
    if (!member.manageable) return;
    const original = target.original_nickname
      ? target.original_nickname
      : stripSleepEmojis(member.nickname || "");
    await member.setNickname(original || null, "Hibernation Portal wake");
  } catch (e) {}
}

async function postHibernateEmbed(client, guild, target, state, startedAt) {
  try {
    const channel = await guild.channels.fetch(target.target_id);
    if (!channel?.isTextBased()) return;
    const unix = Math.floor(new Date(startedAt).getTime() / 1000);
    const embed = new EmbedBuilder()
      .setColor(0xa855f7)
      .setTitle("🌙 Hibernation Active")
      .addFields(
        { name: "💤 Status", value: "Sleeping", inline: true },
        { name: "❄️ Level", value: `${stateEmoji(state)} ${stateLabel(state)}`, inline: true },
        { name: "🕒 Started", value: `<t:${unix}:F>`, inline: false },
        { name: "⏳ Duration", value: `<t:${unix}:R>`, inline: false }
      )
      .setFooter({ text: "Hibernation Portal · idle, beautifully" });
    await channel.send({ embeds: [embed] }).catch(() => {});
  } catch (e) {}
}

async function postWakeEmbed(client, guild, target, durationSec, trigger) {
  try {
    const channel = await guild.channels.fetch(target.target_id);
    if (!channel?.isTextBased()) return;
    const wakeUnix = Math.floor(Date.now() / 1000);
    const embed = new EmbedBuilder()
      .setColor(0x60a5fa)
      .setTitle("☀️ Awake")
      .addFields(
        { name: "💤 Slept for", value: humanDuration(durationSec), inline: true },
        { name: "🕒 Wake time", value: `<t:${wakeUnix}:F>`, inline: true },
        { name: "⚡ Trigger", value: trigger, inline: false }
      )
      .setFooter({ text: "Hibernation Portal · welcome back" });
    await channel.send({ embeds: [embed] }).catch(() => {});
  } catch (e) {}
}

function humanDuration(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}

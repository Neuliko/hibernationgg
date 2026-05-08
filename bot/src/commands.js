import {
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";

const commands = [
  new SlashCommandBuilder()
    .setName("hibernate")
    .setDescription("Hibernation Portal — system status and controls")
    .addSubcommand((s) => s.setName("status").setDescription("Show server hibernation status"))
    .addSubcommand((s) => s.setName("wake").setDescription("Wake all hibernating targets in this server"))
    .addSubcommand((s) =>
      s
        .setName("toggle")
        .setDescription("Enable or disable the hibernation engine")
        .addBooleanOption((o) => o.setName("enabled").setDescription("On / off").setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName("link")
    .setDescription("Link your Discord account to your dashboard account")
    .addStringOption((o) =>
      o.setName("code").setDescription("Verification code from the dashboard").setRequired(true)
    ),
].map((c) => c.toJSON());

export async function registerCommands(client) {
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  const appId = client.user.id;
  const guildId = process.env.GUILD_ID;
  try {
    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(appId, guildId), { body: commands });
      console.log(`✓ registered ${commands.length} guild commands → ${guildId}`);
    } else {
      await rest.put(Routes.applicationCommands(appId), { body: commands });
      console.log(`✓ registered ${commands.length} global commands`);
    }
  } catch (e) {
    console.error("registerCommands failed:", e.message);
  }
}

export async function handleSlashCommand(supabase, client, interaction) {
  const { commandName } = interaction;
  if (commandName === "hibernate") return handleHibernate(supabase, interaction);
  if (commandName === "link") return handleLink(supabase, interaction);
}

export async function handlePrefixCommand(supabase, client, message) {
  const PREFIX = process.env.COMMAND_PREFIX || "!";
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase();

  if (command === "hibernate") {
    const subcommand = args[0]?.toLowerCase();
    const { data: server } = await supabase
      .from("discord_servers")
      .select("*")
      .eq("guild_id", message.guildId)
      .maybeSingle();

    if (!server) {
      return message.reply({ content: "Server not registered yet.", ephemeral: true });
    }

    if (subcommand === "status") {
      const { data: targets } = await supabase
        .from("hibernation_targets")
        .select("state")
        .eq("server_id", server.id);
      const counts = { awake: 0, light: 0, deep: 0, frozen: 0 };
      for (const t of targets || []) counts[t.state]++;
      const embed = new EmbedBuilder()
        .setColor(0xa855f7)
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
      const enabled = args[1]?.toLowerCase() === "on" || args[1] === "true";
      if (!args[1]) {
        return message.reply({
          content: "Usage: `!hibernate toggle <on|off>`",
          ephemeral: true,
        });
      }
      await supabase
        .from("discord_servers")
        .update({ hibernation_enabled: enabled })
        .eq("id", server.id);
      return message.reply({
        content: `Hibernation engine ${enabled ? "✅ enabled" : "⛔ disabled"}.`,
      });
    }

    if (subcommand === "wake") {
      if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return message.reply({
          content: "❌ You need Manage Guild permissions to use this command.",
        });
      }
      await supabase
        .from("hibernation_targets")
        .update({ state: "awake", hibernation_started_at: null, last_active_at: new Date().toISOString() })
        .eq("server_id", server.id)
        .neq("state", "awake");
      return message.reply({ content: "☀️ Woke all hibernating targets." });
    }

    if (!subcommand) {
      return message.reply({
        content: "Usage: `!hibernate <status|toggle|wake>`",
      });
    }
  }

  if (command === "link") {
    const code = args[0];
    if (!code) {
      return message.reply({
        content: "Usage: `!link <verification-code>`",
      });
    }

    const { data: link } = await supabase
      .from("discord_links")
      .select("*")
      .eq("verification_code", code)
      .eq("verified", false)
      .maybeSingle();

    if (!link) {
      return message.reply({
        content: "❌ Invalid or expired code. Generate a new one in the dashboard.",
      });
    }

    await supabase
      .from("discord_links")
      .update({
        discord_user_id: message.author.id,
        discord_username: message.author.username,
        verified: true,
        verification_code: null,
      })
      .eq("id", link.id);

    return message.reply({
      content: `🔗 Linked **${message.author.username}** to your dashboard account.`,
    });
  }
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
      .setColor(0xa855f7)
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
  const { data: link } = await supabase
    .from("discord_links")
    .select("*")
    .eq("verification_code", code)
    .eq("verified", false)
    .maybeSingle();

  if (!link) {
    return interaction.reply({
      content: "❌ Invalid or expired code. Generate a new one in the dashboard.",
      ephemeral: true,
    });
  }

  await supabase
    .from("discord_links")
    .update({
      discord_user_id: interaction.user.id,
      discord_username: interaction.user.username,
      verified: true,
      verification_code: null,
    })
    .eq("id", link.id);

  return interaction.reply({
    content: `🔗 Linked **${interaction.user.username}** to your dashboard account.`,
    ephemeral: true,
  });
}

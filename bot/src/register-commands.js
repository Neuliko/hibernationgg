// Standalone command-registration script.
// Run after `npm install` to force-refresh slash commands without booting the gateway.
//   node src/register-commands.js
import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { registerCommands } from "./commands.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once("ready", async (c) => {
  console.log(`Connected as ${c.user.tag}`);
  await registerCommands(c);
  await client.destroy();
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);

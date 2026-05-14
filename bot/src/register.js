// Standalone slash-command refresh: `npm run register`
import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { registerSlashCommands } from "./commands.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once("ready", async (c) => {
  console.log(`Connected as ${c.user.tag}`);
  await registerSlashCommands(c);
  await client.destroy();
  process.exit(0);
});
client.login(process.env.DISCORD_TOKEN);

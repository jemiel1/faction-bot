require('dotenv').config();

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('./src/utils/logger');

const commands = [];
const commandsPath = path.join(__dirname, 'src', 'commands');

function loadCommands(dir) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

  for (const file of files) {
    const command = require(path.join(dir, file));
    if (command.data) {
      commands.push(command.data.toJSON());
    }
  }

  const subdirs = fs.readdirSync(dir).filter(f => {
    const fullPath = path.join(dir, f);
    return fs.statSync(fullPath).isDirectory();
  });

  for (const subdir of subdirs) {
    loadCommands(path.join(dir, subdir));
  }
}

loadCommands(commandsPath);

if (commands.length === 0) {
  logger.warn('No commands found');
  process.exit(1);
}

logger.info(`Deploying ${commands.length} commands...`);

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    logger.success(`Successfully deployed ${commands.length} slash commands`);
  } catch (error) {
    logger.error('Failed to deploy commands:', error);
    process.exit(1);
  }
})();
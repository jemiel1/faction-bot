const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

module.exports = (client) => {
  const commandsPath = path.join(__dirname, '../commands');
  client.commands = new Map();

  const loadCommands = (dir) => {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

    for (const file of files) {
      const filePath = path.join(dir, file);
      const command = require(filePath);

      if (!command.data?.name) {
        logger.warn(`Skipping ${file} - missing data.name`);
        continue;
      }

      client.commands.set(command.data.name, command);
      logger.info(`Loaded command: ${command.data.name}`);
    }

    const subdirs = fs.readdirSync(dir).filter(f => {
      const fullPath = path.join(dir, f);
      return fs.statSync(fullPath).isDirectory();
    });

    for (const subdir of subdirs) {
      loadCommands(path.join(dir, subdir));
    }
  };

  loadCommands(commandsPath);
  logger.success(`Loaded ${client.commands.size} commands total`);
};
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

module.exports = (client) => {
  const eventsPath = path.join(__dirname, '../events');
  const files = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

  for (const file of files) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if (!event.name) {
      logger.warn(`Skipping ${file} - missing event.name`);
      continue;
    }

    const method = event.once ? 'once' : 'on';
    client[method](event.name, (...args) => event.execute(...args, client));
    logger.info(`Loaded event: ${event.name}`);
  }

  logger.success(`Loaded ${files.length} events total`);
};
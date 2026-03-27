const { Events } = require('discord.js');
const logger = require('../utils/logger');
const { createFactionEmbed } = require('../utils/embeds');
const { createFactionButtons } = require('../utils/buttons');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    logger.success(`Logged in as ${client.user.tag}`);

    try {
      const channel = await client.channels.fetch(process.env.CHANNEL_ID);

      if (!channel?.isTextBased()) {
        logger.error('Faction channel not found or is not text-based');
        return;
      }

      const messages = await channel.messages.fetch({ limit: 5 });
      const hasEmbed = messages.some(m => 
        m.author.id === client.user.id && m.embeds.length > 0
      );

      if (!hasEmbed) {
        await channel.send({
          embeds: [createFactionEmbed()],
          components: [createFactionButtons()]
        });
        logger.success('Faction selection embed posted');
      } else {
        logger.info('Faction embed already exists, skipping');
      }
    } catch (error) {
      logger.error('Failed to send faction embed:', error);
    }
  }
};
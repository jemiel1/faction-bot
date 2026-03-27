const logger = require('../utils/logger');

class LogService {
  constructor(client) {
    this.client = client;
  }

  async logFactionChange(guild, memberId, faction) {
    try {
      const logChannel = guild.channels.cache.get(process.env.ADMIN_LOG_CHANNEL);
      if (!logChannel) return;

      const { createFactionChangeEmbed } = require('../utils/embeds');
      await logChannel.send({
        embeds: [createFactionChangeEmbed(memberId, faction)]
      });
    } catch (error) {
      logger.error('Failed to log faction change:', error);
    }
  }

  async clearLogs(guild) {
    try {
      const logChannel = guild.channels.cache.get(process.env.ADMIN_LOG_CHANNEL);
      if (!logChannel) {
        throw new Error('Log channel not found');
      }

      const messages = await logChannel.messages.fetch({ limit: 100 });
      await logChannel.bulkDelete(messages, true);

      logger.success(`Cleared ${messages.size} log messages`);
      return messages.size;
    } catch (error) {
      logger.error('Failed to clear logs:', error);
      throw error;
    }
  }
}

module.exports = LogService;
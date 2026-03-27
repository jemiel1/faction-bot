const cron = require('node-cron');
const logger = require('../utils/logger');
const RoleService = require('./roleService');

class ScheduleService {
  constructor(client) {
    this.client = client;
    this.roleService = new RoleService(client);
  }

  start() {
    // Every Wednesday at 22:00 Polish time (20:00 UTC)
    // Cron format: minute hour day-of-week
    // 0 20 3 = 20:00 UTC on Wednesday (which is 22:00 CEST/Polish time)
    // During winter: 21:00 CET = 20:00 UTC
    // During summer: 22:00 CEST = 20:00 UTC
    
    cron.schedule('0 20 * * 3', async () => {
      logger.warn('Starting scheduled weekly role reset...');
      try {
        await this.roleService.resetAllFactions();
        logger.success('Weekly role reset completed successfully');
        await this.notifyAdmins('Weekly role reset completed');
      } catch (error) {
        logger.error('Weekly role reset failed:', error);
        await this.notifyAdmins('Weekly role reset FAILED');
      }
    });

    logger.success('Weekly schedule started (Wednesday 22:00 Polish time)');
  }

  async notifyAdmins(message) {
    try {
      const guild = this.client.guilds.cache.get(process.env.MAIN_GUILD_ID);
      if (!guild) return;

      const logChannel = guild.channels.cache.get(process.env.ADMIN_LOG_CHANNEL);
      if (!logChannel) return;

      const { EmbedBuilder } = require('discord.js');
      const embed = new EmbedBuilder()
        .setTitle('📅 Scheduled Task')
        .setDescription(message)
        .setColor(0x3498db)
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      logger.error('Failed to notify admins:', error);
    }
  }
}

module.exports = ScheduleService;
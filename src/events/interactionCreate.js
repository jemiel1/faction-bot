const { Events, PermissionsBitField } = require('discord.js');
const logger = require('../utils/logger');
const RoleService = require('../services/roleService');
const LogService = require('../services/logService');
const { ADMIN_ACTIONS } = require('../config/constants');
const securityService = require('../services/securityService');
const { createErrorEmbed, createSuccessEmbed, createAdminPanelEmbed } = require('../utils/embeds');
const { createAdminPanelButtons } = require('../utils/buttons');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    try {
      if (!interaction.guild || interaction.guild.id !== process.env.MAIN_GUILD_ID) {
        return;
      }

    if (interaction.isChatInputCommand()) {
  const command = client.commands.get(interaction.commandName);
  if (!command) {
    logger.warn(`Command ${interaction.commandName} not found`);
    return;
  }

  // FEATURE 1: Check command cooldown
  const cooldown = securityService.isCommandOnCooldown(interaction.user.id, interaction.commandName);
  if (cooldown) {
    return interaction.reply({
      embeds: [createErrorEmbed('Command Cooldown', `Please wait ${cooldown} second(s) before using this command again.`)],
      ephemeral: true
    });
  }

  try {
    await command.execute(interaction, client);
        } catch (error) {
          logger.error(`Error executing command ${interaction.commandName}:`, error);
          const reply = {
            embeds: [createErrorEmbed('Command Error', 'An error occurred while executing this command.')],
            ephemeral: true
          };

          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(reply).catch(() => {});
          } else {
            await interaction.reply(reply).catch(() => {});
          }
        }
        return;
      }

      if (interaction.isButton() && ['allies', 'axis'].includes(interaction.customId)) {
        await handleFactionButton(interaction, client);
        return;
      }

      if (interaction.isButton() && interaction.customId.startsWith('admin_')) {
        await handleAdminButton(interaction, client);
        return;
      }
    } catch (error) {
      logger.error('Interaction error:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          embeds: [createErrorEmbed('Error', 'An unexpected error occurred.')],
          ephemeral: true
        }).catch(() => {});
      }
    }
  }
};

async function handleFactionButton(interaction, client) {
  try {
    await interaction.deferUpdate();

    const roleService = new RoleService(client);
    const logService = new LogService(client);

    await roleService.assignFactionRole(interaction.member, interaction.customId);
    await logService.logFactionChange(interaction.guild, interaction.member.id, interaction.customId);

    logger.success(`${interaction.user.tag} switched to ${interaction.customId}`);
  } catch (error) {
    logger.error('Faction button error:', error);
    await interaction.followUp({
      embeds: [createErrorEmbed('Role Assignment Failed', 'Could not assign your faction role. Try again later.')],
      ephemeral: true
    }).catch(() => {});
  }
}

async function handleAdminButton(interaction, client) {
  try {
    if (!ADMIN_ACTIONS.includes(interaction.customId)) {
      return interaction.reply({
        embeds: [createErrorEmbed('Invalid Action', 'This admin action is not recognized.')],
        ephemeral: true
      });
    }

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        embeds: [createErrorEmbed('Permission Denied', 'You must be an administrator to use the admin panel.')],
        ephemeral: true
      });
    }

    if (interaction.message.interaction?.user.id !== interaction.user.id) {
      return interaction.reply({
        embeds: [createErrorEmbed('Access Denied', 'This panel belongs to another administrator.')],
        ephemeral: true
      });
    }

    const roleService = new RoleService(client);
    const logService = new LogService(client);

    if (interaction.customId === 'admin_reset') {
      await interaction.deferReply({ ephemeral: true });
      const removed = await roleService.resetAllFactions();
      return interaction.editReply({
        embeds: [createSuccessEmbed('Roles Reset', `Removed ${removed.allies} allies and ${removed.axis} axis members.`)]
      });
    }

    if (interaction.customId === 'admin_reload') {
      await interaction.deferReply({ ephemeral: true });
      const { createFactionEmbed } = require('../utils/embeds');
      const { createFactionButtons } = require('../utils/buttons');

      try {
        const channel = await client.channels.fetch(process.env.CHANNEL_ID);
        const messages = await channel.messages.fetch({ limit: 20 });
        const botMessages = messages.filter(m => m.author.id === client.user.id);

        for (const msg of botMessages.values()) {
          await msg.delete().catch(() => {});
        }

        await channel.send({
          embeds: [createFactionEmbed()],
          components: [createFactionButtons()]
        });

        return interaction.editReply({
          embeds: [createSuccessEmbed('Embed Reloaded', 'Faction selection embed has been resent.')]
        });
      } catch (error) {
        logger.error('Reload embed error:', error);
        return interaction.editReply({
          embeds: [createErrorEmbed('Reload Failed', 'Could not reload the faction embed.')]
        });
      }
    }

    if (interaction.customId === 'admin_clearlogs') {
      await interaction.deferReply({ ephemeral: true });
      try {
        const cleared = await logService.clearLogs(interaction.guild);
        return interaction.editReply({
          embeds: [createSuccessEmbed('Logs Cleared', `Deleted ${cleared} log messages.`)]
        });
      } catch (error) {
        logger.error('Clear logs error:', error);
        return interaction.editReply({
          embeds: [createErrorEmbed('Clear Failed', 'Could not clear the logs.')]
        });
      }
    }

  } catch (error) {
    logger.error('Admin button error:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        embeds: [createErrorEmbed('Error', 'An error occurred processing your request.')],
        ephemeral: true
      }).catch(() => {});
    }
  }
}
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function createFactionButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('allies')
      .setLabel('🔵 Allies')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('axis')
      .setLabel('🔴 Axis')
      .setStyle(ButtonStyle.Danger)
  );
}

function createAdminPanelButtons() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('admin_reset')
      .setLabel('🧩 Reset Roles')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('admin_reload')
      .setLabel('🔄 Reload Embed')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('admin_clearlogs')
      .setLabel('🗑️ Clear Logs')
      .setStyle(ButtonStyle.Danger)
  );

  return [row1];
}
module.exports = {
  createFactionButtons,
  createAdminPanelButtons
};
require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const logger = require('./utils/logger');
const { REQUIRED_ENV_VARS } = require('./config/constants');

// ===== VALIDATE ENV VARIABLES =====
for (const envVar of REQUIRED_ENV_VARS) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

logger.success('All required environment variables found');

// ===== CREATE CLIENT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

// ===== LOAD HANDLERS =====
require('./handlers/commandHandler')(client);
require('./handlers/eventHandler')(client);

// ===== LOAD SCHEDULE SERVICE =====
const ScheduleService = require('./services/scheduleService');

// ===== GLOBAL ERROR HANDLERS =====
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// ===== START SCHEDULE WHEN READY =====
client.once('ready', () => {
  const scheduleService = new ScheduleService(client);
  scheduleService.start();
});

// ===== LOGIN =====
client.login(process.env.TOKEN);
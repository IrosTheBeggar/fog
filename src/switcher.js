const Joi = require('@hapi/joi');
const path = require('path');
const ddns = require('./ddns')
const logger = require('./logger');
logger.init();
const winston = require('winston');

exports.boot = function (config) {
  // Handle DDNS Here

  if (!config.serverConfig) {
    config.serverConfig = {}
  }

  const bitwardenJoi = Joi.object({
    directory: Joi.string().default(path.join(__dirname, '../servers/bitwarden')),
    adminToken: Joi.string().allow(''),
    signUpEnabled: Joi.boolean().default(true)
  });

  const fileServerJoi = Joi.object({
    directory: Joi.string().default(path.join(__dirname, '../servers/file-server/examples/blog'))
  });

  const minecraftBedrockJoi = Joi.object({
    directory: Joi.string().default(path.join(__dirname, '../servers/minecraft-bedrock'))
  });

  const minecraftJavaJoi = Joi.object({
    directory: Joi.string().default(path.join(__dirname, '../servers/minecraft-java')),
    serverMessage: Joi.string().allow('').max(59).default('Created With Fog Machine'),
    gameMode: Joi.string().valid('survival', 'creative', 'adventure', 'spectator').default('adventure'),
    difficulty: Joi.string().valid('peaceful', 'easy', 'normal', 'hard').default('easy'),
    pvp: Joi.boolean().default(true),
    flightMods: Joi.boolean().default(false),
    commandBlocks: Joi.boolean().default(false),
    hardcoreMode: Joi.boolean().default(false),
    sendStats: Joi.boolean().default(false),
    viewDistance: Joi.number().integer().max(32).min(4).default(10),
    maxPlayers: Joi.number().integer().min(2).default(20)
  });

  const terrariaJoi = Joi.object({
    directory: Joi.string().default(path.join(__dirname, '../servers/terraria'))
  });

  const schema = Joi.object({
    autoboot: Joi.boolean().optional(),
    port: Joi.number().port().default(5555),
    ddns: Joi.object({
      iniFile: Joi.string().default(path.join(__dirname, `../frp/frps.ini`)),
      email: Joi.string().allow('').optional(),
      password: Joi.string().allow('').optional(),
      tested: Joi.boolean().optional(),
      token: Joi.string().optional(),
      url: Joi.string().optional()
    }),
    server: Joi.string().valid('minecraft-bedrock', 'minecraft-java', 'bitwarden', 'file').required(),
    serverConfig: Joi.object({
      fileServer: fileServerJoi.default(fileServerJoi.validate({}).value),
      bitwarden: bitwardenJoi.default(bitwardenJoi.validate({}).value),
      minecraftBedrock: minecraftBedrockJoi.default(minecraftBedrockJoi.validate({}).value),
      minecraftJava: minecraftJavaJoi.default(minecraftJavaJoi.validate({}).value),
      terraria: terrariaJoi.default(terrariaJoi.validate({}).value),
    })
  });

  const { error, value } = schema.validate(config, { allowUnknown: true });
  if (error) {
    throw new Error(error);
  }

  const program = value;

  // Handle kills
  program.killThese = [];
  process.on('exit', (code) => {
    program.killThese.forEach(killThis => {
      try {
        if (killThis instanceof Function) { killThis(); }
      }catch (err) {
        console.log('Error: Failed to run kill function');
      }
    });
  });

  // DDNS
  ddns.setup(program);

  switch (program.server) {
    case 'file':
      require("../servers/file-server/server").boot(program);
      break;
    case 'minecraft-java':
      require("./boot/minecraft-java").boot(program);
      break;
    case 'minecraft-bedrock':
      require("./boot/minecraft-bedrock").boot(program);
      break;
    case 'bitwarden':
      require("./boot/bitwarden").boot(program);
      break;
    case 'terraria':
      require("./boot/terraria").boot(program);
      break;
    default:
      throw new Error('Unknown Server');
  } 
}
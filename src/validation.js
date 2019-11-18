const Joi = require('@hapi/joi');
const path = require('path');

const mainJoi = Joi.object({
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
});

const bitwardenJoi = Joi.object({
  directory: Joi.string().default(path.join(__dirname, '../servers/bitwarden')),
  adminToken: Joi.string().allow(''),
  signUpEnabled: Joi.boolean().default(true)
});

const fileServerJoi = Joi.object({
  directory: Joi.string().default(path.join(__dirname, '../servers/file-server/examples/blog')).required()
});

const minecraftBedrockJoi = Joi.object({
  directory: Joi.string().default(path.join(__dirname, '../servers/minecraft-bedrock')),
  gameMode: Joi.string().valid('survival', 'creative', 'adventure').default('adventure'),
  difficulty: Joi.string().valid('peaceful', 'easy', 'normal', 'hard').default('easy'),
  viewDistance: Joi.number().integer().max(32).min(4).default(10),
  verifyPlayers: Joi.boolean().default(true),
  allowCheats: Joi.boolean().default(false),
  maxPlayers: Joi.number().integer().min(1).default(20),
  tickDistance: Joi.number().integer().max(12).min(4).default(4),
  maxThreads: Joi.number().integer().min(0).default(8),
  viewDistance: Joi.number().integer().min(2).default(10)
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
  verifyPlayers: Joi.boolean().default(true),
  sendStats: Joi.boolean().default(false),
  viewDistance: Joi.number().integer().max(32).min(4).default(10),
  maxPlayers: Joi.number().integer().min(1).default(20),
  minMem: Joi.string().valid('256M', '512M', '1G', '2G', '4G', '6G','8G').default('1G'),
  minMem: Joi.string().valid('256M', '512M', '1G', '2G', '4G', '6G','8G').default('1G')
});

exports.bitwarden = () => {
  return bitwardenJoi;
}

exports.minecraftJava = () => {
 return minecraftJavaJoi;
}

exports.minecraftBedrock = () => {
  return minecraftBedrockJoi;
}

exports.fileServer = () => {
  return fileServerJoi;
}

exports.fullValidation = (config) => {
  let key;
  let joiVal;
  switch (config.server) {
    case 'file':
      key = 'fileServer';
      joiVal = this.fileServer();
      break;
    case 'minecraft-java':
      key = 'minecraftJava';
      joiVal = this.minecraftJava();
      break;
    case 'minecraft-bedrock':
      key = 'minecraftBedrock';
      joiVal = this.minecraftBedrock();
      break;
    case 'bitwarden':
      key = 'bitwarden';
      joiVal = this.bitwarden();
      break;
    default:
      throw new Error('Unknown Server');
  }

  const fullSchema = mainJoi.append({
    serverConfig: Joi.object({
      [key]: joiVal
    })
  });

  const { error, value } = fullSchema.validate(config, { allowUnknown: true });

  if (error) {
    throw new Error(error);
  }

  return value;
}
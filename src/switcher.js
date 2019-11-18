const ddns = require('./ddns');
const validation = require('./validation');
const logger = require('./logger');
logger.init();

exports.boot = function (config) {
  if (!config.serverConfig) {
    config.serverConfig = {}
  }

  let server;
  switch (config.server) {
    case 'file':
      server = require("../servers/file-server/server");
      break;
    case 'minecraft-java':
      server = require("./boot/minecraft-java");
      break;
    case 'minecraft-bedrock':
      server = require("./boot/minecraft-bedrock");
      break;
    case 'bitwarden':
      server = require("./boot/bitwarden");
      break;
    default:
      throw new Error('Unknown Server');
  }

  const program = validation.fullValidation(config);

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
  server.boot(program);
}
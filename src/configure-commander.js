const program = require('commander');
const path = require('path');

exports.setup = function (args) {
  program
    .version('0.1.0')
    // Server Config
    .option('-s, --server <server>', 'Select Server', 'file')
    .option('-p, --port <port>', 'Select Port', /^\d+$/i, 1990)
    .option('-d, --directory <directory>', 'Where The Magic Happens')

    // Basic Webserver Only
    .option('-L, --logs <logs>', 'Set folder to save logs to')

    // RPN Login
    .option('-u, --user <user>', 'Set Username')
    .option('-x, --password <password>', 'Set Password')
    .option('-c, --domain <domain>', 'Set Default Domain (only needed if you have multiple domains')

    .parse(args);  

  const program3 = { port: Number(program.port) };

  // logs
  if (program.logs) {
    program3.logs = program.logs;
  }

  // logs
  if (program.server) {
    program3.server = program.server;
  }

  // RPN
  if (program.user && program.password) {
    program3.ddns = {
      email: program.user,
      password: program.password,
      chosenDomain: program.domain,
      iniFile: path.join(__dirname, '../frp/frpc.ini')
    };
  }

  // LOL
  program3.serverConfig = { bitwarden: {}, fileServer: {}, minecraftBedrock: {}, minecraftJava: {}, terraria: {} };
  if (program.directory) {
    program3.serverConfig.bitwarden.directory = program.directory;
    program3.serverConfig.fileServer.directory = program.directory;
    program3.serverConfig.minecraftBedrock.directory = program.directory;
    program3.serverConfig.minecraftJava.directory = program.directory;
    program3.serverConfig.terraria.directory = program.directory;
  }

  return program3;
}

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

    // SSL
    .option('-c, --cert <cert>', 'SSL Certificate File')
    .option('-k, --key <key>', 'SSL Key File')

    // RPN Login
    .option('-u, --user <user>', 'Set Username')
    .option('-x, --password <password>', 'Set Password')

    .parse(args);  

  let program3 = { port: Number(program.port) };

  // SSL stuff
  if (program.key && program.cert) {
    program3.ssl = {};
    program3.ssl.key = program.key;
    program3.ssl.cert = program.cert;
  }

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
      iniFile: path.join(__dirname, '../frp/frpc.ini')
    };
  }

  // LOL
  if (program.directory) {
    program3.serverConfig = {};
    program3.serverConfig.bitwarden.directory = program.directory;
    program3.serverConfig.fileServer.directory = program.directory;
    program3.serverConfig.minecraftBedrock.directory = program.directory;
    program3.serverConfig.minecraftJava.directory = program.directory;
    program3.serverConfig.terraria.directory = program.directory;
  }

  return program3;
}
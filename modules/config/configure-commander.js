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
      iniFile: path.join(__dirname, '../../frp/frpc.ini')
    };
  }

  if (program.directory) {
    program3.directory = program.directory;
  } else {
    switch (program3.server) {
      case 'file':
        program3.directory = path.join(__dirname, '../../examples/basic');
        break;
      case 'minecraft':
        program3.directory = path.join(__dirname, '../../minecraft');
        break;
      case 'bitwarden':
        program3.directory = path.join(__dirname, '../../bitwarden');
        break;
    } 
  }

  return program3;
}

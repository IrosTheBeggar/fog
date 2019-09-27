const program = require('commander');
const path = require('path');

exports.setup = function (args) {
  program
    .version('0.1.0')
    // Server Config
    .option('-p, --port <port>', 'Select Port', /^\d+$/i, 3000)
    .option('-L, --logs <logs>', 'Set folder to save logs to')
    .option('-d, --directory <directory>', 'Set the app directory', path.join(__dirname, '../../examples/basic'))

    // SSL
    .option('-c, --cert <cert>', 'SSL Certificate File')
    .option('-k, --key <key>', 'SSL Key File')

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
  if (program.directory) {
    program3.directory = program.directory;
  }

  return program3;
}

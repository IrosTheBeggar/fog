// Sets up default values for 
const fs = require('fs');
const path = require('path');

exports.setup = function (program) {
  // if(program.ddns && !program.ddns.iniFile) {
  //   program.ddns.iniFile = path.join(__dirname, `../frp/frps.ini`);
  // }

  // Verify App Directory
  if (!program.directory || !fs.existsSync(program.directory)) {
    throw new Error('No directory set')
  }

  // Verify Logs directory
  if (program.logs && !fs.existsSync(program.logs)) {
    throw new Error('Logs directory does not exist')
  }
}
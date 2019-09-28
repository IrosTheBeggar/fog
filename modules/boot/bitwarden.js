const logger = require('../logger');
logger.init();
const winston = require('winston');
const path = require('path');
const { spawn } = require('child_process');
const fs = require("fs");
const defaults = require('../defaults');
const ddns = require('../ddns');

var spawnedServer;

exports.boot = function (program) {
  defaults.setup(program);

  // Setup DDNS Here so we handle exit codes properly
  ddns.setup(program, spawnedServer);

  // TODO: Copy files to bootpath, if none exist
  // if (!fs.existsSync(path.join(program.directory, 'server.jar'))) {
  //   fs.copyFileSync(path.join(__dirname, '../../minecraft/server.jar'), path.join(program.directory, 'server.jar'));
  //   fs.copyFileSync(path.join(__dirname, '../../minecraft/eula.txt'), path.join(program.directory, 'eula.txt'));
  // }

  // TODO: Handle port

  bootServer(program.directory);
}

function bootServer(bootPath) {
  if(spawnedServer) {
    winston.warn('Server Already Running');
    return;
  }

  try {
    spawnedServer = spawn('./bitwarden_rs', [], {
      // shell: true,
      cwd: bootPath,
    });

    spawnedServer.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    
    spawnedServer.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });

    spawnedServer.on('close', (code) => {
      winston.info('Minecraft Server Failed. Rebooting...');
      setTimeout(() => {
        winston.info('Rebooting Server...');
        delete spawnedServer;
        bootReverseProxy(program);
      }, 4000);
    });

    winston.info('Server Booted');
  }catch (err) {
    winston.error(`Failed to boot server`);
    winston.error(err.message);
    return;
  }
}
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
  const killIt = function() {
    if(spawnedServer) {
      spawnedServer.stdin.pause();
      spawnedServer.kill();
    }
  }

  ddns.setup(program, killIt);

  // Copy files to bootpath, if none exist
  if (!fs.existsSync(path.join(program.directory, 'eula.txt'))) {
    fs.copyFileSync(path.join(__dirname, '../../minecraft/eula.txt'), path.join(program.directory, 'eula.txt'));
    fs.copyFileSync(path.join(__dirname, '../../minecraft/server.properties'), path.join(program.directory, 'server.properties'));
  }

  // Handle port
  let file = fs.readFileSync(path.join(program.directory, 'server.properties'), 'utf-8');
  file = file.replace(/server-port=[0-9]*/g, `server-port=${program.port}`);
  fs.writeFileSync(path.join(program.directory, 'server.properties'), file, 'utf-8');

  bootServer(program.directory);
}

function bootServer(bootPath) {
  if(spawnedServer) {
    winston.warn('Server Already Running');
    return;
  }

  try {
    spawnedServer = spawn('java', ['-Xmx1024M', '-Xms1024M', '-jar', path.join(__dirname, '../../minecraft/server.jar'), 'nogui'], {
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
        bootServer(program);
      }, 4000);
    });

    winston.info('Server Booted');
  }catch (err) {
    winston.error(`Failed to boot server`);
    winston.error(err.message);
    return;
  }
}
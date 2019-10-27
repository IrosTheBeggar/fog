const logger = require('../logger');
logger.init();
const winston = require('winston');
const path = require('path');
const { spawn } = require('child_process');
const fs = require("fs");
const os = require('os');
const mkdirp = require('make-dir');
const defaults = require('../defaults');
const ddns = require('../ddns');

var spawnedServer;
const platform = os.platform();
const osMap = {
  "win32": "bitwarden-win.exe",
  "darwin": "terraria-OSX.app/Contents/MacOS/TerrariaServer.bin.osx",
  "linux": "bitwarden-linux",
  "android": "bitwarden-android64"
};

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
  // if (!fs.existsSync(path.join(program.directory, '.env'))) {
  //   fs.copyFileSync(path.join(__dirname, '../../bitwarden/.env'), path.join(program.directory, '.env'));
  // }

  // if (!fs.existsSync(path.join(program.directory, 'data'))) {
  //   mkdirp(path.join(program.directory, 'data'));
  // }
  
  // Handle port
  // let file = fs.readFileSync(path.join(program.directory, '.env'), 'utf-8');
  // file = file.replace(/ROCKET_PORT=.*/g, `ROCKET_PORT=${program.port}`);
  // file = file.replace(/WEB_VAULT_FOLDER=.*/g, `WEB_VAULT_FOLDER=${path.join(__dirname, '../../bitwarden/web-vault')}`);
  // fs.writeFileSync(path.join(program.directory, '.env'), file, 'utf-8');

  bootServer(program.directory);
}

function bootServer(bootPath) {
  if(spawnedServer) {
    winston.warn('Server Already Running');
    return;
  }

  try {
    spawnedServer = spawn(path.join(__dirname, `../../server/terraria/${osMap[platform]}`), [], {
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
      winston.info('BitwardenRS Server Failed. Rebooting...');
      setTimeout(() => {
        winston.info('Rebooting Server...');
        delete spawnedServer;
        bootServer(bootPath);
      }, 4000);
    });

    winston.info('Server Booted');
  }catch (err) {
    winston.error(`Failed to boot server`);
    winston.error(err.message);
    return;
  }
}
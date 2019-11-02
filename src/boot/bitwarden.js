const path = require('path');
const { spawn } = require('child_process');
const fs = require("fs");
const os = require('os');
const mkdirp = require('make-dir');
const winston = require('winston');

var spawnedServer;
const platform = os.platform();
const arch = os.arch();

const osMap = {
  "win32-x64": "bitwarden.exe",
  "darwin-x64": "bitwarden-osx",
  "linux-x64": "bitwarden-linux",
  "android-arm64": "bitwarden-android64"
};

exports.boot = function (program) {
  // Setup DDNS Here so we handle exit codes properly
  program.killThese.push(
    () => {
      if(spawnedServer) {
        spawnedServer.stdin.pause();
        spawnedServer.kill();
      }
    }
  );

  // Copy files to bootpath, if none exist
  if (!fs.existsSync(path.join(program.serverConfig.bitwarden.directory, '.env'))) {
    fs.copyFileSync(path.join(__dirname, '../../servers/bitwarden/.env'), path.join(program.serverConfig.bitwarden.directory, '.env'));
  }

  if (!fs.existsSync(path.join(
    program.serverConfig.bitwarden.directory, 'data'))) {
    mkdirp(path.join(program.serverConfig.bitwarden.directory, 'data'));
  }
  
  // Handle port
  let file = fs.readFileSync(path.join(program.serverConfig.bitwarden.directory, '.env'), 'utf-8');
  file = file.replace(/ROCKET_PORT=.*/g, `ROCKET_PORT=${program.port}`);
  file = file.replace(/WEB_VAULT_FOLDER=.*/g, `WEB_VAULT_FOLDER=${path.join(__dirname, '../../servers/bitwarden/web-vault')}`);
  fs.writeFileSync(path.join(program.serverConfig.bitwarden.directory, '.env'), file, 'utf-8');

  bootServer(program.serverConfig.bitwarden.directory);
}

function bootServer(bootPath) {
  if(spawnedServer) {
    winston.warn('Server Already Running');
    return;
  }

  try {
    console.log(osMap[`${platform}-${arch}`])
    if (!osMap[`${platform}-${arch}`]) {
      throw new Error('Unsupported System');
    }

    spawnedServer = spawn(path.join(__dirname, '../../servers/bitwarden/' + osMap[`${platform}-${arch}`]), [], {
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
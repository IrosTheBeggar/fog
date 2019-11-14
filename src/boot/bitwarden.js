const path = require('path');
const { spawn } = require('child_process');
const fs = require("fs");
const os = require('os');
const mkdirp = require('make-dir');
const unzip = require('adm-zip');
const del = require('del');
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

exports.boot = async program => {
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
    fs.copyFileSync(path.join(__dirname, '../../servers/bitwarden/template.env'), path.join(program.serverConfig.bitwarden.directory, '.env'));
    fs.copyFileSync(path.join(__dirname, '../../servers/bitwarden/VERSION.template.md'), path.join(program.serverConfig.bitwarden.directory, 'VERSION.md'));
  }

  // Create 'data' directory where bitwarden stores all it's critical files
  if (!fs.existsSync(path.join(program.serverConfig.bitwarden.directory, 'data'))) {
    mkdirp(path.join(program.serverConfig.bitwarden.directory, 'data'));
  }

  // Handle upgrades, we should always copy the ENV file over?
  // That would break user modifications though
  try {
    const curVer = fs.readFileSync(path.join(__dirname, '../../servers/bitwarden/VERSION.template.md'), 'utf-8').trim();
    const dirVer = fs.readFileSync(path.join(program.serverConfig.bitwarden.directory, 'VERSION.md'), 'utf-8').trim();
    if (curVer !== dirVer) {
      throw new Error('Version Does Not Match');
    }
  }catch (err) {
    winston.info('Upgrading .env File');
    try { fs.unlinkSync(path.join(program.serverConfig.bitwarden.directory, 'VERSION.md')); } catch(e){}
    try { fs.unlinkSync(path.join(program.serverConfig.bitwarden.directory, '.env')); } catch(e){}
    fs.copyFileSync(path.join(__dirname, '../../servers/bitwarden/template.env'), path.join(program.serverConfig.bitwarden.directory, '.env'));
    fs.copyFileSync(path.join(__dirname, '../../servers/bitwarden/VERSION.template.md'), path.join(program.serverConfig.bitwarden.directory, 'VERSION.md'));
  }
  
  // Create web-vault frontend
  const webVaultPath = path.join(program.serverConfig.bitwarden.directory, 'web-vault');
  let shouldCreateVault = false;
  if (!fs.existsSync(webVaultPath) || !fs.existsSync(path.join(webVaultPath, 'index.html'))) {
    shouldCreateVault = true;
  }

  // handle vault  upgrades
  try {
    const curVer = fs.readFileSync(path.join(__dirname, '../../servers/bitwarden/WEB-VAULT-VERSION.template.md'), 'utf-8').trim();
    const dirVer = fs.readFileSync(path.join(program.serverConfig.bitwarden.directory, 'WEB-VAULT-VERSION.md'), 'utf-8').trim();
    if (curVer !== dirVer) {
      throw new Error('Web Vault Version Does Not Match');
    }
  }catch (err) {
    winston.info('Removing Old Web App Files');
    await del(path.join(program.serverConfig.bitwarden.directory, 'web-vault'), { force: true });
    try { fs.unlinkSync(path.join(program.serverConfig.bitwarden.directory, 'WEB-VAULT-VERSION.md')); } catch(e){}
    shouldCreateVault = true;
  }

  if (shouldCreateVault === true) {
    winston.info('Unzipping Bitwarden Web App');
    mkdirp(path.join(program.serverConfig.bitwarden.directory, 'web-vault'));
    const unzippedArchive = new unzip(path.join(__dirname, "../../servers/bitwarden/web-vault.zip"));
    unzippedArchive.extractAllTo(program.serverConfig.bitwarden.directory);
    fs.copyFileSync(path.join(__dirname, '../../servers/bitwarden/WEB-VAULT-VERSION.template.md'), path.join(program.serverConfig.bitwarden.directory, 'WEB-VAULT-VERSION.md'));
  }

  // Handle config edits
  let adminTokenString = '# ADMIN_TOKEN=X';
  if (program.serverConfig.bitwarden.adminToken) {
    adminTokenString = `ADMIN_TOKEN=${program.serverConfig.bitwarden.adminToken}`;
  }

  let file = fs.readFileSync(path.join(program.serverConfig.bitwarden.directory, '.env'), 'utf-8');
  file = file.replace(/(#?)([ \t]*)ROCKET_PORT=.*/g, `ROCKET_PORT=${program.port}`);
  file = file.replace(/(#?)([ \t]*)SIGNUPS_ALLOWED=.*/g, `SIGNUPS_ALLOWED=${program.serverConfig.bitwarden.signUpEnabled}`);
  file = file.replace(/(#?)([ \t]*)ADMIN_TOKEN=.*/g, adminTokenString);
  fs.writeFileSync(path.join(program.serverConfig.bitwarden.directory, '.env'), file, 'utf-8');

  // Boot the server
  bootServer(program.serverConfig.bitwarden.directory);
}

function bootServer(bootPath) {
  if (spawnedServer) {
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
const path = require('path');
const { spawn } = require('child_process');
const fs = require("fs");
const os = require('os');
const winston = require('winston');
const unzip = require('adm-zip');

var spawnedServer;
const platform = os.platform();
const arch = os.arch();

const osMap = {
  "win32-x64": {
    zip: "bedrock-server-win.zip",
    executable: "bedrock_server.exe"
  },
  "linux-x64": {
    zip: "bedrock-server-linux.zip",
    executable: "bedrock_server"
  }
};

exports.boot = function (program) {
  program.killThese.push(
    () => {
      if(spawnedServer) {
        spawnedServer.stdin.pause();
        spawnedServer.kill();
      }
    }
  );

  if (!osMap[`${platform}-${arch}`]) {
    throw new Error('Unsupported System');
  }

  // Check file &and unzip
  if (!fs.existsSync(path.join(program.serverConfig.minecraftBedrock.directory, osMap[`${platform}-${arch}`].executable))) {
    winston.info('Unzipping Server Files');
    const unzippedArchive = new unzip(path.join(__dirname, "../../servers/minecraft-bedrock/" + osMap[`${platform}-${arch}`].zip));
    unzippedArchive.extractAllTo(program.serverConfig.minecraftBedrock.directory, true);

    // Copy README
    fs.copyFileSync(path.join(__dirname, '../../servers/minecraft-bedrock/README.md'), path.join(program.serverConfig.minecraftBedrock.directory, 'README.md'));
  }  

  // Edit config
  let configFile = fs.readFileSync(path.join(program.serverConfig.minecraftBedrock.directory, 'server.properties'), 'utf-8');
  configFile = configFile.replace(/server-port=.*/g, `server-port=${program.port}`);
  fs.writeFileSync(path.join(program.serverConfig.minecraftBedrock.directory, 'server.properties'), configFile, 'utf-8');


  bootServer(program.serverConfig.minecraftBedrock.directory);
}

function bootServer(bootPath) {
  if (spawnedServer) {
    winston.warn('Server Already Running');
    return;
  }

  try {
    spawnedServer = spawn(path.join(bootPath, osMap[`${platform}-${arch}`].executable), [], {
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
      winston.info('Minecraft Bedrock Server Failed. Rebooting...');
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
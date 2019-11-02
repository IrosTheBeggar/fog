const winston = require('winston');
const path = require('path');
const { spawn } = require('child_process');
const fs = require("fs");

var spawnedServer;

exports.boot = function (program) {
  program.killThese.push(
    () => {
      if(spawnedServer) {
        spawnedServer.stdin.pause();
        spawnedServer.kill();
      }
    }
  );

  const foo = spawn('java', ['-version']);
  foo.on('error', data => {
    winston.error('Java Is Not Installed! Download Java at: https://www.java.com/en/download/');
  });
  foo.on('close', code => {
    if (code !== 0) {
      throw new Error('Java Is Not Installed! Download Java at: https://www.java.com/en/download/');
    }

    // Copy files to bootpath, if none exist
    if (!fs.existsSync(path.join(program.serverConfig.minecraftJava.directory, 'eula.txt'))) {
      fs.copyFileSync(path.join(__dirname, '../../servers/minecraft-java/eula.txt'), path.join(program.serverConfig.minecraftJava.directory, 'eula.txt'));
      fs.copyFileSync(path.join(__dirname, '../../servers/minecraft-java/server.properties'), path.join(program.serverConfig.minecraftJava.directory, 'server.properties'));
    }

    // Handle port
    let file = fs.readFileSync(path.join(program.serverConfig.minecraftJava.directory, 'server.properties'), 'utf-8');
    file = file.replace(/server-port=[0-9]*/g, `server-port=${program.port}`);
    fs.writeFileSync(path.join(program.serverConfig.minecraftJava.directory, 'server.properties'), file, 'utf-8');

    bootServer(program.serverConfig.minecraftJava.directory);
  });
}

function bootServer(bootPath) {
  if(spawnedServer) {
    winston.warn('Server Already Running');
    return;
  }

  try {
    spawnedServer = spawn('java', ['-Xmx1024M', '-Xms1024M', '-jar', path.join(__dirname, '../../server/minecraft-java/server.jar'), 'nogui'], {
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
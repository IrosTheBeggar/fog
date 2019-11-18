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

    // Copy eula.txt
    if (!fs.existsSync(path.join(program.serverConfig.minecraftJava.directory, 'eula.txt'))) {
      fs.copyFileSync(path.join(__dirname, '../../servers/minecraft-java/eula.txt'), path.join(program.serverConfig.minecraftJava.directory, 'eula.txt'));
    }

    // Copy config file
    if (!fs.existsSync(path.join(program.serverConfig.minecraftJava.directory, 'server.properties'))) {
      fs.copyFileSync(path.join(__dirname, '../../servers/minecraft-java/server.properties.template'), path.join(program.serverConfig.minecraftJava.directory, 'server.properties'));
      fs.copyFileSync(path.join(__dirname, '../../servers/minecraft-java/VERSION.template.md'), path.join(program.serverConfig.minecraftJava.directory, 'VERSION.md'));
    }

    // Handle upgrades, we should always copy the ENV file over?
    // That would break user modifications though
    try {
      const curVer = fs.readFileSync(path.join(__dirname, '../../servers/minecraft-java/VERSION.template.md'), 'utf-8').trim();
      const dirVer = fs.readFileSync(path.join(program.serverConfig.minecraftJava.directory, 'VERSION.md'), 'utf-8').trim();
      if (curVer !== dirVer) {
        throw new Error('Version Does Not Match');
      }
    }catch (err) {
      winston.info('Upgrading config File');
      try { fs.unlinkSync(path.join(program.serverConfig.minecraftJava.directory, 'VERSION.md')); } catch(e){}
      try { fs.unlinkSync(path.join(program.serverConfig.minecraftJava.directory, 'server.properties')); } catch(e){}
      fs.copyFileSync(path.join(__dirname, '../../servers/minecraft-java/server.properties.template'), path.join(program.serverConfig.minecraftJava.directory, 'server.properties'));
      fs.copyFileSync(path.join(__dirname, '../../servers/minecraft-java/VERSION.template.md'), path.join(program.serverConfig.minecraftJava.directory, 'VERSION.md'));
    }

    // Edit config
    let file = fs.readFileSync(path.join(program.serverConfig.minecraftJava.directory, 'server.properties'), 'utf-8');
    file = file.replace(/server-port=.*/g, `server-port=${program.port}`);
    file = file.replace(/motd=.*/g, `motdt=${program.serverConfig.minecraftJava.serverMessage}`);
    file = file.replace(/gamemode=.*/g, `gamemode=${program.serverConfig.minecraftJava.gameMode}`);
    file = file.replace(/difficulty=.*/g, `difficulty=${program.serverConfig.minecraftJava.difficulty}`);
    file = file.replace(/pvp=.*/g, `pvp=${program.serverConfig.minecraftJava.pvp}`);
    file = file.replace(/allow-flight=.*/g, `allow-flight=${program.serverConfig.minecraftJava.flightMods}`);
    file = file.replace(/enable-command-block=.*/g, `enable-command-block=${program.serverConfig.minecraftJava.commandBlocks}`);
    file = file.replace(/hardcore=.*/g, `hardcore=${program.serverConfig.minecraftJava.hardcoreMode}`);
    file = file.replace(/snooper-enabled=.*/g, `snooper-enabled=${program.serverConfig.minecraftJava.sendStats}`);
    file = file.replace(/view-distance=.*/g, `view-distance=${program.serverConfig.minecraftJava.viewDistance}`);
    file = file.replace(/max-players=.*/g, `max-players=${program.serverConfig.minecraftJava.maxPlayers}`);
    file = file.replace(/online-mode=.*/g, `online-mode=${program.serverConfig.minecraftJava.verifyPlayers}`);

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
    spawnedServer = spawn('java', ['-Xmx1024M', '-Xms1024M', '-jar', path.join(__dirname, '../../servers/minecraft-java/server.jar'), 'nogui'], {
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
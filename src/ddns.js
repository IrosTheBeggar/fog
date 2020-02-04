const axios = require('axios');
const os = require('os');
const winston = require('winston');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const eol = os.EOL;

var spawnedTunnel;
const apiEndpoint = 'https://api.fogmachine.io';
const platform = os.platform();
const osMap = {
  "win32": "fogmachine-ddns-win.exe",
  "darwin": "fogmachine-ddns-osx",
  "linux": "fogmachine-ddns-linux",
  "android": "fogmachine-rpn-android64"
};

exports.setup = function (program) {
  program.killThese.push(
    () => {
      if (spawnedTunnel) {
        spawnedTunnel.stdin.pause();
        spawnedTunnel.kill();
      }
    }
  );

  if (!program.ddns || !program.ddns.email || !program.ddns.password) {
    return;
  }

  login(program);
}

async function login(program) {
  var info;
  try {
    // login
    const loginRes = await axios({
      method: 'post',
      url: apiEndpoint + '/login', 
      headers: { 'accept': 'application/json' },
      responseType: 'json',
      data: {
        email: program.ddns.email,
        password: program.ddns.password
      }
    });

    // pull in config options
    const configRes = await axios({
      method: 'get',
      url: apiEndpoint + '/account/info',
      headers: { 'x-access-token': loginRes.data.token, 'accept': 'application/json' },
      responseType: 'json'
    });

    if (configRes.data.domains.length === 0) {
      winston.error('RPN ERROR: No domains found for account');
      throw new Error('No domains found for account');
    }else if (configRes.data.domains.length === 1) {
      info = configRes.data.domains[0];
    } else {
      configRes.data.domains.forEach(el => {
        if (program.ddns.chosenDomain === el.fullDomain) {
          info = el;
        }
      });
    }

    if (!info) {
      winston.error('RPN ERROR: You have multiple domains and did not specify which one to use');
      throw new Error('No domain specified for account');
    }

  } catch (err) {
    console.log(err)
    winston.error('Login to Auto DNS Failed');
    winston.error(err);
    return;
  }

  // write config file for FRP
  try {
    let iniString = `[common]${eol}server_addr = ${info.ip}${eol}server_port = ${info.bindPort}${eol}token = ${info.tunnelPassword}${eol}${eol}[web]${eol}type = http${eol}local_ip = 127.0.0.1${eol}custom_domains = ${info.fullDomain}${eol}local_port = ${program.port}`;
    if (program.server === 'minecraft-java') {
      iniString = `[common]${eol}server_addr = ${info.ip}${eol}server_port = ${info.bindPort}${eol}token = ${info.tunnelPassword}${eol}${eol}[web]${eol}type = tcp${eol}local_ip = 127.0.0.1${eol}${eol}local_port = ${program.port}${eol}remote_port = ${info.rawPort}`;
    } else if (program.server === 'minecraft-bedrock') {
      iniString = `[common]${eol}server_addr = ${info.ip}${eol}server_port = ${info.bindPort}${eol}token = ${info.tunnelPassword}${eol}${eol}[web]${eol}type = udp${eol}local_ip = 127.0.0.1${eol}${eol}local_port = ${program.port}${eol}remote_port = ${info.rawPort}`;
    }
    fs.writeFileSync(program.ddns.iniFile, iniString);
  } catch(err) {
    winston.error('Failed to write FRP ini');
    winston.error(err.message);
    return;
  }

  // Boot it
  bootReverseProxy(program, info);
}

function bootReverseProxy(program, info) {
  if(spawnedTunnel) {
    winston.warn('Auto DNS: Tunnel already setup');
    // return;
  }

  try {
    spawnedTunnel = spawn(path.join(__dirname, `../frp/${osMap[platform]}`), ['-c', program.ddns.iniFile], {
      // shell: true,
      // cwd: path.join(__dirname, `../frp/`),
    });

    spawnedTunnel.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    
    spawnedTunnel.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });

    spawnedTunnel.on('close', (code) => {
      winston.info('Auto DNS: Tunnel Closed. Attempting to reboot');
      setTimeout(() => {
        winston.info('Auto DNS: Rebooting Tunnel');
        delete spawnedTunnel;
        bootReverseProxy(program, info);
      }, 4000);
    });

    winston.info('Auto DNS: Secure Tunnel Established');
    winston.info(`Access Your Server At: https://${info.subdomain}.${info.domain}`);
  }catch (err) {
    winston.error(`Failed to boot FRP`);
    winston.error(err.message);
    return;
  }
}
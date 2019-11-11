const { app, BrowserWindow, ipcMain, Tray, Menu, dialog, shell } = require('electron');
const fs = require('fs');
const fe = require('path');
const os = require('os');
const mkdirp = require('make-dir');
const AutoLaunch = require('auto-launch');
const { autoUpdater } = require("electron-updater");

const fogAuthLaunch = new AutoLaunch({ name: 'Fog Machine' });
const configFile = fe.join(app.getPath('userData'), 'save/server-config.json');
let appIcon;
let trayTemplate;

if (!fs.existsSync(fe.join(app.getPath('userData'), 'save'))) {
  mkdirp(fe.join(app.getPath('userData'), 'save'));
}

if (!fs.existsSync(fe.join(app.getPath('userData'), 'minecraft-java'))) {
  mkdirp(fe.join(app.getPath('userData'), 'minecraft-java'));
}

if (!fs.existsSync(fe.join(app.getPath('userData'), 'minecraft-bedrock'))) {
  mkdirp(fe.join(app.getPath('userData'), 'minecraft-bedrock'));
}

if (!fs.existsSync(fe.join(app.getPath('userData'), 'bitwarden'))) {
  mkdirp(fe.join(app.getPath('userData'), 'bitwarden'));
}

if (!fs.existsSync(fe.join(app.getPath('userData'), 'bitwarden/data'))) {
  mkdirp(fe.join(app.getPath('userData'), 'bitwarden/data'));
}

// Errors
process.on('uncaughtException', function (error) {
  // Handle Known Errors
  if (error.code === 'EADDRINUSE') {
    // Handle the error
    dialog.showErrorBox("Server Boot Error", "The port you selected is already in use.  Please choose another");
  } else if (error.code === 'BAD CERTS') {
    dialog.showErrorBox("Server Boot Error", "Failed to create HTTPS server.  Please check your certs and try again. " + os.EOL + os.EOL + os.EOL + "ERROR MESSAGE: " + error.message);
  }

  // Unknown Errors
  else {
    dialog.showErrorBox("Unknown Error", "Unknown Error with code: " + error.code + os.EOL + os.EOL + os.EOL + "ERROR MESSAGE: " + error.message);
    console.log(error);
    // TODO: Dump error details to a file
  }

  // Temporarily disable autoboot
  fs.writeFileSync(fe.join(app.getPath('userData'), 'save/temp-boot-disable.json'), JSON.stringify({ disable: true }), 'utf8');

  // Reboot the app
  app.relaunch();
  app.quit();
});


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createMainWindow);

// Quit if server hasn't been started
app.on('window-all-closed', function () {
  if (!bootFlag) {
    app.quit();
  }

  if (process.platform === 'darwin') {
    app.dock.hide()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createMainWindow();
  }
})

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
function createMainWindow() {
  if (bootFlag || mainWindow) {
    return;
  }

  let loadJson = false;
  try {
    if (fs.statSync(fe.join(app.getPath('userData'), 'save/temp-boot-disable.json')).isFile()) {
      const loadJson9 = JSON.parse(fs.readFileSync(fe.join(app.getPath('userData'), 'save/temp-boot-disable.json'), 'utf8'));
      if (loadJson9.disable === false && fs.statSync(configFile).isFile()) {
        loadJson = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      }
    }
  } catch(error){
    loadJson = false;
    console.log('Failed To Load JSON');
  }

  if (loadJson) {
    bootServer(loadJson);
    return;
  }

  // Create the browser window.
  mainWindow = new BrowserWindow({ webPreferences: { nodeIntegration: true },  width: 850, height: 550, icon: fe.join(__dirname, '/electron/fogmachine.png') });
  mainWindow.loadURL('file://' + __dirname + '/electron/index3.html');
  mainWindow.setMenu(null);
  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    mainWindow = null;
  });
}

// Boot Server Event
ipcMain.once('start-server', (event, arg) => {
  bootServer(arg);
});

const nameMapper = {
  'file': 'File Server',
  'minecraft-bedrock': 'Minecraft Bedrock',
  'minecraft-java': 'Minecraft Java',
  'terraria': 'Terraria',
  'bitwarden': 'Bitwarden RS'
}

var bootFlag = false;
function bootServer(program) {
  program.ddns.iniFile = fe.join(app.getPath('userData'), 'save/frpc.ini');

  // Auto Boot
  if ((program.autoboot && program.autoboot === true)) {
    fogAuthLaunch.enable();
    fs.writeFileSync(fe.join(app.getPath('userData'), 'save/temp-boot-disable.json'), JSON.stringify({ disable: false }), 'utf8');
  }

  // Tray Template Object
  trayTemplate = [
    {
      label: `Fog Machine v${app.getVersion()}`, click: () => {
        shell.openExternal('https://fogmachine.io');
      }
    },
    {
      label: 'Check For Updates', click: function () {
        autoUpdater.checkForUpdatesAndNotify();
      }
    },
    { type: 'separator' },
    {
      label: `Running: ${nameMapper[program.server]}`, click: () => {}
    },
    { label: 'Links', submenu: [
      {
        label: 'http://localhost:' + program.port, click: () => {
          shell.openExternal('http://localhost:' + program.port)
        }
      }
    ] },
    { 
      label: 'Open Server Storage', click: () => {
        shell.openItem(app.getPath('userData'));
      } 
    },
    { type: 'separator' },
    {
      label: 'Restart and Reconfigure', click: () => {
        fs.writeFileSync(fe.join(app.getPath('userData'), 'save/temp-boot-disable.json'), JSON.stringify({ disable: true }), 'utf8');
        app.relaunch();
        app.isQuiting = true;
        app.quit();
      }
    },
    {
      label: 'Disable Boot On Startup', click: () => {
        fogAuthLaunch.disable();
      }
    },
    {
      label: 'Quit', click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ];

  // Check if Auto DNS is logged in
  if(program.ddns.tested === true) {
    trayTemplate[4].submenu.push({
      label: 'https://' + program.ddns.url, click: () => {
        shell.openExternal('https://' + program.ddns.url)
      }
    });
  }

  // Create Tray Icon
  appIcon = new Tray(process.platform === 'darwin' ? fe.join(__dirname, '/electron/images/icon.png') : fe.join(__dirname, '/electron/fogmachine.png'));
  appIcon.setContextMenu(Menu.buildFromTemplate(trayTemplate)); // Call this again if you modify the tray menu
  
  // The boot code
  try {
    require('./src/switcher').boot(program);
    bootFlag = true;
  } catch (error) {
    console.log('Boot Error');
    throw error;
  }
}

autoUpdater.on('update-available', (info) => {
  if (!trayTemplate) { return; }

  trayTemplate[1] = {
    label: 'Update Ready: Quit And Install', click: () => {
      autoUpdater.quitAndInstall();
    }
  };

  trayTemplate[8] = {
    label: 'Restart and Reconfigure', click: () => {
      fs.writeFileSync(fe.join(app.getPath('userData'), 'save/temp-boot-disable.json'), JSON.stringify({ disable: true }), 'utf8');
      app.isQuiting = true;
      autoUpdater.quitAndInstall();
    }
  };

  appIcon.setContextMenu(Menu.buildFromTemplate(trayTemplate));
});
const { app, BrowserWindow, ipcMain, Tray, Menu, dialog, shell } = require('electron');
const fs = require('fs');
const fe = require('path');
const os = require('os');
const mkdirp = require('make-dir');
const AutoLaunch = require('auto-launch');

const mstreamAutoLaunch = new AutoLaunch({ name: 'Fog Machine' });
const configFile = fe.join(app.getPath('userData'), 'save/server-config.json');
let appIcon;

if (!fs.existsSync(fe.join(app.getPath('userData'), 'save'))) {
  mkdirp(fe.join(app.getPath('userData'), 'save'));
}

if (!fs.existsSync(fe.join(app.getPath('userData'), 'minecraft'))) {
  mkdirp(fe.join(app.getPath('userData'), 'minecraft'));
}

if (!fs.existsSync(fe.join(app.getPath('userData'), 'bitwarden'))) {
  mkdirp(fe.join(app.getPath('userData'), 'bitwarden'));
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
  if (!server) {
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
  if (server || mainWindow) {
    return;
  }

  try{
    if(fs.statSync(fe.join(app.getPath('userData'), 'save/temp-boot-disable.json')).isFile()){
      var loadJson9 = JSON.parse(fs.readFileSync(fe.join(app.getPath('userData'), 'save/temp-boot-disable.json'), 'utf8'));
      if(loadJson9.disable === false && fs.statSync(configFile).isFile()){
        var loadJson = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        bootServer(loadJson);
        return;
      }
    }
  }catch(error){
    console.log('Failed To Load JSON');
  }

  // Create the browser window.
  mainWindow = new BrowserWindow({ webPreferences: { nodeIntegration: true },  width: 850, height: 550, icon: fe.join(__dirname, '/electron/mstream-logo-cut.png') });
  mainWindow.loadURL('file://' + __dirname + '/electron/index3.html');
  mainWindow.setMenu(null);
  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    mainWindow = null;
  });
}

// Boot Server Event
ipcMain.once('start-server', function (event, arg) {
  bootServer(arg);
});

var server;
function bootServer(program) {
  program.ddns.iniFile = fe.join(app.getPath('userData'), 'save/frpc.ini');

  // Auto Boot
  if ((program.autoboot && program.autoboot === true)) {
    mstreamAutoLaunch.enable();
    fs.writeFileSync(fe.join(app.getPath('userData'), 'save/temp-boot-disable.json'), JSON.stringify({ disable: false }), 'utf8');
  }

  // Tray Template Object
  const protocol = program.ssl && program.ssl.cert && program.ssl.key ? 'https' : 'http';
  var trayTemplate = [
    {
      label: 'Fogmachine Server v' + app.getVersion(), click: function () {
        shell.openExternal('http://mstream.io/mstream-express');
      }
    },
    { label: 'Links', submenu: [
      {
        label: protocol + '://localhost:' + program.port, click: function () {
          shell.openExternal(protocol + '://localhost:' + program.port)
        }
      }
    ] },
    { type: 'separator' },
    {
      label: 'Restart and Reconfigure', click: function () {
        fs.writeFileSync(fe.join(app.getPath('userData'), 'save/temp-boot-disable.json'), JSON.stringify({ disable: true }), 'utf8');
        app.relaunch();
        app.isQuiting = true;
        app.quit();
      }
    },
    {
      label: 'Disable Autoboot', click: function () {
        mstreamAutoLaunch.disable();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit', click: function () {
        app.isQuiting = true;
        app.quit();
      }
    }
  ];

  // Check if Auto DNS is logged in
  if(program.ddns.tested === true) {
    trayTemplate[1].submenu.push({ type: 'separator' });
    trayTemplate[1].submenu.push({
      label: 'https://' + program.ddns.url, click: function () {
        shell.openExternal('https://' + program.ddns.url)
      }
    });
  }

  // Create Tray Icon
  appIcon = new Tray(process.platform === 'darwin' ? fe.join(__dirname, '/electron/images/icon.png') :  fe.join(__dirname, '/electron/mstream-logo-cut.png'));
  appIcon.setContextMenu(Menu.buildFromTemplate(trayTemplate)); // Call this again if you modify the tray menu
  
  // The boot code
  server = require('./mstream.js');
  server.serveIt(program);
}

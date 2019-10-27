#!/usr/bin/env node
"use strict";

// Check if we are in an electron environment
if (process.versions["electron"]) {
  // off to a separate electron boot environment
  require("./electron-boot");
  return;
}

const colors = require('colors');

console.clear();
console.log(colors.bold(`
    ______               __  ___           __    _          
   / ____/___  ____ _   /  |/  /___ ______/ /_  (_)___  ___ 
  / /_  / __ \\/ __ \`/  / /|_/ / __ \`/ ___/ __ \\/ / __ \\/ _ \\
 / __/ / /_/ / /_/ /  / /  / / /_/ / /__/ / / / / / / /  __/
/_/    \\____/\\__, /  /_/  /_/\\__,_/\\___/_/ /_/_/_/ /_/\\___/ 
            /____/                                      v0.1  
`));
console.log(colors.blue.bold(`An Experiment Developed By`));
console.log(colors.bold(`Paul Sori - ${colors.underline('paul@fogmachine.io')}`));
console.log();
console.log(colors.magenta.bold('Find a bug? Report it at:'));
console.log(colors.underline('https://github.com/IrosTheBeggar/fog/issues'));
console.log();

// Boot the server
try {
  const program = require("./src/configure-commander.js").setup(process.argv);
  require('./src/switcher').boot(program);
} catch (error) {
  console.log(colors.red('Boot Error'));
  console.log(error);
}


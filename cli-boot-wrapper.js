#!/usr/bin/env node
"use strict";

// Check if we are in an electron environment
if (process.versions["electron"]) {
  // off to a separate electron boot environment
  require("./electron-boot");
  return;
}


console.clear();
console.log(`
    ______               __  ___           __    _          
   / ____/___  ____ _   /  |/  /___ ______/ /_  (_)___  ___ 
  / /_  / __ \\/ __ \`/  / /|_/ / __ \`/ ___/ __ \\/ / __ \\/ _ \\
 / __/ / /_/ / /_/ /  / /  / / /_/ / /__/ / / / / / / /  __/
/_/    \\____/\\__, /  /_/  /_/\\__,_/\\___/_/ /_/_/_/ /_/\\___/ 
            /____/                        Paul Sori - v0.1.0`);
console.log();

// Boot the server
try {
  const program = require("./src/configure-commander.js").setup(process.argv);
  require('./src/switcher').boot(program);
} catch (error) {
  console.log('Boot Error');
  console.log(error);
}


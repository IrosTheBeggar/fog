## Fog Machine

Fog Machine is a cross platform app that lets you manage several popular servers.  The goal is to make deploying and managing self-hosted servers as easy as possible. Fog Machine currently supports the following servers:

* [Bitwarden RS](https://github.com/dani-garcia/bitwarden_rs)
* [Minecraft](https://www.minecraft.net/en-us/)
* Simple File Server

## Pre-Compiled Version With UI

The pre-compiled version of Fog Machine comes with everything you need for effortless deployment:

* Server can be booted and configured entirely through the GUI
* Automatically restarts when your computer reboots
* Binaries are code signed for easy installation

## Headless Version

You will need NodeJS installed.

```shell
# Install
git clone https://github.com/IrosTheBeggar/fog.git
cd fog
npm install

# Run File Server
# The -d flag points to the directory that will be served. All files in this directory will be made accessible through your server!
node cli-boot-wrapper.js -s file -d /path/to/your/web-root -p 5050

# Run Minecraft Server
# The -d flag sets the directory where your world data is stored. Changing the -d flag will generate a brand new world.  Just copy this folder to backup your world
node cli-boot-wrapper.js -s minecraft -d /path/to/your/minecraft/storage

# Run Bitwarden RS
# The -d flag sets the directory where your database and private keys are stored.  If you want to move your server or backup your data, just copy this directory
node cli-boot-wrapper.js -s bitwarden -d /path/to/your/bitwarden/data

# Use RPN
node cli-boot-wrapper.js -s file -d /path/to/your/web-root -u USERNAME -x PASSWORD
```

[Check out the guide on how to run the headless version in the background](run-forever.md)

## Install On Android

Fog Machine can be installed on Android [with Termux](https://termux.com/).  This is VERY experimental, and not guaranteed work on every device.  After installing Termux, install NodeJS

```shell
pkg install nodejs
```

After that you can use the commands in the section above.

NOTE: Java is not supported by Termux, but you can search some hacks to get it working.  So don't expect to be able to host your minecraft server.


## Building for linux

- Make sure to have a copy of the `minecraft_bedrock` executable in the folder
- make sure permissions are correct on that file
- build as normal

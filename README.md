## Fog Machine

Fog Machine is a cross platform app that lets you manage several popular servers.  The goal is to make deploying and managing self-hosted servers as easy as possible

## RPN

#### [Sign Up Here. It's Free!](https://fogmachine.io/sign-up.html)

The most difficult part of managing a server is getting it accessible online.  RPN is a service that does this automatically.  The RPN client is built into the Fog Machine app, but it is usable as it's own program and can be ported to work with any server.

#### Comes with these features

* Get your own domain at: alias.fogmachine.io
* Automatically sets up SSL Certificates for your domain
* Hole Punching software guarantees your server stays online as long as you have a working internet connection
* IP Obfuscation hides your IP address and adds an additional layer of security

RPN is a Reverse Proxy Network.  This means it takes several servers to keep it running.  I seeded the service with enough money to last into early 2020.  After this money runs out, the servers will be shut down and replaced with a paid version.

If you want to keep the free version around longer, you can donate to our Patreon.  Donations will to keeping the free tier up and running for everyone

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

# Use RPN with Fog Machine
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
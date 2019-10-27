const logger = require('./modules/logger');
logger.init();
const winston = require('winston');
const express = require('express');
const fogmachine = express();
const fs = require('fs');
const bodyParser = require('body-parser');
const serveIndex = require('serve-index');

const defaults = require('./modules/defaults.js');

exports.boot = function (program) {
  // Setup default values
  defaults.setup(program);

  // Logging
  if (program.logs) {
    logger.addFileLogger(program.logs);
  }

  // Set server
  var server;
  if (program.ssl && program.ssl.cert && program.ssl.key) {
    try {
      server = require('https').createServer({
        key: fs.readFileSync(program.ssl.key),
        cert: fs.readFileSync(program.ssl.cert)
      });
    } catch (error) {
      winston.error('FAILED TO CREATE HTTPS SERVER');
      error.code = 'BAD CERTS';
      throw error;
    }
  } else {
    server = require('http').createServer();
  }

  // Magic Middleware Things
  fogmachine.use(bodyParser.json()); // support json encoded bodies
  fogmachine.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
  fogmachine.use((req, res, next) => { // CORS
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  // Give access to public folder
  fogmachine.use('/', express.static(program.directory), serveIndex(program.directory, {}));

  // Start the server!
  server.on('request', fogmachine);
  server.listen(program.port, () => {
    const protocol = program.ssl && program.ssl.cert && program.ssl.key ? 'https' : 'http';
    winston.info(`Access your server locally: ${protocol + '://localhost:' + program.port}`);
  });
}

const winston = require('winston');
const express = require('express');
const fogmachine = express();
const bodyParser = require('body-parser');
const serveIndex = require('serve-index');

exports.boot = function (program) {
  // Set server
  const server = require('http').createServer();

  // Magic Middleware Things
  fogmachine.use(bodyParser.json()); // support json encoded bodies
  fogmachine.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
  fogmachine.use((req, res, next) => { // CORS
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  // Give access to public folder
  fogmachine.use('/', express.static(program.serverConfig.fileServer.directory), serveIndex(program.serverConfig.fileServer.directory, {}));

  // Start the server!
  server.on('request', fogmachine);
  server.listen(program.port, () => {
    winston.info(`Server started on port ${program.port}`);
  });
}

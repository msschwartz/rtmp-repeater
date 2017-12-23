const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
const moment = require('moment');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

wss.on('connection', function connection(ws, req) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });
  ws.on('close', function close() {
    console.log('disconnected');
  });
});

app.post('/', function (req, res) {
  var destination = req.query.destination;
  var proc = ffmpeg('rtmp://wowza.abnsat.com/live/arabic')
    .on('progress', function(info) {
      console.log('onprogress: ', info);
      broadcast({
        destination: destination,
        currentFps: info.currentFps,
        currentKbps: info.currentKbps,
        currentSeconds: moment.duration(info.timemark).asSeconds()
      });
    })
    .on('start', function(commandLine) {
      console.log('onstart: ', commandLine);
      broadcast({
        destination: destination,
        currentFps: 0,
        currentKbps: 0,
        currentSeconds: 0
      });
    })
    .on('end', function() {
      console.log('onend');
    })
    .on('error', function(err) {
      console.log('error: ', err);
    })
    .duration(10)
    .videoCodec('copy')
    .audioCodec('copy')
    .format('flv')
    .output(destination)
    .run();
  res.send('ok');
});

app.get('/', function (req, res) {
   res.sendfile(__dirname + '/ws.html');
});

server.listen(8080, function listening() {
  console.log('Listening on %d', server.address().port);
});

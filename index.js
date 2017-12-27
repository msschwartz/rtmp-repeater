const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
const moment = require('moment');
const ffmpeg = require('fluent-ffmpeg');
const bodyParser = require('body-parser')

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(bodyParser.urlencoded({ extended: false }))

function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

wss.on('connection', function connection(ws, req) {
  ws.on('message', function(message) {
    console.log('received: %s', message);
  });
  ws.on('close', function() {
    console.log('disconnected');
  });
  ws.on('error', function() {
    console.log('error');
  });
});

app.post('/', function (req, res) {
  if (!req.body.source) return res.send('missing source');
  if (!req.body.duration) return res.send('missing duration');
  if (!req.body.destination) return res.send('missing destination');

  var source = req.body.source;
  var duration = parseInt(req.body.duration);
  var destination = req.body.destination;

  var proc = ffmpeg(source)
    .on('progress', function(info) {
      console.log('onprogress: ', info);
      broadcast({
        event: 'onprogress',
        destination: destination,
        currentFps: info.currentFps,
        currentKbps: info.currentKbps,
        timemark: info.timemark,
        duration: duration
      });
    })
    .on('start', function(commandLine) {
      console.log('onstart: ', commandLine);
      broadcast({
        event: 'onprogress',
        destination: destination,
        currentFps: 0,
        currentKbps: 0,
        timemark: '00:00:00.00',
        duration: duration
      });
    })
    .on('end', function() {
      console.log('onend');
      broadcast({
        event: 'onend',
        destination: destination
      });
    })
    .on('error', function(err) {
      console.log('error: ', err);
      broadcast({
        event: 'onerror',
        destination: destination,
        error: err.message
      });
    })
    .on('stderr', function(stderrLine) {
      console.log('Stderr output: ' + stderrLine);
    })
    .duration(duration)
    .videoCodec('copy')
    .audioCodec('copy')
    .format('flv')
    .output(destination)
    .run();

  res.send('ok');
});

app.get('/', function (req, res) {
   res.sendfile(__dirname + '/index.html');
});

server.listen(8080, function listening() {
  console.log('Listening on %d', server.address().port);
});

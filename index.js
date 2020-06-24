const express = require('express');
const http = require('http');
const url = require('url');
const moment = require('moment');
const ffmpeg = require('fluent-ffmpeg');
const bodyParser = require('body-parser')
const shortid = require('shortid');

const app = express();
const server = http.createServer(app);

const staticStreams = {
  arabic: {
    primary: "rtmp://rtmp.abnsat.com/ingest/v1zos2fgbhrir28a",
    backup: "rtmp://rtmp.abnsat.com/ingest/v1zos2fgbhrir289",
    destination: "rtmp://rtmp.abnsat.com/live/arabic",
  },
  nilesat: {
    primary: "rtmp://rtmp.abnsat.com/ingest/v1zos2fgbhrir28a",
    backup: "rtmp://rtmp.abnsat.com/ingest/v1zos2fgbhrir289",
    destination: "rtmp://rtmp.abnsat.com/live/nilesat",
  },
  trinity: {
    primary: "rtmp://rtmp.abnsat.com/ingest/zehkcgjtbdblut0a",
    backup: "rtmp://rtmp.abnsat.com/ingest/zehkcgjtbdblut09",
    destination: "rtmp://rtmp.abnsat.com/live/trinity",
  },
  abnsama: {
    primary: "rtmp://rtmp.abnsat.com/ingest/wxpkr2rgbfjqvdaa",
    backup: "rtmp://rtmp.abnsat.com/ingest/wxpkr2rgbfjqvda9",
    destination: "rtmp://rtmp.abnsat.com/live/abnsama",
  },
};

const streams = {};

app.use(bodyParser.urlencoded({ extended: false }))
app.use('/images', express.static(__dirname + '/public'));

const onstart = key => command => {
  console.log(key, command);
};

const onprogress = key => info => {
  if (streams[key]) {
    streams[key].currentFps = info.currentFps;
    streams[key].currentKbps = info.currentKbps;
    streams[key].timemark = info.timemark; // moment.duration(info.timemark).seconds();
  }
};

const onend = key => () => {
  delete streams[key];
};

const onerror = key => error => {
  delete streams[key];
  console.log(key, error);
};

const onstderr = key => line => {
  console.log(key, line);
};

const serializeStreams = () => {
  return Object.values(streams).map(stream => ({
    key: stream.key,
    source: stream.source,
    destination: stream.destination,
    duration: stream.duration,
    currentFps: stream.currentFps,
    currentKbps: stream.currentKbps,
    timemark: stream.timemark,
    start: stream.start,
    end: stream.end,
  }));
};

const startStream = (key, source, duration, destination) => {
  streams[key] = {
    key,
    source,
    destination,
    currentFps: 0,
    currentKbps: 0,
    timemark: '00:00:00.00',
    start: Date.now(),
    end: Date.now() + (duration * 1000),
    command: ffmpeg()
      .input(source)
      .output(destination)
      .duration(duration)
      .native()
      .videoCodec('copy')
      .audioCodec('copy')
      .format('flv')
      .on('start', onstart(key))
      .on('progress', onprogress(key))
      .on('end', onend(key))
      .on('error', onerror(key))
      .on('stderr', onstderr(key))
  };

  streams[key].command.run();
};

app.post('/', function (req, res) {
  if (!req.body.source) return res.send('missing source');
  if (!req.body.duration) return res.send('missing duration');
  if (!req.body.server) return res.send('missing server');
  if (!req.body.stream) return res.send('missing stream');

  const key = shortid.generate();
  const source = req.body.source;
  const duration = parseInt(req.body.duration);
  const destination = req.body.server + '/' + req.body.stream;

  startStream(key, source, duration, destination);

  res.writeHead(302, {'Location': '/'});
  res.end();
});

app.get('/streams', function (req, res) {
  res.json(serializeStreams());
});

const killStream = key => {
  if (streams[key]) {
    try {
      streams[key].command.kill();
    } catch (err) {
      console.warn('failed to kill stream', err);
    }
    delete streams[key];
  }
}

app.delete('/streams/:key', (req, res) => {
  const {key} = req.params;
  killStream(key);
  res.json(serializeStreams());
});

app.get('/notify', function(req, res) {
  console.log('notify', JSON.stringify(req.query));
  
  const {call, tcurl, name} = req.query;
  const url = `${tcurl}/${name}`;

  Object.keys(staticStreams).forEach(key => {
    const stream = staticStreams[key];
    const primaryKey = `${key}-primary`;
    const backupKey = `${key}-backup`;
    const duration = 31536000; // 1 year
    if (call === 'publish' && url === stream.primary) {
      // kill backup, start primary
      killStream(backupKey);
      startStream(primaryKey, stream.primary, duration, stream.destination);
    }
    if (call === 'publish' && url === stream.backup && !streams[primaryKey]) {
      // if primary does not exist, start backup
      startStream(backupKey, stream.backup, duration, stream.destination);
    }
    if (call === 'publish_done' && url === stream.primary) {
      // kill primary, start backup
      killStream(primaryKey);
      startStream(backupKey, stream.backup, duration, stream.destination);
    }
    if (call === 'publish_done' && url === stream.backup) {
      // kill backup
      killStream(backupKey);
    }
  });

  res.status(200).send('OK');
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

server.listen(process.env.PORT || 3000, function listening() {
  console.log('Listening on %d', server.address().port);

  // TODO restart nginx so we capture publish events
});

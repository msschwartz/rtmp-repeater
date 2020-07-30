const express = require('express');
const http = require('http');
const url = require('url');
const moment = require('moment');
const ffmpeg = require('fluent-ffmpeg');
const bodyParser = require('body-parser')
const shortid = require('shortid');
const {getStreams, startStream, stopStream} = require('./src/streams');
const monitor = require('./src/monitor');
const config = require('./src/config');

const app = express();
const server = http.createServer(app);

// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());
// app.use('/images', express.static(__dirname + '/public'));

// app.post('/streams', function (req, res) {
//     if (!req.body.source) return res.send('missing source');
//     if (!req.body.destination) return res.send('missing destination');

//     const stream = streams.startStream(req.body.source, req.body.destination);

//     res.json({
//         key: stream.key,
//         source: stream.source,
//         destination: stream.destination,
//         currentFps: stream.currentFps,
//         currentKbps: stream.currentKbps,
//         timemark: stream.timemark,
//         start: stream.start,
//     });
// });

// app.delete('/streams/:key', (req, res) => {
//   const {key} = req.params;
//   killStream(key);
//   res.json(serializeStreams());
// });

app.get('/notify', async function(req, res) {
    console.log('notify', JSON.stringify(req.query));

    const {call, name} = req.query;

    const cfg = config.find(
        c => c.primary.indexOf(name) !== -1 || c.backup.indexOf(name) !== -1
    );

    if (!cfg) {
        console.error('config missing');
        res.send('OK');
        return;
    }

    // console.log('found config', cfg);

    const {primary, backup, destination} = cfg;

    const existingStream = getStreams().find(s => s.destination === destination);

    // console.log('found stream', existingStream);

    const isPrimary = primary.indexOf(name) !== -1;

    const isBackup = backup.indexOf(name) !== -1;

    // if primary, kill backup and start primary
    if (call === 'publish' && isPrimary) {
        monitor.stop();
        if (existingStream) {
            await stopStream(existingStream.key);
        }
        startStream(primary, destination);
        monitor.start();
    }

    // if backup, ignore
    if (call === 'publish' && isBackup) {
        console.log('ignoring backup publish');
    }

    // if primary, kill primary (if exists) and start backup
    if (call === 'publish_done' && isPrimary) {
        monitor.stop();
        if (existingStream) {
            await stopStream(existingStream.key);
        }
        startStream(backup, destination);
        monitor.start();
    }

    // if backup, kill backup
    if (call === 'publish_done' && isBackup) {
        if (existingStream) {
            await stopStream(existingStream.key);
        }
    }

    res.send('OK');
});

app.get('/', function (req, res) {
    res.json(getStreams().map(stream => ({
        key: stream.key,
        source: stream.source,
        destination: stream.destination,
        currentFps: stream.currentFps,
        currentKbps: stream.currentKbps,
        timemark: stream.timemark,
        start: stream.start,
    })));
});

server.listen(process.env.PORT || 3000, function listening() {
    console.log('Listening on %d', server.address().port);

    monitor.start();

    // TODO restart nginx so we capture publish events
});

// notify {"app":"ingest","flashver":"","swfurl":"","tcurl":"rtmp://rtmp1.abnsat.com/ingest","pageurl":"","addr":"107.1.139.34","clientid":"1","call":"publish","name":"v1zos2fgbhrir289","type":"live"}
// notify {"app":"ingest","flashver":"TelVue TeleCast 2/2.1.0 FMLE/3.","swfurl":"","tcurl":"rtmp://rtmp.abnsat.com:1935/ingest/","pageurl":"","addr":"12.201.46.14","clientid":"66","call":"publish","name":"vtbkr2rhrlhvvda9","type":"live"}

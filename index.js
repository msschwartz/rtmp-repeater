require('dotenv').config({path: __dirname + '/.env'});
const express = require('express');
const http = require('http');
const nginx = require('./src/nginx');

const app = express();
const server = http.createServer(app);

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

const streams = [
    {
        id: 1,
        name: 'Arabic - AirBox',
        port: 3001,
        source: 'rtmp://localhost/ingest/v1zos2fgbhrir289',
        exec: null,
    },
    {
        id: 2,
        name: 'Trinity - AirBox',
        port: 3002,
        source: 'rtmp://localhost/ingest/zehkcgjtbdblut09',
        exec: null,
    },
    {
        id: 3,
        name: 'Farsi - AirBox',
        port: 3003,
        source: 'rtmp://localhost/ingest/wxpkr2rgbfjqvda9',
        exec: null,
    },
    {
        id: 4,
        name: 'Arabic - Live',
        port: 3001,
        source: 'rtmp://localhost/ingest/live',
        exec: null,
    },
    {
        id: 5,
        name: 'Trinity - Live',
        port: 3002,
        source: 'rtmp://localhost/ingest/live',
        exec: null,
    },
    {
        id: 6,
        name: 'Farsi - Live',
        port: 3003,
        source: 'rtmp://localhost/ingest/live',
        exec: null,
    },
];

app.get('/streams', function (req, res) {
    res.json(streams.map(stream => ({
        id: stream.id,
        name: stream.name,
        active: stream.exec && stream.exec.exitCode === null,
    })));
});

app.post('/streams/:streamId/start', function (req, res) {
    const stream = streams.find(s => String(s.id) === String(req.params.streamId));
    if (stream && stream.exec) {
        stream.exec.kill();
        stream.exec = null;
    }
    if (stream) {
        stream.exec = nginx.run(stream.port, stream.source);
    }
    res.send('OK');
});

app.post('/streams/:streamId/stop', function (req, res) {
    const stream = streams.find(s => String(s.id) === String(req.params.streamId));
    if (stream && stream.exec) {
        stream.exec.kill();
        stream.exec = null;
    }
    res.send('OK');
});

app.get('/', function (req, res) {
    res.render(__dirname + '/views/pages/index', {
        streams: streams.map(stream => ({
            id: stream.id,
            name: stream.name,
            active: stream.exec && stream.exec.exitCode === null,
        })),
    });
});

server.listen(process.env.PORT || 3000, function listening() {
    console.log('Listening on %d', server.address().port);
});

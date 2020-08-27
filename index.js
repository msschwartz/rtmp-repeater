require('dotenv').config({path: __dirname + '/.env'});
const express = require('express');
const http = require('http');
const nginx = require('./src/nginx');

const app = express();
const server = http.createServer(app);

app.use(express.static('public'));
app.set('view engine', 'ejs');

const streams = [
    {
        id: 1,
        name: 'Arabic - AirBox',
        active: true,
        port: 3001,
        source: 'rtmp://localhost/ingest/v1zos2fgbhrir289',
        exec: null,
    },
    {
        id: 2,
        name: 'Trinity - AirBox',
        active: false,
        port: 3002,
        source: 'rtmp://localhost/ingest/zehkcgjtbdblut09',
        exec: null,
    },
    {
        id: 3,
        name: 'Farsi - AirBox',
        active: false,
        port: 3003,
        source: 'rtmp://localhost/ingest/wxpkr2rgbfjqvda9',
        exec: null,
    },
    {
        id: 4,
        name: 'Arabic - Live',
        active: false,
        port: 3001,
        source: 'rtmp://localhost/ingest/live',
        exec: null,
    },
    {
        id: 5,
        name: 'Trinity - Live',
        active: false,
        port: 3002,
        source: 'rtmp://localhost/ingest/live',
        exec: null,
    },
    {
        id: 6,
        name: 'Farsi - Live',
        active: false,
        port: 3003,
        source: 'rtmp://localhost/ingest/live',
        exec: null,
    },
];

app.get('/streams', function (req, res) {
    res.json(streams.map(stream => ({
        id: stream.id,
        name: stream.name,
        active: stream.active,
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
    res.render('pages/index', {streams});
});

server.listen(process.env.PORT || 3000, function listening() {
    console.log('Listening on %d', server.address().port);

    // for (var i = 0; i < streams.length; i++) {
    //     const stream = streams[i];
    //     stream.backupExec = nginx.run(stream.backupConf);
    // }

    // TODO restart nginx so we capture publish events
});

// notify {"app":"ingest","flashver":"...","swfurl":"","tcurl":"rtmp://rtmp1.abnsat.com/ingest","pageurl":"","addr":"107.1.139.34","clientid":"1","call":"publish","name":"v1zos2fgbhrir289","type":"live"}
// notify {"app":"ingest","flashver":"...","swfurl":"","tcurl":"rtmp://rtmp.abnsat.com:1935/ingest/","pageurl":"","addr":"12.201.46.14","clientid":"66","call":"publish","name":"vtbkr2rhrlhvvda9","type":"live"}


// {
//     name: 'arabic',
//     primaryConf: __dirname + '/conf/nginx-arabic-primary.conf',
//     primaryExec: null,
//     backupConf: __dirname + '/conf/nginx-arabic-backup.conf',
//     backupExec: null,
// },
// {
//     name: 'trinity',
//     primaryConf: __dirname + '/conf/nginx-trinity-primary.conf',
//     primaryExec: null,
//     backupConf: __dirname + '/conf/nginx-trinity-backup.conf',
//     backupExec: null,
// },
// {
//     name: 'abnsama',
//     primaryConf: __dirname + '/conf/nginx-abnsama-primary.conf',
//     primaryExec: null,
//     backupConf: __dirname + '/conf/nginx-abnsama-backup.conf',
//     backupExec: null,
// }

require('dotenv').config();
const express = require('express');
const http = require('http');
const nginx = require('./src/nginx');

const app = express();
const server = http.createServer(app);

const streams = [
    {
        name: 'arabic',
        primaryConf: __dirname + '/conf/nginx-arabic-primary.conf',
        primaryExec: null,
        backupConf: __dirname + '/conf/nginx-arabic-backup.conf',
        backupExec: null,
    }
];

app.get('/notify', async function(req, res) {
    console.log('notify', JSON.stringify(req.query));

    const {app, call, name} = req.query;

    const channels = (req.query.channels || '').split(',');

    if (app !== 'ingest' || name !== 'live') {
        console.error('not live show, ignoring notify');
        res.send('OK');
        return;
    }

    for (var i = 0; i < streams.length; i++) {
        const stream = streams[i];

        if (channels.includes(stream.name)) {
            if (call === 'publish') {
                console.log(`killing backup stream ${stream.name}`);
                stream.backupExec && stream.backupExec.kill();
                stream.backupExec = null;
                console.log(`starting primary stream ${stream.name}`);
                stream.primaryExec && stream.primaryExec.kill();
                stream.primaryExec = nginx.run(stream.primaryConf);
            }
            if (call === 'publish_done') {
                console.log(`killing primary stream ${stream.name}`);
                stream.primaryExec && stream.primaryExec.kill();
                stream.primaryExec = null;
                console.log(`starting backup stream ${stream.name}`);
                stream.backupExec && stream.backupExec.kill();
                stream.backupExec = nginx.run(stream.backupConf);
            }
        }
    }

    res.send('OK');
});

app.get('/', function (req, res) {
    res.json(streams.map(stream => ({
        name: stream.name,
        primaryExec: stream.primaryExec,
        backupExec: stream.backupExec,
    })));
});

server.listen(process.env.PORT || 3000, function listening() {
    console.log('Listening on %d', server.address().port);

    for (var i = 0; i < streams.length; i++) {
        const stream = streams[i];
        stream.backupExec = nginx.run(stream.backupConf);
    }

    // TODO restart nginx so we capture publish events
});

// notify {"app":"ingest","flashver":"...","swfurl":"","tcurl":"rtmp://rtmp1.abnsat.com/ingest","pageurl":"","addr":"107.1.139.34","clientid":"1","call":"publish","name":"v1zos2fgbhrir289","type":"live"}
// notify {"app":"ingest","flashver":"...","swfurl":"","tcurl":"rtmp://rtmp.abnsat.com:1935/ingest/","pageurl":"","addr":"12.201.46.14","clientid":"66","call":"publish","name":"vtbkr2rhrlhvvda9","type":"live"}

const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const shortid = require('shortid');
const axios = require('axios');

ffmpeg.setFfmpegPath(ffmpegPath);

const streams = {};

const onstart = key => command => {
    console.log('stream start', key, command);
};

const onprogress = key => info => {
    if (streams[key]) {
        streams[key].currentFps = info.currentFps;
        streams[key].currentKbps = info.currentKbps;
        streams[key].timemark = info.timemark;
    }
};

const onend = key => () => {
    console.error('stream end', key);
    delete streams[key];
};

const onerror = key => error => {
    console.error('stream error', key, error);
    delete streams[key];
};

const onstderr = key => line => {
    // console.log(key, line);
};

const getStreams = () => Object.values(streams);

const startStream = (source, destination) => {
    console.log(`creating stream ${source} => ${destination}`);

    const key = shortid.generate();

    const stream = {
        key,
        source,
        destination,
        currentFps: 0,
        currentKbps: 0,
        timemark: '00:00:00.00',
        start: Date.now(),
        command: ffmpeg()
            .input(source)
            .native()
            .output(destination)
            .videoCodec('copy')
            .audioCodec('copy')
            .format('flv')
            .on('start', onstart(key))
            .on('progress', onprogress(key))
            .on('end', onend(key))
            .on('error', onerror(key))
            .on('stderr', onstderr(key))
    };

    stream.command.run();

    streams[key] = stream;

    return stream;
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const stopStream = async key => {
    console.log(`stopping stream ${key}`);

    if (streams[key]) {
        const [app, name] = streams[key].destination.split('/').slice(-2);

        try {
            streams[key].command.kill();
        } catch (err) {
            console.error('failed to kill stream', err);
        }

        console.log('waiting for ffmpeg task to terminate');
        while (streams[key]) {
            await sleep(500);
        }

        console.log('dropping publisher');
        await axios.get(`http://localhost/control/drop/publisher?app=${app}&name=${name}`);
    }
};

module.exports = {
    getStreams,
    startStream,
    stopStream,
};

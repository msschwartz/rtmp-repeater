const moment = require('moment');
const config = require('./config');
const {getStreams, startStream} = require('./streams');

const CHECK_INTERVAL = 30000;

// monitor streams:
// check if primary is available
// start primary if available
// check if backup is available
// start backup if available
// if primary starts, kill backup and start primary
// if primary ends, kill primary and start backup
// if backup fails, restry in 10 seconds

let timer = null;

let timestamps = {};

const checkStreams = async () => {
    clearTimeout(timer);

    const streams = getStreams();

    for (let i = 0; i < config.length; i++) {
        const c = config[i];
        const stream = streams.find(s => s.destination === c.destination);

        if (!stream) {
            console.log('no stream found, starting backup');
            startStream(c.backup, c.destination);
            timestamps[c.destination] = 0;
        } else {
            const curr = moment.duration(stream.timemark).milliseconds();
            if (curr - timestamps[stream.destination] < CHECK_INTERVAL - 5000) {
                console.log('timemark looks stalled, restarting backup');
                await stopStream(stream.key);
                startStream(c.backup, c.destination);
            } else {
                timestamps[stream.destination] = curr;
            }
        }
    }

    timer = setTimeout(checkStreams, CHECK_INTERVAL);
};

const start = () => {
    timer = setTimeout(checkStreams, 1000);
};

const stop = () => {
    clearTimeout(timer);
};

module.exports = {
    start,
    stop,
};

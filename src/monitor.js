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

const checkStreams = () => {
    clearTimeout(timer);

    const streams = getStreams();

    config.forEach(c => {
        if (!streams.some(s => s.destination === c.destination)) {
            console.log('no stream found, starting backup');
            startStream(c.backup, c.destination);
        }
    });

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
